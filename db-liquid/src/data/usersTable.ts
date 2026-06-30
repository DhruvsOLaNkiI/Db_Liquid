import type { AuthSession, User, UserRole } from '../types/user';
import { getSharedUsers, mutateUsers, persistUsers } from '../utils/sharedStore';
import { normalizeUser } from '../utils/buyerCredits';
import { randomId } from '../utils/randomId';

/** Shared users table — stored in MongoDB (all users see the same accounts). */
export const USERS_TABLE_KEY = 'db-liquid-users';
export const SESSION_TABLE_KEY = 'db-liquid-session';

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
  return { ok: true, user };
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

/** Ensures legacy single-role accounts can buy and list after login. */
export function ensureDualRole(user: User): User {
  let current = user;
  if (!current.roles.includes('buyer')) {
    current = addRoleToUser(current.id, 'buyer') ?? current;
  }
  if (!current.roles.includes('seller')) {
    current = addRoleToUser(current.id, 'seller') ?? current;
  }
  return findUserById(current.id) ?? current;
}

export function validateLogin(
  email: string,
  password: string,
): { ok: true; user: User } | { ok: false; error: string } {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return { ok: true, user: ensureDualRole(user) };
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_TABLE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (!session?.userId || !session?.activeRole) return null;
    if (!findUserById(session.userId)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  localStorage.setItem(SESSION_TABLE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_TABLE_KEY);
}

export function replaceAllUsers(users: User[]) {
  saveTable(users);
}

export async function updateUserProfile(
  userId: string,
  patch: {
    email?: string;
    phone?: string;
    name?: string;
    profileImageUrl?: string | null;
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

  const result = await mutateUsers((users) => {
    const normalized = users.map((u) => normalizeUser(u as User));
    const index = normalized.findIndex((u) => u.id === userId);
    if (index === -1) return { ok: false, error: 'User not found.' };

    const user = normalized[index];
    if (email && email !== user.email && normalized.some((u) => u.id !== userId && u.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const updated = normalizeUser({
      ...user,
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(patch.profileImageUrl !== undefined
        ? { profileImageUrl: patch.profileImageUrl || undefined }
        : {}),
    });

    normalized[index] = updated;
    return { ok: true, value: updated, users: normalized };
  });

  if (!result.ok) return result;
  return { ok: true, user: result.value };
}
