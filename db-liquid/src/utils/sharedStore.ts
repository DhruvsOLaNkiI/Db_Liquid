import type { User } from '../types/user';
import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';

const USERS_KEY = 'db-liquid-users';
const LISTINGS_KEY = 'db-liquid-listings';

let usersCache: User[] = [];
let listingsCache: PropertyListing[] = [];
let ready = false;

/** Serializes user writes so rapid bids cannot reuse stale credit balances. */
let usersWriteQueue: Promise<unknown> = Promise.resolve();

function enqueueUsersWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = usersWriteQueue.then(task, task);
  usersWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function sortListingsByNewest(listings: PropertyListing[]) {
  return [...listings].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function isSharedStoreReady() {
  return ready;
}

export function getSharedUsers() {
  return usersCache;
}

export function getSharedListings() {
  return listingsCache;
}

async function apiGetUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to load users');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function apiSaveUsers(users: User[]) {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users),
  });
  if (!res.ok) throw new Error('Failed to save users');
}

async function apiGetListings(): Promise<PropertyListing[]> {
  const res = await fetch('/api/listings');
  if (!res.ok) throw new Error('Failed to load listings');
  const data = await res.json();
  return Array.isArray(data) ? data.map((item) => normalizeListing(item as PropertyListing)) : [];
}

async function apiSaveListings(listings: PropertyListing[]) {
  const res = await fetch('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listings),
  });
  if (!res.ok) throw new Error('Failed to save listings');
}

function readLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalListings(): PropertyListing[] {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PropertyListing>[];
    return parsed.map((item) => normalizeListing(item as PropertyListing));
  } catch {
    return [];
  }
}

/** Load shared data from MongoDB via API. Migrates old browser localStorage once. */
export async function bootstrapSharedStore() {
  const [apiUsers, apiListings] = await Promise.all([apiGetUsers(), apiGetListings()]);

  const localUsers = readLocalUsers();
  const localListings = readLocalListings();

  usersCache = apiUsers.length > 0 ? apiUsers : localUsers;
  listingsCache = sortListingsByNewest(apiListings.length > 0 ? apiListings : localListings);

  await Promise.all([
    apiSaveUsers(usersCache),
    apiSaveListings(listingsCache),
  ]);

  ready = true;
}

export async function persistUsers(users: User[]) {
  return enqueueUsersWrite(async () => {
    usersCache = users;
    await apiSaveUsers(users);
  });
}

export async function mutateUsers<T>(
  mutator: (users: User[]) => { ok: true; value: T; users: User[] } | { ok: false; error: string },
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  return enqueueUsersWrite(async () => {
    const draft = usersCache.map((u) => ({ ...u }));
    const result = mutator(draft);
    if (!result.ok) return result;
    usersCache = result.users;
    await apiSaveUsers(usersCache);
    return { ok: true as const, value: result.value };
  });
}

export async function persistListings(listings: PropertyListing[]) {
  listingsCache = sortListingsByNewest(listings);
  await apiSaveListings(listingsCache);
}

export async function reloadUsersFromServer() {
  usersCache = await apiGetUsers();
  return usersCache;
}

export async function reloadListingsFromServer() {
  listingsCache = sortListingsByNewest(await apiGetListings());
  return listingsCache;
}
