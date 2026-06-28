import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo } from './db';

const COLLECTION = 'app_state';
const USERS_KEY = 'users';
const LISTINGS_KEY = 'listings';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_USERS = path.join(__dirname, '../data/store/users.json');
const LEGACY_LISTINGS = path.join(__dirname, '../data/store/listings.json');

function readLegacyJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function getState(key: string) {
  const db = await connectMongo();
  const doc = await db.collection(COLLECTION).findOne({ key });
  return Array.isArray(doc?.data) ? doc.data : [];
}

async function setState(key: string, data: unknown[]) {
  const db = await connectMongo();
  await db.collection(COLLECTION).updateOne(
    { key },
    { $set: { key, data, updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function getUsers() {
  return getState(USERS_KEY);
}

export async function saveUsers(users: unknown[]) {
  await setState(USERS_KEY, users);
}

export async function getListings() {
  return getState(LISTINGS_KEY);
}

export async function saveListings(listings: unknown[]) {
  await setState(LISTINGS_KEY, listings);
}

/** One-time import from old JSON files if MongoDB is empty. */
export async function migrateLegacyJsonIfNeeded() {
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
