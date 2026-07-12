/**
 * Client auth identity (AUTH-001).
 *
 * Real authentication is the httpOnly `db_liquid_session` cookie (JWT).
 * This module only keeps an in-memory user id for client cache updates —
 * never store session tokens or userId auth state in localStorage.
 */

const LEGACY_SESSION_KEY = 'db-liquid-session';

let currentUserId: string | null = null;

export function setAuthUserId(userId: string | null) {
  currentUserId = userId;
}

export function getAuthUserId(): string | null {
  return currentUserId;
}

export function clearAuthUserId() {
  currentUserId = null;
}

/** Remove pre-AUTH-001 localStorage session blob if present. */
export function clearLegacyLocalStorageSession() {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore (SSR / private mode)
  }
}
