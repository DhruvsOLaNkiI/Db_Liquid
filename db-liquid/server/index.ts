import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { connectMongo, getMongoInfo } from './db';
import { mergeListingsForSave } from './mergeListings';
import { applyListingView } from './listingViews';
import { mergeUsersForSave } from './mergeUsers';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const PORT = Number(process.env.PORT || process.env.API_PORT) || 3001;

const app = express();
app.use(express.json({ limit: '5mb' }));

function getViewerId(req: express.Request) {
  const headerId = req.header('x-viewer-user-id');
  if (headerId && typeof headerId === 'string') return headerId.trim();
  const queryId = req.query.viewerId;
  return typeof queryId === 'string' ? queryId.trim() : undefined;
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
    const user = users.find(
      (entry) =>
        typeof entry.email === 'string' &&
        entry.email.toLowerCase() === email &&
        entry.password === password,
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    res.json({ ok: true, user: sanitizeUser(user, user.id) });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
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
    if (user.password !== currentPassword) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    users[index] = { ...user, password: newPassword };
    await saveUsers(users);
    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const users = await getUsers();
    res.json(sanitizeUsers(users, viewerId));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.put('/api/users', async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected an array of users.' });
    return;
  }
  try {
    const existing = await getUsers();
    const merged = mergeUsersForSave(existing, req.body);
    await saveUsers(merged);
    res.json({ ok: true, count: merged.length });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/listings', async (req, res) => {
  try {
    const viewerId = getViewerId(req);
    const listings = await getListings();
    res.json(sanitizeListings(listings, viewerId));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/listings/:id', async (req, res) => {
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

app.post('/api/listings/:id/record-view', async (req, res) => {
  const visitorId = typeof req.body?.visitorId === 'string' ? req.body.visitorId.trim() : '';
  const viewerUserId =
    typeof req.body?.viewerUserId === 'string' ? req.body.viewerUserId.trim() : undefined;

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

app.put('/api/listings', async (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected an array of listings.' });
    return;
  }
  try {
    const viewerId = getViewerId(req);
    const existing = await getListings();
    const merged = mergeListingsForSave(existing, req.body, viewerId);
    await saveListings(merged);
    res.json({ ok: true, count: merged.length });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/admin/verification-queue', async (_req, res) => {
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

app.post('/api/admin/verification/review', async (req, res) => {
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

app.get('/api/admin/users', async (_req, res) => {
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

app.post('/api/admin/users/review-kyc', async (req, res) => {
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
