import type { User } from '../types/user';
import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';
import { getSession } from '../data/usersTable';

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

function getViewerId() {
  return getSession()?.userId;
}

function viewerHeaders(): Record<string, string> {
  const viewerId = getViewerId();
  return viewerId ? { 'X-Viewer-User-Id': viewerId } : {};
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
  const viewerId = getViewerId();
  const url = viewerId ? `/api/users?viewerId=${encodeURIComponent(viewerId)}` : '/api/users';
  const res = await fetch(url, { headers: viewerHeaders() });
  if (!res.ok) throw new Error('Failed to load users');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function apiSaveUsers(users: User[]) {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...viewerHeaders() },
    body: JSON.stringify(users),
  });
  if (!res.ok) throw new Error('Failed to save users');
}

async function apiGetListings(): Promise<PropertyListing[]> {
  const viewerId = getViewerId();
  const url = viewerId ? `/api/listings?viewerId=${encodeURIComponent(viewerId)}` : '/api/listings';
  const res = await fetch(url, { headers: viewerHeaders() });
  if (!res.ok) throw new Error('Failed to load listings');
  const data = await res.json();
  return Array.isArray(data) ? data.map((item) => normalizeListing(item as PropertyListing)) : [];
}

async function apiSaveListings(listings: PropertyListing[]) {
  const res = await fetch('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...viewerHeaders() },
    body: JSON.stringify(listings),
  });
  if (!res.ok) throw new Error('Failed to save listings');
}

export async function loginViaApi(
  email: string,
  password: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Invalid email or password.' };
  }

  const user = data.user as User;
  if (!user?.id) {
    return { ok: false, error: 'Login failed.' };
  }

  const existingIndex = usersCache.findIndex((entry) => entry.id === user.id);
  if (existingIndex === -1) {
    usersCache.push(user);
  } else {
    usersCache[existingIndex] = { ...usersCache[existingIndex], ...user };
  }

  return { ok: true, user };
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

  if (apiUsers.length === 0 && localUsers.length > 0) {
    usersCache = localUsers;
    await apiSaveUsers(usersCache);
  } else {
    usersCache = apiUsers;
  }

  if (apiListings.length === 0 && localListings.length > 0) {
    listingsCache = sortListingsByNewest(localListings);
    await apiSaveListings(listingsCache);
  } else {
    listingsCache = sortListingsByNewest(apiListings);
  }

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

export const DATA_REFRESH_EVENT = 'db-liquid-data-refresh';

export function notifyDataRefresh() {
  window.dispatchEvent(new Event(DATA_REFRESH_EVENT));
}
