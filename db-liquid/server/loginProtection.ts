import { getClientIp } from './cloudflare';

export { getClientIp };

/** Failed attempts per email before lockout */
export const LOGIN_MAX_FAILURES = 5;
/** Lockout duration after too many failures */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
/** Max login attempts per IP in the window (all emails) */
export const LOGIN_IP_MAX_ATTEMPTS = 30;
/** Sliding window for IP rate limit */
export const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000;

type AttemptBucket = {
  count: number;
  windowStartedAt: number;
  lockedUntil?: number;
};

const byEmail = new Map<string, AttemptBucket>();
const byIp = new Map<string, AttemptBucket>();

function now() {
  return Date.now();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function pruneExpired(map: Map<string, AttemptBucket>, windowMs: number) {
  const t = now();
  for (const [key, bucket] of map) {
    const locked = bucket.lockedUntil && bucket.lockedUntil > t;
    const inWindow = t - bucket.windowStartedAt < windowMs;
    if (!locked && !inWindow) {
      map.delete(key);
    }
  }
}

function getOrCreate(map: Map<string, AttemptBucket>, key: string, windowMs: number): AttemptBucket {
  const t = now();
  const existing = map.get(key);
  if (!existing || (t - existing.windowStartedAt >= windowMs && !(existing.lockedUntil && existing.lockedUntil > t))) {
    const fresh: AttemptBucket = { count: 0, windowStartedAt: t };
    map.set(key, fresh);
    return fresh;
  }
  return existing;
}

export type LoginBlockReason = 'lockout' | 'ip_rate';

export type LoginGuardResult =
  | { ok: true }
  | { ok: false; status: 429; reason: LoginBlockReason; retryAfterSec: number; error: string };

/** Call before verifying credentials. */
export function assertLoginAllowed(email: string, ip: string): LoginGuardResult {
  pruneExpired(byEmail, LOGIN_LOCKOUT_MS);
  pruneExpired(byIp, LOGIN_IP_WINDOW_MS);

  const emailKey = normalizeEmail(email);
  const t = now();

  const emailBucket = byEmail.get(emailKey);
  if (emailBucket?.lockedUntil && emailBucket.lockedUntil > t) {
    const retryAfterSec = Math.max(1, Math.ceil((emailBucket.lockedUntil - t) / 1000));
    return {
      ok: false,
      status: 429,
      reason: 'lockout',
      retryAfterSec,
      error: `Too many failed login attempts. Try again in ${retryAfterSec} seconds.`,
    };
  }

  const ipBucket = getOrCreate(byIp, ip, LOGIN_IP_WINDOW_MS);
  if (ipBucket.count >= LOGIN_IP_MAX_ATTEMPTS) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((ipBucket.windowStartedAt + LOGIN_IP_WINDOW_MS - t) / 1000),
    );
    return {
      ok: false,
      status: 429,
      reason: 'ip_rate',
      retryAfterSec,
      error: `Too many login attempts from this network. Try again in ${retryAfterSec} seconds.`,
    };
  }

  return { ok: true };
}

/** Record a failed password / unknown-user attempt. */
export function recordLoginFailure(email: string, ip: string) {
  const emailKey = normalizeEmail(email);
  const t = now();

  const emailBucket = getOrCreate(byEmail, emailKey, LOGIN_LOCKOUT_MS);
  // If previously locked and lock expired, reset
  if (emailBucket.lockedUntil && emailBucket.lockedUntil <= t) {
    emailBucket.count = 0;
    emailBucket.windowStartedAt = t;
    delete emailBucket.lockedUntil;
  }
  emailBucket.count += 1;
  if (emailBucket.count >= LOGIN_MAX_FAILURES) {
    emailBucket.lockedUntil = t + LOGIN_LOCKOUT_MS;
  }

  const ipBucket = getOrCreate(byIp, ip, LOGIN_IP_WINDOW_MS);
  ipBucket.count += 1;
}

/** Clear email failures after a successful login. */
export function recordLoginSuccess(email: string, ip: string) {
  byEmail.delete(normalizeEmail(email));
  // Do not fully clear IP bucket — still counts toward IP rate limit for abuse
  void ip;
}

/** Test helper — reset in-memory state. */
export function resetLoginProtectionForTests() {
  byEmail.clear();
  byIp.clear();
}
