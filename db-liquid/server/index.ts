import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { clearAuthCookie, setAuthCookie } from './auth';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const PORT = Number(process.env.PORT || process.env.API_PORT) || 3001;

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

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
    res.json({ ok: true, storage: 'mongodb', ...getMongoInfo() });
  } catch (error) {
    res.status(503).json({
      ok: false,
      storage: 'mongodb',
      error: error instanceof Error ? error.message : 'MongoDB connection failed',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const users = await getUsers();
    const index = users.findIndex(
      (entry) =>
        typeof entry.email === 'string' && entry.email.toLowerCase() === email,
    );

    if (index === -1) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = users[index];
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

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
    res.json({ ok: true, user: sanitizeUser(savedUser, savedUser.id) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find((entry) => entry.id === req.auth!.userId);
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ error: 'Session invalid.' });
      return;
    }
    res.json({ ok: true, user: sanitizeUser(user, user.id) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  if (!name) {
    res.status(400).json({ error: 'Enter your name.' });
    return;
  }
  if (!phone) {
    res.status(400).json({ error: 'Enter your phone number.' });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

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
    res.status(201).json({ ok: true, user: sanitizeUser(user, user.id) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const currentPassword =
    typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!userId || !currentPassword || !newPassword) {
    res.status(400).json({ error: 'All password fields are required.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }
  if (currentPassword === newPassword) {
    res.status(400).json({ error: 'New password must be different from your current password.' });
    return;
  }

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

app.put('/api/users', requireAuth, deprecatedBulkUsersPut);

app.patch('/api/v1/users/me', requireAuth, patchCurrentUser);

app.put('/api/v1/admin/users', requireAdmin, putAdminUsers);

app.get('/api/listings', optionalAuth, async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const listings = await getListings();
    res.json(sanitizeListings(listings, viewerId));
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
    res.json(sanitizeListing(listing, viewerId));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/listings/:id/record-view', optionalAuth, async (req, res) => {
  const visitorId = typeof req.body?.visitorId === 'string' ? req.body.visitorId.trim() : '';
  const viewerUserId = getViewerId(req);

  if (!visitorId) {
    res.status(400).json({ error: 'visitorId is required.' });
    return;
  }

  try {
    const listings = await getListings();
    const index = listings.findIndex((entry) => entry.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const listing = listings[index] as Record<string, unknown>;
    const updated = applyListingView(listing, visitorId, viewerUserId);

    if (!updated) {
      res.json({
        ok: true,
        skipped: true,
        viewCount: listing.viewCount ?? 0,
        uniqueVisitorCount: listing.uniqueVisitorCount ?? 0,
        returnVisitorCount: listing.returnVisitorCount ?? 0,
      });
      return;
    }

    listings[index] = updated;
    await saveListings(listings);

    res.json({
      ok: true,
      viewCount: updated.viewCount ?? 0,
      uniqueVisitorCount: updated.uniqueVisitorCount ?? 0,
      returnVisitorCount: updated.returnVisitorCount ?? 0,
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.put('/api/listings', requireAuth, deprecatedBulkListingsPut);

app.put('/api/v1/listings/sync', requireAuth, putListingsSync);

app.put('/api/v1/admin/listings', requireAdmin, putAdminListings);

app.get('/api/admin/verification-queue', requireAdmin, async (_req, res) => {
  try {
    const [listings, users] = await Promise.all([getListings(), getUsers()]);
    const usersById = new Map(users.map((user) => [user.id, user]));

    const queue = listings
      .map((listing) => {
        const raw = listing as Record<string, unknown>;
        const sellerId = String(raw.sellerId ?? '');
        const seller = usersById.get(sellerId);
        return toAdminListing(raw, seller as Parameters<typeof toAdminListing>[1]);
      })
      .sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );

    res.json({ listings: queue });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/admin/verification/review', requireAdmin, async (req, res) => {
  const listingId = typeof req.body?.listingId === 'string' ? req.body.listingId.trim() : '';
  const documentId = typeof req.body?.documentId === 'string' ? req.body.documentId.trim() : '';
  const status = req.body?.status;

  if (!listingId || !documentId) {
    res.status(400).json({ error: 'listingId and documentId are required.' });
    return;
  }
  if (status !== 'approved' && status !== 'rejected') {
    res.status(400).json({ error: 'status must be approved or rejected.' });
    return;
  }

  try {
    const listings = await getListings();
    const index = listings.findIndex((entry) => entry.id === listingId);
    if (index === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const listing = listings[index] as Record<string, unknown>;
    const documents = (listing.verificationDocuments as { id: string }[] | undefined) ?? [];
    if (!documents.some((doc) => doc.id === documentId)) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    listings[index] = applyDocumentReview(listing, documentId, status);
    await saveListings(listings);
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

app.post('/api/admin/users/review-kyc', requireAdmin, async (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
  const field = req.body?.field;
  const verified = req.body?.verified;

  if (!userId) {
    res.status(400).json({ error: 'userId is required.' });
    return;
  }
  if (field !== 'aadhar' && field !== 'pan') {
    res.status(400).json({ error: 'field must be aadhar or pan.' });
    return;
  }
  if (typeof verified !== 'boolean') {
    res.status(400).json({ error: 'verified must be a boolean.' });
    return;
  }

  try {
    const users = await getUsers();
    const index = users.findIndex((entry) => entry.id === userId);
    if (index === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const result = reviewUserKyc(users[index] as Record<string, unknown>, field, verified);
    if (!result.ok) {
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
