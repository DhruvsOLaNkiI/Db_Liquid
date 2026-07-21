import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo } from './db';

/** PERF-004 — one document per user / listing (not app_state arrays). */
const USERS_COLLECTION = 'users';
const LISTINGS_COLLECTION = 'listings';
const LEGACY_STATE_COLLECTION = 'app_state';
const LEGACY_USERS_KEY = 'users';
const LEGACY_LISTINGS_KEY = 'listings';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_USERS = path.join(__dirname, '../data/store/users.json');
const LEGACY_LISTINGS = path.join(__dirname, '../data/store/listings.json');

type Entity = Record<string, unknown> & { id?: string };

let indexesReady = false;

function readLegacyJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function stripMongoId<T extends Entity>(doc: T): T {
  const { _id: _ignored, ...rest } = doc as T & { _id?: unknown };
  return rest as T;
}

async function usersCol() {
  const db = await connectMongo();
  return db.collection<Entity>(USERS_COLLECTION);
}

async function listingsCol() {
  const db = await connectMongo();
  return db.collection<Entity>(LISTINGS_COLLECTION);
}

/** PERF-005 — indexes for hot lookups. */
export async function ensureStoreIndexes() {
  if (indexesReady) return;
  const users = await usersCol();
  const listings = await listingsCol();
  await Promise.all([
    users.createIndex({ id: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { sparse: true }),
    listings.createIndex({ id: 1 }, { unique: true }),
    listings.createIndex({ sellerId: 1 }),
    listings.createIndex({ biddingEndsAt: 1 }),
    listings.createIndex({ publishedAt: -1 }),
  ]);
  indexesReady = true;
}

async function readLegacyAppStateArray(key: string): Promise<unknown[]> {
  const db = await connectMongo();
  const doc = await db.collection(LEGACY_STATE_COLLECTION).findOne({ key });
  return Array.isArray(doc?.data) ? doc.data : [];
}

async function replaceAll(collectionName: 'users' | 'listings', items: unknown[]) {
  const col = collectionName === 'users' ? await usersCol() : await listingsCol();
  const docs = items.filter((item): item is Entity => {
    return Boolean(item && typeof item === 'object' && typeof (item as Entity).id === 'string');
  });

  const ids = docs.map((doc) => String(doc.id));
  if (docs.length === 0) {
    await col.deleteMany({});
    return;
  }

  const ops = docs.map((doc) => ({
    replaceOne: {
      filter: { id: doc.id },
      replacement: { ...doc, id: doc.id },
      upsert: true,
    },
  }));
  await col.bulkWrite(ops, { ordered: false });
  await col.deleteMany({ id: { $nin: ids } });
}

export async function getUsers(): Promise<Entity[]> {
  await ensureStoreIndexes();
  const col = await usersCol();
  const docs = await col.find({}).maxTimeMS(15_000).toArray();
  return docs.map(stripMongoId);
}

export async function saveUsers(users: unknown[]) {
  await ensureStoreIndexes();
  await replaceAll('users', users);
}

/** Omit multi-MB inline base64 from API reads so list endpoints stay fast. */
const LISTING_SLIM_PROJECTION = {
  'propertyPhotos.dataUrl': 0,
  'propertyVideos.dataUrl': 0,
  'verificationDocuments.dataUrl': 0,
  'propertyPhotos.url': 0,
  'propertyVideos.url': 0,
  'verificationDocuments.url': 0,
} as const;

export async function getListings(options?: { slim?: boolean }): Promise<Entity[]> {
  await ensureStoreIndexes();
  const col = await listingsCol();
  const projection = options?.slim ? LISTING_SLIM_PROJECTION : undefined;
  const docs = await col
    .find({}, projection ? { projection } : undefined)
    .sort({ publishedAt: -1 })
    .maxTimeMS(15_000)
    .toArray();
  return docs.map(stripMongoId);
}

export async function saveListings(listings: unknown[]) {
  await ensureStoreIndexes();
  // Final chokepoint guard: never persist inline base64 media to MongoDB.
  // Stale in-memory copies (slow read-modify-write cycles) would otherwise
  // resurrect multi-MB payloads and make every listings read take ~40s.
  const { externalizeInlineMedia } = await import('./listingUpdates');
  const externalized = await externalizeInlineMedia(listings as never[]);
  await replaceAll('listings', externalized);
}

export async function getUserById(id: string): Promise<Entity | null> {
  await ensureStoreIndexes();
  const col = await usersCol();
  const doc = await col.findOne({ id });
  return doc ? stripMongoId(doc) : null;
}

export async function findUserByEmail(email: string): Promise<Entity | null> {
  await ensureStoreIndexes();
  const normalized = email.trim().toLowerCase();
  const col = await usersCol();
  const exact = await col.findOne({ email: normalized });
  if (exact) return stripMongoId(exact);
  // Legacy mixed-case emails
  const match = await col.findOne({
    email: { $regex: `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });
  return match ? stripMongoId(match) : null;
}

export async function getListingById(id: string, options?: { slim?: boolean }): Promise<Entity | null> {
  await ensureStoreIndexes();
  const col = await listingsCol();
  const projection = options?.slim ? LISTING_SLIM_PROJECTION : undefined;
  const doc = await col.findOne({ id }, projection ? { projection } : undefined);
  return doc ? stripMongoId(doc) : null;
}

/** PERF-006 — page through listings without loading unneeded rows into the response. */
export async function getListingsPage(options?: {
  page?: number;
  limit?: number;
}): Promise<{ listings: Entity[]; page: number; limit: number; total: number; totalPages: number }> {
  await ensureStoreIndexes();
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(options?.limit ?? 20)));
  const col = await listingsCol();
  const total = await col.countDocuments();
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;
  const docs = await col
    .find({}, { projection: LISTING_SLIM_PROJECTION })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return {
    listings: docs.map(stripMongoId),
    page,
    limit,
    total,
    totalPages,
  };
}

/**
 * Serialize all read-modify-write listing updates.
 * Without this, concurrent sync + record-view (or admin review) can overwrite
 * each other and wipe newly created listings from MongoDB.
 */
let listingsWriteQueue: Promise<unknown> = Promise.resolve();

export async function updateListings<T>(
  mutator: (listings: unknown[]) => T | Promise<T>,
): Promise<T> {
  const run = async (): Promise<T> => {
    const listings = await getListings();
    return mutator(listings);
  };

  const next = listingsWriteQueue.then(run, run);
  listingsWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** Serialize users + listings updates together (bids/credits critical section). */
export async function updateUsersAndListings<T>(
  mutator: (state: { users: unknown[]; listings: unknown[] }) => T | Promise<T>,
): Promise<T> {
  const run = async (): Promise<T> => {
    const [users, listings] = await Promise.all([getUsers(), getListings()]);
    const result = await mutator({ users, listings });
    await Promise.all([saveUsers(users), saveListings(listings)]);
    return result;
  };

  const next = listingsWriteQueue.then(run, run);
  listingsWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function mergeLegacyArrayIntoCollection(
  collectionName: 'users' | 'listings',
  fromState: unknown[],
) {
  if (fromState.length === 0) return;

  const existing = collectionName === 'users' ? await getUsers() : await getListings();
  const byId = new Map<string, Entity>();
  for (const row of existing) {
    if (typeof row.id === 'string' && row.id) byId.set(row.id, row);
  }

  let added = 0;
  for (const raw of fromState) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Entity;
    if (typeof row.id !== 'string' || !row.id) continue;
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
      added += 1;
    }
  }

  if (added === 0 && existing.length > 0) return;

  if (collectionName === 'users') await saveUsers([...byId.values()]);
  else await saveListings([...byId.values()]);

  console.log(
    `Migrated/merged ${added} ${collectionName} from app_state → ${collectionName} collection (${byId.size} total) (PERF-004)`,
  );
}

async function migrateAppStateArraysIfNeeded() {
  const fromUsers = await readLegacyAppStateArray(LEGACY_USERS_KEY);
  const fromListings = await readLegacyAppStateArray(LEGACY_LISTINGS_KEY);
  await mergeLegacyArrayIntoCollection('users', fromUsers);
  await mergeLegacyArrayIntoCollection('listings', fromListings);
}

/** One-time import: app_state arrays / JSON files → per-entity collections. */
export async function migrateLegacyJsonIfNeeded() {
  await ensureStoreIndexes();

  const usersColRef = await usersCol();
  const listingsColRef = await listingsCol();
  const [userCount, listingCount] = await Promise.all([
    usersColRef.estimatedDocumentCount(),
    listingsColRef.estimatedDocumentCount(),
  ]);

  // Already on split collections — skip legacy merge (avoids blocking startup)
  if (userCount > 0 && listingCount > 0) {
    return;
  }

  await migrateAppStateArraysIfNeeded();

  const users = await getUsers();
  const listings = await getListings();

  if (users.length === 0) {
    const legacyUsers = readLegacyJson<unknown[]>(LEGACY_USERS, []);
    if (legacyUsers.length > 0) {
      await saveUsers(legacyUsers);
      console.log(`Migrated ${legacyUsers.length} users from JSON → MongoDB`);
    }
  }

  if (listings.length === 0) {
    const legacyListings = readLegacyJson<unknown[]>(LEGACY_LISTINGS, []);
    if (legacyListings.length > 0) {
      await saveListings(legacyListings);
      console.log(`Migrated ${legacyListings.length} listings from JSON → MongoDB`);
    }
  }
}
