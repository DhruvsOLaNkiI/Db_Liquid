import type { User, UserRole } from '../types/user';
import { getSharedUsers, mutateUsers, persistUsers, reloadUsersFromServer } from '../utils/sharedStore';
import { apiFetch } from '../utils/api';
import { normalizeUser } from '../utils/buyerCredits';
import { isValidAadhar, isValidPan, normalizeAadhar, normalizePan } from '../utils/kyc';
import { randomId } from '../utils/randomId';

/** Shared users table — stored in MongoDB (all users see the same accounts). */
export const USERS_TABLE_KEY = 'db-liquid-users';

export const USERS_TABLE_COLUMNS = [
  'id',
  'email',
  'phone',
  'name',
  'password',
  'roles',
  'credits',
  'createdAt',
] as const;

function loadTable(): User[] {
  return getSharedUsers().map((u) => normalizeUser(u as User));
}

function saveTable(users: User[]) {
  void persistUsers(users);
}

export function getAllUsers(): User[] {
  return loadTable();
}

export function getBuyers(): User[] {
  return loadTable().filter((u) => u.roles.includes('buyer'));
}

export function getSellers(): User[] {
  return loadTable().filter((u) => u.roles.includes('seller'));
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return loadTable().find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  return loadTable().find((u) => u.id === id);
}

export function getSellerId(userId: string): string | undefined {
  const user = findUserById(userId);
  return user?.roles.includes('seller') ? user.id : undefined;
}

export function createUser(input: {
  email: string;
  phone: string;
  name: string;
  password: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (!name) {
    return { ok: false, error: 'Enter your name.' };
  }
  if (!phone) {
    return { ok: false, error: 'Enter your phone number.' };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (findUserByEmail(email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user: User = {
    id: randomId(),
    email,
    phone,
    name,
    password,
    roles: ['buyer', 'seller'],
    createdAt: new Date().toISOString(),
    credits: 0,
  };

  const users = loadTable();
  users.push(user);
  saveTable(users);
  return { ok: true, user: { ...user, password: '' } };
}

export function addRoleToUser(userId: string, role: UserRole): User | undefined {
  const users = loadTable();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return undefined;

  const user = users[index];
  if (!user.roles.includes(role)) {
    user.roles = [...user.roles, role];
    if (role === 'buyer' && user.credits === undefined) {
      user.credits = 0;
    }
    users[index] = user;
    saveTable(users);
  }
  return user;
}

/** Ensures legacy single-role accounts can buy and list (in-memory; server fixes on login). */
export function ensureDualRole(user: User): User {
  const roles = new Set(user.roles);
  roles.add('buyer');
  roles.add('seller');
  return { ...user, roles: [...roles] as User['roles'] };
}

export function validateLogin(
  email: string,
  _password: string,
): { ok: true; user: User } | { ok: false; error: string } {
  return { ok: false, error: 'Use server login via loginViaApi.' };
}

export async function replaceAllUsers(users: User[]) {
  await persistUsers(users);
}

export async function updateUserProfile(
  userId: string,
  patch: {
    email?: string;
    phone?: string;
    name?: string;
    profileImageUrl?: string | null;
    aadharNumber?: string | null;
    aadharVerified?: boolean;
    panNumber?: string | null;
    panVerified?: boolean;
  },
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const email = patch.email !== undefined ? patch.email.trim().toLowerCase() : undefined;
  const phone = patch.phone !== undefined ? patch.phone.trim() : undefined;
  const name = patch.name !== undefined ? patch.name.trim() : undefined;

  if (email !== undefined && (!email || !email.includes('@'))) {
    return { ok: false, error: 'Enter a valid email address.' };
  }
  if (name !== undefined && !name) {
    return { ok: false, error: 'Enter your name.' };
  }
  if (phone !== undefined && !phone) {
    return { ok: false, error: 'Enter your phone number.' };
  }

  const aadharNumber =
    patch.aadharNumber !== undefined
      ? patch.aadharNumber
        ? normalizeAadhar(patch.aadharNumber)
        : undefined
      : undefined;
  const panNumber =
    patch.panNumber !== undefined
      ? patch.panNumber
        ? normalizePan(patch.panNumber)
        : undefined
      : undefined;

  if (aadharNumber !== undefined && aadharNumber && !isValidAadhar(aadharNumber)) {
    return { ok: false, error: 'Enter a valid 12-digit Aadhar number.' };
  }
  if (panNumber !== undefined && panNumber && !isValidPan(panNumber)) {
    return { ok: false, error: 'Enter a valid PAN (e.g. ABCDE1234F).' };
  }

  const result = await mutateUsers((users) => {
    const normalized = users.map((u) => normalizeUser(u as User));
    const index = normalized.findIndex((u) => u.id === userId);
    if (index === -1) return { ok: false, error: 'User not found.' };

    const user = normalized[index];
    if (email && email !== user.email && normalized.some((u) => u.id !== userId && u.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const nextAadhar = aadharNumber !== undefined ? aadharNumber : user.aadharNumber;
    const nextPan = panNumber !== undefined ? panNumber : user.panNumber;

    if (patch.aadharVerified && (!nextAadhar || !isValidAadhar(nextAadhar))) {
      return { ok: false, error: 'Enter a valid Aadhar number before verifying.' };
    }
    if (patch.panVerified && (!nextPan || !isValidPan(nextPan))) {
      return { ok: false, error: 'Enter a valid PAN before verifying.' };
    }

    const updated = normalizeUser({
      ...user,
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(patch.profileImageUrl !== undefined
        ? { profileImageUrl: patch.profileImageUrl || undefined }
        : {}),
      ...(aadharNumber !== undefined ? { aadharNumber } : {}),
      ...(patch.aadharVerified !== undefined ? { aadharVerified: patch.aadharVerified } : {}),
      ...(panNumber !== undefined ? { panNumber } : {}),
      ...(patch.panVerified !== undefined ? { panVerified: patch.panVerified } : {}),
    });

    normalized[index] = updated;
    return { ok: true, value: updated, users: normalized };
  });

  if (!result.ok) return result;
  return { ok: true, user: result.value };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedCurrent = currentPassword;
  const trimmedNew = newPassword.trim();

  if (!trimmedCurrent) {
    return { ok: false, error: 'Enter your current password.' };
  }
  if (!trimmedNew || trimmedNew.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters.' };
  }
  if (trimmedCurrent === trimmedNew) {
    return { ok: false, error: 'New password must be different from your current password.' };
  }

  const res = await apiFetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword: trimmedCurrent,
      newPassword: trimmedNew,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Could not change password.' };
  }

  await reloadUsersFromServer({ force: true });
  return { ok: true };
}
