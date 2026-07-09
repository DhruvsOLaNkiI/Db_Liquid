import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE, verifyAuthToken } from './auth';

export type AuthContext = {
  userId: string;
  roles: string[];
};

export type AuthenticatedRequest = Request & {
  auth?: AuthContext;
};

export function readAuth(req: Request): AuthContext | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || !token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  return { userId: payload.sub, roles: payload.roles };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  req.auth = readAuth(req) ?? undefined;
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.auth = auth;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (!auth.roles.includes('admin')) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  req.auth = auth;
  next();
}

/** Viewer identity for sanitization — JWT session only (SEC-007). */
export function getViewerIdFromRequest(req: AuthenticatedRequest): string | undefined {
  return req.auth?.userId;
}
