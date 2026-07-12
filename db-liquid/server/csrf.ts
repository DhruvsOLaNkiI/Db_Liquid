import crypto from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';

export const CSRF_COOKIE = 'db_liquid_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false, // client must read and send as header (double-submit)
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

export function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token = createCsrfToken()) {
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
  return token;
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE, { path: '/', sameSite: 'lax' });
}

/** Ensure a CSRF cookie exists (e.g. on GET /api/auth/csrf or after login). */
export function ensureCsrfCookie(req: Request, res: Response) {
  const existing = req.cookies?.[CSRF_COOKIE];
  if (typeof existing === 'string' && existing.length >= 32) {
    return existing;
  }
  return setCsrfCookie(res);
}

/**
 * Reject mutating requests unless cookie token matches X-CSRF-Token header.
 * Safe methods (GET/HEAD/OPTIONS) always pass.
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get(CSRF_HEADER);

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    cookieToken.length < 32 ||
    headerToken.length < 32 ||
    cookieToken !== headerToken
  ) {
    res.status(403).json({
      error: 'Invalid or missing CSRF token.',
      hint: 'Call GET /api/auth/csrf then send X-CSRF-Token matching the db_liquid_csrf cookie.',
    });
    return;
  }

  next();
}
