// One-time migration: move inline base64 media (dataUrl) out of MongoDB
// into object storage (S3/R2 if configured, else local data/private-uploads),
// replacing it with a storageKey. Fixes multi-MB /api/listings payloads
// from legacy listings.
//
// Usage: node scripts/migrate-inline-media.mjs

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../data/private-uploads');

const URI = process.env.MONGODB_URI_ATLAS;
const DB_NAME = process.env.MONGODB_DB ?? 'db_liquid';
if (!URI) {
  console.error('Missing MONGODB_URI_ATLAS in .env');
  process.exit(1);
}

const useS3 = Boolean(
  process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
);
const s3 = useS3
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    })
  : null;
console.log(`Storage driver: ${useS3 ? 's3' : 'local'}`);

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

function extractInline(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/is.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1].toLowerCase(), buffer: Buffer.from(match[2], 'base64') };
}

async function storeBuffer(buffer, mimeType, purpose) {
  const ext = EXT_BY_MIME[mimeType] ?? '.jpg';
  const storageKey = `${purpose}/${randomUUID()}${ext}`;
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return storageKey;
  }
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  // Same disk naming convention as server/objectStorage.ts (slashes -> __)
  writeFileSync(path.join(UPLOAD_DIR, storageKey.replace(/\//g, '__')), buffer);
  return storageKey;
}

async function migrateMediaArray(items, purpose, stats) {
  if (!Array.isArray(items) || items.length === 0) return { items, changed: false };
  let changed = false;
  const next = [];
  for (const item of items) {
    if (
      !item ||
      typeof item !== 'object' ||
      item.storageKey ||
      typeof item.dataUrl !== 'string' ||
      !item.dataUrl.startsWith('data:')
    ) {
      next.push(item);
      continue;
    }
    const inline = extractInline(item.dataUrl);
    if (!inline || !inline.buffer.length) {
      next.push(item);
      continue;
    }
    const storageKey = await storeBuffer(inline.buffer, inline.mimeType, purpose);
    stats.files += 1;
    stats.bytes += inline.buffer.length;
    changed = true;
    next.push({ ...item, storageKey, mimeType: item.mimeType ?? inline.mimeType, dataUrl: '' });
  }
  return { items: next, changed };
}

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 10_000 });
await client.connect();
const db = client.db(DB_NAME);
const col = db.collection('listings');
const docs = await col.find({}).toArray();
console.log(`Scanning ${docs.length} listings…`);

const stats = { files: 0, bytes: 0, listings: 0 };
for (const doc of docs) {
  const photos = await migrateMediaArray(doc.propertyPhotos, 'photo', stats);
  const videos = await migrateMediaArray(doc.propertyVideos, 'video', stats);
  const verif = await migrateMediaArray(doc.verificationDocuments, 'kyc', stats);
  if (!photos.changed && !videos.changed && !verif.changed) continue;

  const update = {};
  if (photos.changed) update.propertyPhotos = photos.items;
  if (videos.changed) update.propertyVideos = videos.items;
  if (verif.changed) update.verificationDocuments = verif.items;
  await col.updateOne({ _id: doc._id }, { $set: update });
  stats.listings += 1;
  console.log(`  migrated listing ${doc.id}`);
}

// Legacy app_state.listings still holds a full inflated copy that old server
// instances read and write back over the listings collection. Clean it too.
const appState = db.collection('app_state');
const legacy = await appState.findOne({ key: 'listings' });
if (legacy && Array.isArray(legacy.data)) {
  let legacyChanged = false;
  const cleaned = [];
  for (const listing of legacy.data) {
    if (!listing || typeof listing !== 'object') {
      cleaned.push(listing);
      continue;
    }
    const photos = await migrateMediaArray(listing.propertyPhotos, 'photo', stats);
    const videos = await migrateMediaArray(listing.propertyVideos, 'video', stats);
    const verif = await migrateMediaArray(listing.verificationDocuments, 'kyc', stats);
    if (photos.changed || videos.changed || verif.changed) legacyChanged = true;
    cleaned.push({
      ...listing,
      ...(photos.changed ? { propertyPhotos: photos.items } : {}),
      ...(videos.changed ? { propertyVideos: videos.items } : {}),
      ...(verif.changed ? { verificationDocuments: verif.items } : {}),
    });
  }
  if (legacyChanged) {
    await appState.updateOne({ key: 'listings' }, { $set: { data: cleaned } });
    console.log(`Cleaned legacy app_state.listings (${cleaned.length} items).`);
  } else {
    console.log('Legacy app_state.listings already clean.');
  }
} else {
  console.log('No legacy app_state.listings found.');
}

console.log(
  `Done. ${stats.files} files (${(stats.bytes / 1024 / 1024).toFixed(1)} MB) moved out of MongoDB across ${stats.listings} listings.`,
);
await client.close();
