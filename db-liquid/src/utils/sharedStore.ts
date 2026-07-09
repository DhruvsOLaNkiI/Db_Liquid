import type { User } from '../types/user';
import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';
import { getSession } from '../data/usersTable';
import { apiFetch } from './api';

const USERS_KEY = 'db-liquid-users';
const LISTINGS_KEY = 'db-liquid-listings';

let usersCache: User[] = [];
let listingsCache: PropertyListing[] = [];
let ready = false;

const MIN_RELOAD_MS = 8_000;

let usersFetchPromise: Promise<User[]> | null = null;
let listingsFetchPromise: Promise<PropertyListing[]> | null = null;
let lastUsersFetchAt = 0;
let lastListingsFetchAt = 0;

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

async function apiGetUsers(): Promise<User[]> {
  if (usersFetchPromise) return usersFetchPromise;

  usersFetchPromise = (async () => {
    const res = await apiFetch('/api/users');
    if (!res.ok) throw new Error('Failed to load users');
    const data = await res.json();
    lastUsersFetchAt = Date.now();
    return Array.isArray(data) ? data : [];
  })();

  try {
    return await usersFetchPromise;
  } finally {
    usersFetchPromise = null;
  }
}

async function apiPatchCurrentUser(patch: Partial<User>): Promise<User> {
  const res = await apiFetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to update user');
  }

  return data.user as User;
}

async function apiPutAdminUsers(users: User[]) {
  const res = await apiFetch('/api/v1/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save users');
  }
}

function stripPasswordsFromUsers(users: User[]): User[] {
  return users.map(({ password: _password, ...rest }) => ({ ...rest, password: '' }));
}

async function apiGetListings(): Promise<PropertyListing[]> {
  if (listingsFetchPromise) return listingsFetchPromise;

  listingsFetchPromise = (async () => {
    const res = await apiFetch('/api/listings');
    if (!res.ok) throw new Error('Failed to load listings');
    const data = await res.json();
    lastListingsFetchAt = Date.now();
    return Array.isArray(data) ? data.map((item) => normalizeListing(item as PropertyListing)) : [];
  })();

  try {
    return await listingsFetchPromise;
  } finally {
    listingsFetchPromise = null;
  }
}

async function apiSyncListings(listings: PropertyListing[]) {
  const res = await apiFetch('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listings),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save listings');
  }
}

async function apiPutAdminListings(listings: PropertyListing[]) {
  const res = await apiFetch('/api/v1/admin/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(listings),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Failed to save listings');
  }
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

export async function fetchAuthMe(): Promise<{ ok: true; user: User } | { ok: false }> {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) return { ok: false };

  const data = await res.json().catch(() => ({}));
  const user = data.user as User;
  if (!user?.id) return { ok: false };

  const existingIndex = usersCache.findIndex((entry) => entry.id === user.id);
  if (existingIndex === -1) {
    usersCache.push(user);
  } else {
    usersCache[existingIndex] = { ...usersCache[existingIndex], ...user };
  }

  return { ok: true, user };
}

export async function loginViaApi(
  email: string,
  password: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const res = await apiFetch('/api/auth/login', {
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

export async function registerViaApi(input: {
  email: string;
  phone: string;
  name: string;
  password: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Could not create account.' };
  }

  const user = data.user as User;
  if (!user?.id) {
    return { ok: false, error: 'Signup failed.' };
  }

  usersCache.push(user);
  return { ok: true, user };
}

export async function logoutViaApi(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' });
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
    try {
      await apiPutAdminUsers(localUsers);
      usersCache = stripPasswordsFromUsers(localUsers);
    } catch {
      usersCache = apiUsers;
    }
  } else {
    usersCache = apiUsers;
  }

  if (apiListings.length === 0 && localListings.length > 0) {
    try {
      listingsCache = sortListingsByNewest(localListings);
      await apiPutAdminListings(listingsCache);
    } catch {
      try {
        await apiSyncListings(listingsCache);
      } catch {
        listingsCache = sortListingsByNewest(apiListings);
      }
    }
  } else {
    listingsCache = sortListingsByNewest(apiListings);
  }

  ready = true;
}

export async function persistUsers(users: User[]) {
  return enqueueUsersWrite(async () => {
    await apiPutAdminUsers(users);
    usersCache = stripPasswordsFromUsers(users);
  });
}

export async function mutateUsers<T>(
  mutator: (users: User[]) => { ok: true; value: T; users: User[] } | { ok: false; error: string },
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  return enqueueUsersWrite(async () => {
    const sessionUserId = getSession()?.userId;
    if (!sessionUserId) {
      return { ok: false as const, error: 'Log in to update your account.' };
    }

    const draft = usersCache.map((u) => ({ ...u }));
    const result = mutator(draft);
    if (!result.ok) return result;

    const before = usersCache.find((u) => u.id === sessionUserId);
    const after = result.users.find((u) => u.id === sessionUserId);
    if (!before || !after) {
      return { ok: false as const, error: 'User not found.' };
    }

    const patch: Partial<User> = {};
    for (const key of Object.keys(after) as (keyof User)[]) {
      if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) {
        (patch as Record<string, unknown>)[key] = after[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      return { ok: true as const, value: result.value };
    }

    try {
      const saved = await apiPatchCurrentUser(patch);
      const index = usersCache.findIndex((u) => u.id === saved.id);
      if (index === -1) {
        usersCache.push({ ...saved, password: '' });
      } else {
        usersCache[index] = { ...usersCache[index], ...saved, password: '' };
      }
      return { ok: true as const, value: result.value };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Failed to update user.',
      };
    }
  });
}

export async function persistListings(listings: PropertyListing[]) {
  listingsCache = sortListingsByNewest(listings);
  await apiSyncListings(listingsCache);
}

export async function reloadUsersFromServer(options?: { force?: boolean }) {
  const force = options?.force ?? false;
  if (!force && usersCache.length > 0 && Date.now() - lastUsersFetchAt < MIN_RELOAD_MS) {
    return usersCache;
  }
  usersCache = await apiGetUsers();
  return usersCache;
}

export async function reloadListingsFromServer(options?: { force?: boolean }) {
  const force = options?.force ?? false;
  if (!force && listingsCache.length > 0 && Date.now() - lastListingsFetchAt < MIN_RELOAD_MS) {
    return listingsCache;
  }
  listingsCache = sortListingsByNewest(await apiGetListings());
  return listingsCache;
}

export const DATA_REFRESH_EVENT = 'db-liquid-data-refresh';

export function notifyDataRefresh() {
  window.dispatchEvent(new Event(DATA_REFRESH_EVENT));
}
