import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { connectMongo, getMongoInfo } from './db';
import {
  getListings,
  getUsers,
  migrateLegacyJsonIfNeeded,
  saveListings,
  saveUsers,
} from './mongoStore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');
const PORT = Number(process.env.PORT || process.env.API_PORT) || 3001;

const app = express();
app.use(express.json({ limit: '5mb' }));

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

app.get('/api/users', async (_req, res) => {
  try {
    res.json(await getUsers());
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
    await saveUsers(req.body);
    res.json({ ok: true, count: req.body.length });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
});

app.get('/api/listings', async (_req, res) => {
  try {
    res.json(await getListings());
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
    await saveListings(req.body);
    res.json({ ok: true, count: req.body.length });
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
