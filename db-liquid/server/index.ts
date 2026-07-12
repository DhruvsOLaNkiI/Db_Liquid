import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { clearAuthCookie, setAuthCookie } from './auth';
import { clearCsrfCookie, ensureCsrfCookie, requireCsrf, setCsrfCookie } from './csrf';
import { acceptBidOnServer, BidError, placeBidOnServer } from './bids';
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
  getListings,
  getUsers,
  migrateLegacyJsonIfNeeded,
  saveListings,
  saveUsers,
  updateListings,
} from './mongoStore';
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
import { presentUser, serveSignedFile, uploadPrivateFile, attachSignedUrlsToDocs, attachSignedUrlsToListingMedia } from './routes/v1/uploads';
import {
  assertLoginAllowed,
  getClientIp,
  recordLoginFailure,
  recordLoginSuccess,
} from './loginProtection';
import { applySecurityHeaders } from './securityHeaders';
import {
  adminUsersBodySchema,
  changePasswordBodySchema,
  listingsArrayBodySchema,
  loginBodySchema,
  patchCurrentUserBodySchema,
  acceptBidBodySchema,
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
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
applySecurityHeaders(app);

function getViewerId(req: AuthenticatedRequest) {
  return getViewerIdFromRequest(req);
}

function randomId() {
  return crypto.randomUUID();
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
    // Public probe only — no URI, db name, or connection details (SEC-012)
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

/** Issue / refresh CSRF cookie for double-submit protection (SEC-010). */
app.get('/api/auth/csrf', (req, res) => {
  const token = ensureCsrfCookie(req, res);
  res.json({ ok: true, csrfToken: token });
});

app.post('/api/auth/login', requireCsrf, validateBody(loginBodySchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const ip = getClientIp(req);

  const guard = assertLoginAllowed(email, ip);
  if (guard.ok === false) {
    res.setHeader('Retry-After', String(guard.retryAfterSec));
    res.status(guard.status).json({ error: guard.error, reason: guard.reason, retryAfterSec: guard.retryAfterSec });
    return;
  }

  try {
    const users = await getUsers();
    const index = users.findIndex(
      (entry) =>
        typeof entry.email === 'string' && entry.email.toLowerCase() === email,
    );

    if (index === -1) {
      recordLoginFailure(email, ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = users[index];
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      recordLoginFailure(email, ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    recordLoginSuccess(email, ip);

    let savedUser = users[index];
    let needsSave = false;

    if (user.password && !isPasswordHashed(user.password)) {
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

    setAuthCookie(res, savedUser.id, dualRoles);
    setCsrfCookie(res);
    res.json({ ok: true, user: await presentUser(savedUser, sanitizeUser(savedUser, savedUser.id)) });
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
    ensureCsrfCookie(req, res);
    res.json({ ok: true, user: await presentUser(user, sanitizeUser(user, user.id)) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/register', requireCsrf, validateBody(registerBodySchema), async (req, res) => {
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

app.get('/api/v1/files', serveSignedFile);

app.get('/api/listings', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const listings = await getListings();
    const sanitized = sanitizeListings(listings, viewerId);
    const withSignedMedia = await Promise.all(
      sanitized.map((listing) => attachSignedUrlsToListingMedia(listing, viewerId)),
    );
    res.json(withSignedMedia);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/listings/:id', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const listings = await getListings();
    const listing = listings.find((entry) => entry.id === req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    const sanitized = await attachSignedUrlsToListingMedia(
      sanitizeListing(listing, viewerId),
      viewerId,
    );
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
  requireCsrf,
  validateBody(placeBidBodySchema),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await placeBidOnServer({
        listingId: req.params.id,
        userId: req.auth!.userId,
        bidTotal: (req.body as { bidTotal: number }).bidTotal,
      });
      const listing = await attachSignedUrlsToListingMedia(
        sanitizeListing(result.listing as Parameters<typeof sanitizeListing>[0], req.auth!.userId),
        req.auth!.userId,
      );
      res.status(201).json({
        ok: true,
        bid: result.bid,
        creditsRemaining: result.creditsRemaining,
        listing,
      });
    } catch (error) {
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
      const result = await acceptBidOnServer({
        listingId: req.params.id,
        bidId: (req.body as { bidId: string }).bidId,
        sellerId: req.auth!.userId,
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

app.post(
  '/api/admin/verification/review',
  requireAdmin,
  requireCsrf,
  validateBody(reviewVerificationBodySchema),
  async (req, res) => {
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

    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

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
  async (req, res) => {
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
    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API route not found.' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  await connectMongo();
  await migrateLegacyJsonIfNeeded();

  app.listen(PORT, '0.0.0.0', () => {
    const info = getMongoInfo();
    console.log(`DB Liquid running on port ${PORT}`);
    console.log(`Storage: MongoDB (${info.db})`);
    if (existsSync(distPath)) {
      console.log('Serving frontend from dist/');
    }
  });
}

start().catch((error) => {
  console.error('Failed to start API server:', error.message);
  console.error('Set MONGODB_URI_ATLAS in .env to your MongoDB Atlas connection string');
  process.exit(1);
});
