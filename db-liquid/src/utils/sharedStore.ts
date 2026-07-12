import type { User } from '../types/user';
import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';
import { getAuthUserId } from './authSession';
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

/** Serializes listing syncs so a poll/reload cannot race an in-flight create. */
let listingsWriteQueue: Promise<unknown> = Promise.resolve();

function enqueueUsersWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = usersWriteQueue.then(task, task);
  usersWriteQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function enqueueListingsWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = listingsWriteQueue.then(task, task);
  listingsWriteQueue = next.then(
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
  const userId = getAuthUserId();
  // Only send listings this user can write. Other sellers' sanitized copies in the
  // local cache used to make the server reject the entire publish with
  // "Cannot modify another seller's listing."
  const payload = userId
    ? listings.filter(
        (listing) =>
          listing.sellerId === userId ||
          listing.bids.some((bid) => bid.bidderUserId === userId),
      )
    : listings;

  const res = await apiFetch('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
export async function bootstrapSharedStore(options?: {
  includeListings?: boolean;
  includeUsers?: boolean;
}) {
  const includeListings = options?.includeListings !== false;
  const includeUsers = options?.includeUsers !== false;

  // Auth pages: no shared-data API calls — login uses /api/auth/* only
  if (!includeUsers && !includeListings) {
    usersCache = [];
    listingsCache = sortListingsByNewest(readLocalListings());
    ready = true;
    return;
  }

  const apiUsers = includeUsers ? await apiGetUsers() : [];
  const apiListings = includeListings ? await apiGetListings() : [];

  const localUsers = includeUsers ? readLocalUsers() : [];
  const localListings = includeListings ? readLocalListings() : [];

  if (includeUsers) {
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
  } else {
    usersCache = [];
  }

  if (includeListings) {
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
  } else {
    listingsCache = sortListingsByNewest(readLocalListings());
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
    const sessionUserId = getAuthUserId();
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

    // Credit spend/top-up must always send credits + history together (avoids 400 mismatch)
    if (patch.creditHistory !== undefined) {
      patch.credits = typeof after.credits === 'number' ? after.credits : 0;
    }
    if (patch.credits !== undefined && patch.creditHistory === undefined && after.creditHistory) {
      patch.creditHistory = after.creditHistory;
    }

    if (Object.keys(patch).length === 0) {
      return { ok: true as const, value: result.value };
    }

    try {
      const saved = await apiPatchCurrentUser(patch);
      const index = usersCache.findIndex((u) => u.id === saved.id);
      const merged = {
        ...(index === -1 ? saved : { ...usersCache[index], ...saved }),
        password: '',
      } as User;
      if (index === -1) {
        usersCache.push(merged);
      } else {
        usersCache[index] = merged;
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
  return enqueueListingsWrite(async () => {
    const sorted = sortListingsByNewest(listings);
    listingsCache = sorted;
    await apiSyncListings(sorted);
  });
}

export async function createBidOnServer(listingId: string, bidTotal: number) {
  const res = await apiFetch(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: data.error ?? 'Could not place bid.' };
  }

  const listing = normalizeListing(data.listing as PropertyListing);
  listingsCache = sortListingsByNewest([
    listing,
    ...listingsCache.filter((entry) => entry.id !== listing.id),
  ]);

  const userId = getAuthUserId();
  if (userId && typeof data.creditsRemaining === 'number') {
    const index = usersCache.findIndex((user) => user.id === userId);
    if (index !== -1) {
      usersCache[index] = { ...usersCache[index], credits: data.creditsRemaining };
    }
  }

  return {
    ok: true as const,
    listing,
    bid: data.bid,
    creditsRemaining: Number(data.creditsRemaining ?? 0),
  };
}

export async function acceptBidOnServer(listingId: string, bidId: string) {
  const res = await apiFetch(`/api/listings/${listingId}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: data.error ?? 'Could not accept bid.' };
  }

  const listing = normalizeListing(data.listing as PropertyListing);
  listingsCache = sortListingsByNewest([
    listing,
    ...listingsCache.filter((entry) => entry.id !== listing.id),
  ]);

  return {
    ok: true as const,
    listing,
    bid: data.bid,
  };
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
  // Wait for in-flight creates/updates so a poll cannot wipe a listing that is still saving.
  await listingsWriteQueue;
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
