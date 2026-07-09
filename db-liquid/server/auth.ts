import jwt from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';

export const SESSION_COOKIE = 'db_liquid_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthTokenPayload = {
  sub: string;
  roles: string[];
};

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-insecure-jwt-secret-change-me';
  }
  return secret;
}

export function signAuthToken(userId: string, roles: string[]): string {
  return jwt.sign({ sub: userId, roles }, getJwtSecret(), { expiresIn: '24h' });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    if (!decoded?.sub) return null;
    return { sub: decoded.sub, roles: Array.isArray(decoded.roles) ? decoded.roles : [] };
  } catch {
    return null;
  }
}

export function authCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

export function setAuthCookie(res: Response, userId: string, roles: string[]) {
  res.cookie(SESSION_COOKIE, signAuthToken(userId, roles), authCookieOptions());
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/', sameSite: 'lax' });
}
