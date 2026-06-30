import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { connectMongo, getMongoInfo } from './db';
import { mergeListingsForSave } from './mergeListings';
import { mergeUsersForSave } from './mergeUsers';
import {
  getListings,
  getUsers,
  migrateLegacyJsonIfNeeded,
  saveListings,
  saveUsers,
} from './mongoStore';
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

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
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
