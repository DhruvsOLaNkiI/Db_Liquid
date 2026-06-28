import type { AuthSession, User, UserRole } from '../types/user';
import { getSharedUsers, persistUsers } from '../utils/sharedStore';
import { normalizeUser } from '../utils/buyerCredits';

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
  role: UserRole;
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
    id: crypto.randomUUID(),
    email,
    phone,
    name,
    password,
    roles: [input.role],
    createdAt: new Date().toISOString(),
    credits: input.role === 'buyer' ? 0 : undefined,
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

export function validateLogin(
  email: string,
  password: string,
  role: UserRole,
): { ok: true; user: User } | { ok: false; error: string } {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  if (!user.roles.includes(role)) {
    return {
      ok: false,
      error: `This account is not registered as a ${role}. Sign up as a ${role} first.`,
    };
  }
  return { ok: true, user };
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
