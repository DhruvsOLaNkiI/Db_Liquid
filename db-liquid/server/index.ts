import 'dotenv/config';
import { initServerSentry, setupSentryErrorHandler, Sentry } from './sentry';

// MON-001 — init before routes so startup + request errors can be captured
initServerSentry();

import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearAuthCookie, setAuthCookie } from './auth';
import { clearCsrfCookie, ensureCsrfCookie, requireCsrf, setCsrfCookie } from './csrf';
import { acceptBidOnServer, BidError, declineAcceptedBidOnServer, placeBidOnServer } from './bids';
import { appendBidAudit, listBidAudit } from './bidAudit';
import { closeExpiredAuctions, startAuctionCloser, stopAuctionCloser } from './auctionCloser';
import { forceHttps } from './httpsRedirect';
import { applyCors } from './cors';
import { registerGracefulShutdown } from './shutdown';
import {
  getViewerIdFromRequest,
  optionalAuth,
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from './authMiddleware';
import { connectMongo, getMongoInfo } from './db';
import { applyListingView } from './listingViews';
import {
  findUserByEmail,
  getListingById,
  getListings,
  getListingsPage,
  getUsers,
  migrateLegacyJsonIfNeeded,
  saveListings,
  saveUsers,
  updateListings,
} from './mongoStore';
import { applyStaticAssetCaching } from './staticCache';
import {
  reviewVerificationDocument as applyDocumentReview,
  reviewUserKyc,
  toAdminListing,
  toAdminUser,
} from './verificationAdmin';
import { sanitizeListing, sanitizeListings, sanitizeUser, sanitizeUsers } from './sanitize';
import {
  hashPassword,
  isPasswordHashed,
  verifyPassword,
} from './password';
import {
  deprecatedBulkListingsPut,
  putAdminListings,
  putListingsSync,
} from './routes/v1/listings';
import {
  deprecatedBulkUsersPut,
  patchCurrentUser,
  putAdminUsers,
} from './routes/v1/users';
import { presentUser, serveSignedFile, uploadPrivateFile, uploadBinaryPrivateFile, attachSignedUrlsToDocs, attachSignedUrlsToListingMedia } from './routes/v1/uploads';
import {
  assertLoginAllowed,
  getClientIp,
  recordLoginFailure,
  recordLoginSuccess,
} from './loginProtection';
import { applySecurityHeaders } from './securityHeaders';
import { applyApiRateLimit, loginRateLimit, placeBidRateLimit, signupRateLimit } from './rateLimit';
import { requireCloudflareProxy } from './cloudflare';
import { applyApiNoStoreCache } from './apiCache';
import { logger, requestLoggingMiddleware, exposeRequestId, type RequestWithLog } from './logger';
import { trackProductEvent, listProductEvents, type FunnelEvent } from './productEvents';
import { appendAdminAudit, listAdminAudit } from './adminAudit';
import {
  adminUsersBodySchema,
  changePasswordBodySchema,
  listingsArrayBodySchema,
  loginBodySchema,
  patchCurrentUserBodySchema,
  acceptBidBodySchema,
  declineAcceptedBidBodySchema,
  placeBidBodySchema,
  recordViewBodySchema,
  registerBodySchema,
  reviewKycBodySchema,
  reviewVerificationBodySchema,
  uploadBodySchema,
} from './schemas';
import { validateBody } from './validate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const PORT = Number(process.env.PORT || process.env.API_PORT) || 3001;

const app = express();
// Behind Hostinger / reverse proxies — needed for accurate client IP rate limits
app.set('trust proxy', 1);
app.use(forceHttps);
applyCors(app);
app.use(requestLoggingMiddleware());
app.use(exposeRequestId);
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
applySecurityHeaders(app);
applyApiRateLimit(app);
applyApiNoStoreCache(app);
app.use(requireCloudflareProxy);

function getViewerId(req: AuthenticatedRequest) {
  return getViewerIdFromRequest(req);
}

function randomId() {
  return crypto.randomUUID();
}

/** MON-004 — structured log + Sentry for bid route failures (payment alerts deferred). */
function reportBidFailure(req: AuthenticatedRequest, action: string, error: unknown) {
  const requestId = String((req as RequestWithLog).id ?? '');
  const listingId = req.params.id;
  if (error instanceof BidError) {
    logger.warn(
      { action, listingId, requestId, status: error.status, message: error.message },
      'bid.rejected',
    );
    if (error.status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('bid.action', action);
        scope.setTag('requestId', requestId);
        scope.setLevel('error');
        Sentry.captureException(error);
      });
    } else {
      Sentry.withScope((scope) => {
        scope.setTag('bid.action', action);
        scope.setTag('requestId', requestId);
        scope.setLevel('warning');
        Sentry.captureMessage(`bid.${action}: ${error.message}`);
      });
    }
    return;
  }
  logger.error({ err: error, action, listingId, requestId }, 'bid.failed');
  Sentry.withScope((scope) => {
    scope.setTag('bid.action', action);
    scope.setTag('requestId', requestId);
    Sentry.captureException(error);
  });
}

