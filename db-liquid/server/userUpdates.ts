type UserRecord = Record<string, unknown> & {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  roles?: string[];
  createdAt?: string;
  password?: string;
  credits?: number;
  creditHistory?: unknown[];
};

const SELF_PATCHABLE_KEYS = [
  'email',
  'phone',
  'name',
  'profileImageUrl',
  'aadharNumber',
  'aadharVerified',
  'panNumber',
  'panVerified',
  'credits',
  'creditHistory',
  'roles',
] as const;

const SELF_ROLE_ALLOWLIST = new Set(['buyer', 'seller']);

export class UserUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserUpdateError';
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function validateCreditUpdate(existing: UserRecord, patch: UserRecord) {
  if (patch.credits === undefined && patch.creditHistory === undefined) return;

  const existingHistory = Array.isArray(existing.creditHistory) ? existing.creditHistory : [];
  const nextHistory = patch.creditHistory !== undefined ? patch.creditHistory : existingHistory;

  if (!Array.isArray(nextHistory)) {
    throw new UserUpdateError('creditHistory must be an array.');
  }

  const existingCredits = typeof existing.credits === 'number' ? existing.credits : 0;
  const nextCredits = patch.credits !== undefined ? patch.credits : existingCredits;

  if (!Number.isFinite(nextCredits) || nextCredits < 0) {
    throw new UserUpdateError('credits must be a non-negative number.');
  }

  if (nextHistory.length === existingHistory.length) {
    if (nextCredits !== existingCredits) {
      throw new UserUpdateError('Credits cannot change without a new credit history entry.');
    }
    return;
  }

  if (nextHistory.length !== existingHistory.length + 1) {
    throw new UserUpdateError('Credit history can only append one entry at a time.');
  }

  const lastEntry = nextHistory[nextHistory.length - 1] as { balanceAfter?: number };
  if (lastEntry?.balanceAfter !== nextCredits) {
    throw new UserUpdateError('Credit balance must match the latest history entry.');
  }
}

function mergeSelfRoles(existing: UserRecord, patch: UserRecord) {
  const roles = new Set(asStringArray(existing.roles));
  for (const role of asStringArray(patch.roles)) {
    if (SELF_ROLE_ALLOWLIST.has(role)) {
      roles.add(role);
    }
  }
  return [...roles];
}

/** Apply a self-service patch for the authenticated user (not admin). */
export function applySelfUserPatch(existing: UserRecord, patch: UserRecord): UserRecord {
  if (patch.id !== undefined && patch.id !== existing.id) {
    throw new UserUpdateError('Cannot change user id.');
  }
  if (patch.createdAt !== undefined && patch.createdAt !== existing.createdAt) {
    throw new UserUpdateError('Cannot change account creation date.');
  }
  if (patch.password !== undefined) {
    throw new UserUpdateError('Use POST /api/auth/change-password to update password.');
  }

  validateCreditUpdate(existing, patch);

  const next: UserRecord = { ...existing };

  for (const key of SELF_PATCHABLE_KEYS) {
    if (patch[key] !== undefined) {
      next[key] = patch[key];
    }
  }

  if (patch.roles !== undefined) {
    next.roles = mergeSelfRoles(existing, patch);
  }

  return next;
}

/** Admin bulk merge — full array replace/merge (test import, admin tools). */
export function applyAdminUsersMerge(
  existingUsers: UserRecord[],
  incomingUsers: UserRecord[],
): UserRecord[] {
  const existingById = new Map(existingUsers.map((user) => [user.id, user]));
  const incomingIds = new Set(incomingUsers.map((user) => user.id));

  const mergedIncoming = incomingUsers.map((incoming) => {
    const existing = existingById.get(incoming.id);
    if (!existing) return incoming;

    return {
      ...existing,
      ...incoming,
      password: incoming.password || existing.password,
      creditHistory: incoming.creditHistory ?? existing.creditHistory,
    };
  });

  const untouched = existingUsers.filter((user) => !incomingIds.has(user.id));
  return [...untouched, ...mergedIncoming];
}
