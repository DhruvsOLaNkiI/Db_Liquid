import express from 'express';
import 'dotenv/config';
import { connectMongo, getMongoInfo } from './db';
import {
  getListings,
  getUsers,
  migrateLegacyJsonIfNeeded,
  saveListings,
  saveUsers,
} from './mongoStore';

const PORT = Number(process.env.API_PORT) || 3001;

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

async function start() {
  await connectMongo();
  await migrateLegacyJsonIfNeeded();

  app.listen(PORT, () => {
    const info = getMongoInfo();
    console.log(`DB Liquid API running at http://localhost:${PORT}`);
    console.log(`Storage: MongoDB (${info.db})`);
  });
}

start().catch((error) => {
  console.error('Failed to start API server:', error.message);
  console.error('Set MONGODB_URI in .env or start MongoDB locally on port 27017');
  process.exit(1);
});