function ensureDualRoles(roles: string[]): string[] {
  const set = new Set(roles.map(String));
  set.add('buyer');
  set.add('seller');
  return [...set];
}

app.get('/api/health', async (_req, res) => {
  try {
    await connectMongo();
    // Public probe only — no URI, db name, or connection details (SEC-012 / MON-003)
    res.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'health.check_failed');
    Sentry.captureException(error);
    res.status(503).json({ ok: false });
  }
});

/** Issue / refresh CSRF cookie for double-submit protection (SEC-010). */
app.get('/api/auth/csrf', (req, res) => {
  const token = ensureCsrfCookie(req, res);
  res.json({ ok: true, csrfToken: token });
});

app.post('/api/auth/login', loginRateLimit, requireCsrf, validateBody(loginBodySchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const ip = getClientIp(req);

  const guard = assertLoginAllowed(email, ip);
  if (guard.ok === false) {
    res.setHeader('Retry-After', String(guard.retryAfterSec));
    res.status(guard.status).json({ error: guard.error, reason: guard.reason, retryAfterSec: guard.retryAfterSec });
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      recordLoginFailure(email, ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === user.id);
    if (index === -1) {
      recordLoginFailure(email, ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await verifyPassword(password, String(user.password ?? ''));
    if (!valid) {
      recordLoginFailure(email, ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    recordLoginSuccess(email, ip);

    let savedUser = users[index];
    let needsSave = false;

    if (user.password && !isPasswordHashed(String(user.password))) {
      savedUser = { ...savedUser, password: await hashPassword(password) };
      needsSave = true;
    }

    const dualRoles = ensureDualRoles(Array.isArray(savedUser.roles) ? savedUser.roles.map(String) : []);
    if (JSON.stringify(savedUser.roles) !== JSON.stringify(dualRoles)) {
      savedUser = { ...savedUser, roles: dualRoles };
      needsSave = true;
    }

    if (needsSave) {
      users[index] = savedUser;
      await saveUsers(users);
    }

    setAuthCookie(res, String(savedUser.id), dualRoles);
    setCsrfCookie(res);
    res.json({ ok: true, user: await presentUser(savedUser, sanitizeUser(savedUser, String(savedUser.id))) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/logout', requireCsrf, (_req, res) => {
  clearAuthCookie(res);
  clearCsrfCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await getUsers();
    const user = users.find((entry) => entry.id === req.auth!.userId);
    if (!user) {
      clearAuthCookie(res);
      clearCsrfCookie(res);
      res.status(401).json({ error: 'Session invalid.' });
      return;
    }
    const roles = ensureDualRoles(Array.isArray(user.roles) ? user.roles.map(String) : []);
    // Refresh cookie so role grants (e.g. admin in Mongo) apply without a full re-login.
    if (JSON.stringify(req.auth!.roles) !== JSON.stringify(roles)) {
      setAuthCookie(res, user.id, roles);
    }
    ensureCsrfCookie(req, res);
    const presented = { ...user, roles };
    res.json({ ok: true, user: await presentUser(presented, sanitizeUser(presented, user.id)) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/register', signupRateLimit, requireCsrf, validateBody(registerBodySchema), async (req, res) => {
  const { email, password, name, phone } = req.body as {
    email: string;
    password: string;
    name: string;
    phone: string;
  };

  try {
    const users = await getUsers();
    if (users.some((entry) => String(entry.email).toLowerCase() === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user = {
      id: randomId(),
      email,
      phone,
      name,
      password: await hashPassword(password),
      roles: ['buyer', 'seller'],
      createdAt: new Date().toISOString(),
      credits: 0,
    };

    users.push(user);
    await saveUsers(users);
    setAuthCookie(res, user.id, user.roles);
    setCsrfCookie(res);
    void trackProductEvent({
      event: 'signup',
      userId: user.id,
      requestId: String((req as RequestWithLog).id ?? ''),
    });
    res.status(201).json({ ok: true, user: await presentUser(user, sanitizeUser(user, user.id)) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post(
  '/api/auth/change-password',
  requireAuth,
  requireCsrf,
  validateBody(changePasswordBodySchema),
  async (req: AuthenticatedRequest, res) => {
  const userId = req.auth!.userId;
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  try {
    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = users[index];
    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    users[index] = { ...user, password: await hashPassword(newPassword) };
    await saveUsers(users);
    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/users', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const users = await getUsers();
    res.json(sanitizeUsers(users, viewerId));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.put('/api/users', requireAuth, requireCsrf, deprecatedBulkUsersPut);

app.patch(
  '/api/v1/users/me',
  requireAuth,
  requireCsrf,
  validateBody(patchCurrentUserBodySchema),
  patchCurrentUser,
);

app.put(
  '/api/v1/admin/users',
  requireAdmin,
  requireCsrf,
  validateBody(adminUsersBodySchema),
  putAdminUsers,
);

app.post(
  '/api/v1/uploads',
  requireAuth,
  requireCsrf,
  validateBody(uploadBodySchema),
  uploadPrivateFile,
);

app.post(
  '/api/v1/uploads/binary',
  requireAuth,
  requireCsrf,
  express.raw({ type: () => true, limit: '50mb' }),
  uploadBinaryPrivateFile,
);

app.get('/api/v1/files', serveSignedFile);

app.get('/api/listings', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const wantsPagination = Number.isFinite(pageRaw) || Number.isFinite(limitRaw);

    if (wantsPagination) {
      const pageResult = await getListingsPage({
        page: Number.isFinite(pageRaw) ? pageRaw : 1,
        limit: Number.isFinite(limitRaw) ? limitRaw : 20,
      });
      const sanitized = sanitizeListings(pageResult.listings, viewerId);
      const withSignedMedia = await Promise.all(
        sanitized.map((listing) => attachSignedUrlsToListingMedia(listing, viewerId)),
      );
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({
        listings: withSignedMedia,
        page: pageResult.page,
        limit: pageResult.limit,
        total: pageResult.total,
        totalPages: pageResult.totalPages,
      });
      return;
    }

    const listings = await getListings({ slim: true });
    const sanitized = sanitizeListings(listings, viewerId);
    const withSignedMedia = await Promise.all(
      sanitized.map((listing) => attachSignedUrlsToListingMedia(listing, viewerId)),
    );
    // PERF-009: bid-sensitive listing payloads must not be cached publicly
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(withSignedMedia);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/listings/:id', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const listing = await getListingById(req.params.id, { slim: true });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    const sanitized = await attachSignedUrlsToListingMedia(
      sanitizeListing(listing, viewerId),
      viewerId,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(sanitized);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post(
  '/api/listings/:id/record-view',
  optionalAuth,
  requireCsrf,
  validateBody(recordViewBodySchema),
  async (req, res) => {
  const { visitorId } = req.body as { visitorId: string };
  const viewerUserId = getViewerId(req);

  try {
    const result = await updateListings(async (listings) => {
      const index = listings.findIndex((entry) => (entry as { id?: string }).id === req.params.id);
      if (index === -1) {
        return { kind: 'missing' as const };
      }

      const listing = listings[index] as Record<string, unknown>;
      const updated = applyListingView(listing, visitorId, viewerUserId);

      if (!updated) {
        return {
          kind: 'skipped' as const,
          viewCount: listing.viewCount ?? 0,
          uniqueVisitorCount: listing.uniqueVisitorCount ?? 0,
          returnVisitorCount: listing.returnVisitorCount ?? 0,
        };
      }

      listings[index] = updated;
      await saveListings(listings);
      return {
        kind: 'saved' as const,
        viewCount: updated.viewCount ?? 0,
        uniqueVisitorCount: updated.uniqueVisitorCount ?? 0,
        returnVisitorCount: updated.returnVisitorCount ?? 0,
      };
    });

    if (result.kind === 'missing') {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    if (result.kind === 'skipped') {
      res.json({
        ok: true,
        skipped: true,
        viewCount: result.viewCount,
        uniqueVisitorCount: result.uniqueVisitorCount,
        returnVisitorCount: result.returnVisitorCount,
      });
      return;
    }

    res.json({
      ok: true,
      viewCount: result.viewCount,
      uniqueVisitorCount: result.uniqueVisitorCount,
      returnVisitorCount: result.returnVisitorCount,
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.put('/api/listings', requireAuth, requireCsrf, deprecatedBulkListingsPut);

app.post(
  '/api/listings/:id/bids',
  requireAuth,
  placeBidRateLimit,
  requireCsrf,
  validateBody(placeBidBodySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      // Persist closed state for any expired auctions before accepting a new bid.
      await closeExpiredAuctions();

      const body = req.body as { bidTotal: number; idempotencyKey: string };
      const result = await placeBidOnServer({
        listingId: req.params.id,
        userId: req.auth!.userId,
        bidTotal: body.bidTotal,
        idempotencyKey: body.idempotencyKey,
      });

      try {
        await appendBidAudit({
          action: result.idempotent ? 'place_replay' : 'place',
          listingId: req.params.id,
          bidId: result.bid.id,
          actorUserId: req.auth!.userId,
          bidderUserId: result.bid.bidderUserId,
          bidderName: result.bid.bidderName,
          bidTotal: Number(result.bid.bidTotal ?? body.bidTotal),
          amountPerSqFt: result.bid.amountPerSqFt,
          idempotencyKey: body.idempotencyKey,
          ip: getClientIp(req),
          userAgent: String(req.headers['user-agent'] ?? ''),
        });
      } catch (auditError) {
        logger.error({ err: auditError }, 'bid-audit place append failed');
      }

      if (!result.idempotent) {
        void trackProductEvent({
          event: 'place_bid',
          userId: req.auth!.userId,
          listingId: req.params.id,
          bidId: result.bid.id,
          requestId: String((req as RequestWithLog).id ?? ''),
          meta: { bidTotal: Number(result.bid.bidTotal ?? body.bidTotal) },
        });
      }

      const listing = await attachSignedUrlsToListingMedia(
        sanitizeListing(result.listing as Parameters<typeof sanitizeListing>[0], req.auth!.userId),
        req.auth!.userId,
      );
      res.status(result.idempotent ? 200 : 201).json({
        ok: true,
        bid: result.bid,
        creditsRemaining: result.creditsRemaining,
        listing,
        idempotent: result.idempotent,
      });
    } catch (error) {
      reportBidFailure(req, 'place_bid', error);
      if (error instanceof BidError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  },
);

app.post(
  '/api/listings/:id/accept-bid',
  requireAuth,
  requireCsrf,
  validateBody(acceptBidBodySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = (req.body as { bidId: string }).bidId;
      const result = await acceptBidOnServer({
        listingId: req.params.id,
        bidId,
        sellerId: req.auth!.userId,
      });

      try {
        await appendBidAudit({
          action: 'accept',
          listingId: req.params.id,
          bidId: result.bid.id,
          actorUserId: req.auth!.userId,
          bidderUserId: result.bid.bidderUserId,
          bidderName: result.bid.bidderName,
          bidTotal: Number(
            result.bid.bidTotal ??
              result.bid.amountPerSqFt *
                Number((result.listing as { areaSqFt?: number }).areaSqFt ?? 0),
          ),
          amountPerSqFt: result.bid.amountPerSqFt,
          ip: getClientIp(req),
          userAgent: String(req.headers['user-agent'] ?? ''),
        });
      } catch (auditError) {
        logger.error({ err: auditError }, 'bid-audit accept append failed');
      }

      void trackProductEvent({
        event: 'accept_bid',
        userId: req.auth!.userId,
        listingId: req.params.id,
        bidId: result.bid.id,
        requestId: String((req as RequestWithLog).id ?? ''),
      });

      const listing = await attachSignedUrlsToListingMedia(
        sanitizeListing(result.listing as Parameters<typeof sanitizeListing>[0], req.auth!.userId),
        req.auth!.userId,
      );
      res.json({
        ok: true,
        bid: result.bid,
        listing,
      });
    } catch (error) {
      reportBidFailure(req, 'accept_bid', error);
      if (error instanceof BidError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  },
);

app.post(
  '/api/listings/:id/decline-bid',
  requireAuth,
  requireCsrf,
  validateBody(declineAcceptedBidBodySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await declineAcceptedBidOnServer({
        listingId: req.params.id,
        sellerId: req.auth!.userId,
      });

      try {
        await appendBidAudit({
          action: 'decline',
          listingId: req.params.id,
          bidId: result.declinedBid.id,
          actorUserId: req.auth!.userId,
          bidderUserId: result.declinedBid.bidderUserId,
          bidderName: result.declinedBid.bidderName,
          bidTotal: Number(result.declinedBid.bidTotal ?? 0),
          amountPerSqFt: result.declinedBid.amountPerSqFt,
          ip: getClientIp(req),
          userAgent: String(req.headers['user-agent'] ?? ''),
        });
        if (result.declinedBid.creditRefundedAt) {
          await appendBidAudit({
            action: 'refund',
            listingId: req.params.id,
            bidId: result.declinedBid.id,
            actorUserId: req.auth!.userId,
            bidderUserId: result.declinedBid.bidderUserId,
            bidderName: result.declinedBid.bidderName,
            bidTotal: Number(result.declinedBid.bidTotal ?? 0),
            amountPerSqFt: result.declinedBid.amountPerSqFt,
            ip: getClientIp(req),
            userAgent: String(req.headers['user-agent'] ?? ''),
          });
        }
      } catch (auditError) {
        logger.error({ err: auditError }, 'bid-audit decline/refund append failed');
      }

      void trackProductEvent({
        event: 'decline_bid',
        userId: req.auth!.userId,
        listingId: req.params.id,
        bidId: result.declinedBid.id,
        requestId: String((req as RequestWithLog).id ?? ''),
        meta: { creditRefunded: Boolean(result.declinedBid.creditRefundedAt) },
      });

      const listing = await attachSignedUrlsToListingMedia(
        sanitizeListing(result.listing as Parameters<typeof sanitizeListing>[0], req.auth!.userId),
        req.auth!.userId,
      );
      res.json({
        ok: true,
        listing,
        declinedBid: result.declinedBid,
        creditsRemaining: result.creditsRemaining,
      });
    } catch (error) {
      reportBidFailure(req, 'decline_bid', error);
      if (error instanceof BidError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  },
);

app.put(
  '/api/v1/listings/sync',
  requireAuth,
  requireCsrf,
  validateBody(listingsArrayBodySchema),
  putListingsSync,
);

app.put(
  '/api/v1/admin/listings',
  requireAdmin,
  requireCsrf,
  validateBody(listingsArrayBodySchema),
  putAdminListings,
);

app.get('/api/admin/verification-queue', requireAdmin, async (_req, res) => {
  try {
    const [listings, users] = await Promise.all([getListings(), getUsers()]);
    const usersById = new Map(users.map((user) => [user.id, user]));

    const queue = await Promise.all(
      listings.map(async (listing) => {
        const raw = listing as Record<string, unknown>;
        const sellerId = String(raw.sellerId ?? '');
        const seller = usersById.get(sellerId);
        const adminListing = toAdminListing(raw, seller as Parameters<typeof toAdminListing>[1]);
        adminListing.verificationDocuments = await attachSignedUrlsToDocs(
          adminListing.verificationDocuments,
        );
        adminListing.propertyPhotos = await attachSignedUrlsToDocs(adminListing.propertyPhotos);
        return adminListing;
      }),
    );

    queue.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    res.json({ listings: queue });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

/** Immutable bid audit log for disputes (BID-008) — admin read only. */
app.get('/api/admin/bid-audit', requireAdmin, async (req, res) => {
  try {
    const listingId =
      typeof req.query.listingId === 'string' ? req.query.listingId.trim() : undefined;
    const bidId = typeof req.query.bidId === 'string' ? req.query.bidId.trim() : undefined;
    const ip = typeof req.query.ip === 'string' ? req.query.ip.trim() : undefined;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const entries = await listBidAudit({
      listingId: listingId || undefined,
      bidId: bidId || undefined,
      ip: ip || undefined,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    });
    res.json({ ok: true, entries });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

/** Manually run expired-auction closer (BID-009). Also runs on an interval. */
app.post('/api/admin/close-expired-auctions', requireAdmin, requireCsrf, async (_req, res) => {
  try {
    const result = await closeExpiredAuctions();
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post(
  '/api/admin/verification/review',
  requireAdmin,
  requireCsrf,
  validateBody(reviewVerificationBodySchema),
  async (req: AuthenticatedRequest, res) => {
  const { listingId, documentId, status } = req.body as {
    listingId: string;
    documentId: string;
    status: 'approved' | 'rejected';
  };

  try {
    const result = await updateListings(async (listings) => {
      const index = listings.findIndex((entry) => (entry as { id?: string }).id === listingId);
      if (index === -1) {
        return { kind: 'missing-listing' as const };
      }

      const listing = listings[index] as Record<string, unknown>;
      const documents = (listing.verificationDocuments as { id: string }[] | undefined) ?? [];
      if (!documents.some((doc) => doc.id === documentId)) {
        return { kind: 'missing-document' as const };
      }

      listings[index] = applyDocumentReview(listing, documentId, status);
      await saveListings(listings);
      return { kind: 'saved' as const };
    });

    if (result.kind === 'missing-listing') {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    if (result.kind === 'missing-document') {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    try {
      await appendAdminAudit({
        action: status === 'approved' ? 'listing_doc_approve' : 'listing_doc_reject',
        actorUserId: req.auth!.userId,
        listingId,
        documentId,
        detail: { status },
        ip: getClientIp(req),
        requestId: String((req as RequestWithLog).id ?? ''),
      });
    } catch (auditError) {
      logger.error({ err: auditError }, 'admin-audit listing review failed');
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.delete(
  '/api/admin/listings/:id',
  requireAdmin,
  requireCsrf,
  async (req: AuthenticatedRequest, res) => {
    const listingId = String(req.params.id ?? '').trim();
    if (!listingId) {
      res.status(400).json({ error: 'Listing id is required.' });
      return;
    }

    try {
      const listings = await getListings();
      const index = listings.findIndex((entry) => String((entry as { id?: string }).id ?? '') === listingId);
      if (index === -1) {
        res.status(404).json({ error: 'Listing not found.' });
        return;
      }

      const removed = listings[index] as {
        id?: string;
        sellerId?: string;
        location?: string;
        propertyType?: string;
      };
      listings.splice(index, 1);
      await saveListings(listings);

      try {
        await appendAdminAudit({
          action: 'listing_delete',
          actorUserId: req.auth!.userId,
          targetUserId: removed.sellerId ? String(removed.sellerId) : undefined,
          listingId,
          detail: {
            location: removed.location,
            propertyType: removed.propertyType,
          },
          ip: getClientIp(req),
          requestId: String((req as RequestWithLog).id ?? ''),
        });
      } catch (auditError) {
        logger.error({ err: auditError }, 'admin-audit listing delete failed');
      }

      res.json({ ok: true, deletedId: listingId });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
    }
  },
);

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const [users, listings] = await Promise.all([getUsers(), getListings()]);
    const listingCountBySeller = new Map<string, number>();

    for (const listing of listings) {
      const sellerId = String((listing as { sellerId?: string }).sellerId ?? '');
      if (!sellerId) continue;
      listingCountBySeller.set(sellerId, (listingCountBySeller.get(sellerId) ?? 0) + 1);
    }

    const profiles = users
      .map((user) =>
        toAdminUser(user as Parameters<typeof toAdminUser>[0], listingCountBySeller.get(user.id) ?? 0),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ users: profiles });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post(
  '/api/admin/users/review-kyc',
  requireAdmin,
  requireCsrf,
  validateBody(reviewKycBodySchema),
  async (req: AuthenticatedRequest, res) => {
  const { userId, field, verified } = req.body as {
    userId: string;
    field: 'aadhar' | 'pan';
    verified: boolean;
  };

  try {
    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const result = reviewUserKyc(users[index] as Record<string, unknown>, field, verified);
    if (result.ok === false) {
      res.status(400).json({ error: result.error });
      return;
    }

    users[index] = result.user;
    await saveUsers(users);

    const action =
      field === 'aadhar'
        ? verified
          ? 'kyc_aadhar_verify'
          : 'kyc_aadhar_unverify'
        : verified
          ? 'kyc_pan_verify'
          : 'kyc_pan_unverify';
    try {
      await appendAdminAudit({
        action,
        actorUserId: req.auth!.userId,
        targetUserId: userId,
        detail: { field, verified },
        ip: getClientIp(req),
        requestId: String((req as RequestWithLog).id ?? ''),
      });
    } catch (auditError) {
      logger.error({ err: auditError }, 'admin-audit kyc review failed');
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/admin/product-events', requireAdmin, async (req, res) => {
  try {
    const event = typeof req.query.event === 'string' ? (req.query.event as FunnelEvent) : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const entries = await listProductEvents({
      event: event || undefined,
      userId: userId || undefined,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    });
    res.json({ ok: true, entries });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/admin/audit', requireAdmin, async (req, res) => {
  try {
    const targetUserId =
      typeof req.query.targetUserId === 'string' ? req.query.targetUserId.trim() : undefined;
    const listingId =
      typeof req.query.listingId === 'string' ? req.query.listingId.trim() : undefined;
    const limitRaw = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const entries = await listAdminAudit({
      targetUserId: targetUserId || undefined,
      listingId: listingId || undefined,
      limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
    });
    res.json({ ok: true, entries });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

if (existsSync(distPath)) {
  applyStaticAssetCaching(app, distPath);
}

// MON-001 — after all routes
setupSentryErrorHandler(app);

async function start() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-this')) {
      throw new Error('JWT_SECRET must be set to a strong unique value in production (INFRA-002).');
    }
    if (!process.env.MONGODB_URI_ATLAS) {
      throw new Error('MONGODB_URI_ATLAS is required (INFRA-002).');
    }
  }

  logger.info('Connecting to MongoDB…');
  await connectMongo();
  logger.info('Running store migration check…');
  await migrateLegacyJsonIfNeeded();

  const server = app.listen(PORT, '0.0.0.0', () => {
    const info = getMongoInfo();
    logger.info({ port: PORT, db: info.db }, 'DB Liquid API started');
    if (existsSync(distPath)) {
      logger.info('Serving frontend from dist/');
    }
    startAuctionCloser();
  });

  registerGracefulShutdown({
    server,
    stopBackgroundJobs: stopAuctionCloser,
  });
}

start().catch((error) => {
  logger.error({ err: error }, 'Failed to start API server');
  console.error('Set MONGODB_URI_ATLAS in .env to your MongoDB Atlas connection string');
  Sentry.captureException(error);
  void Sentry.close(2000).finally(() => process.exit(1));
});
