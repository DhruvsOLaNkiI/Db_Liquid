import type { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE, verifyAuthToken } from './auth';
import { getUserById } from './mongoStore';

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

/**
 * DB Liquid members can both buy and sell (AUTH-006).
 * Same as requireAuth — kept for clear intent on member-only routes.
 */
export const requireMember = requireAuth;

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const auth = readAuth(req);
    if (!auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.some((role) => auth.roles.includes(role))) {
      res.status(403).json({ error: `Requires one of: ${roles.join(', ')}.` });
      return;
    }
    req.auth = auth;
    next();
  };
}

/** Live roles from Mongo when available (role grants take effect without waiting for re-login). */
async function resolveLiveRoles(auth: AuthContext): Promise<string[]> {
  try {
    const user = await getUserById(auth.userId);
    if (user && Array.isArray(user.roles)) {
      return user.roles.map(String);
    }
  } catch {
    // fall through to JWT roles
  }
  return auth.roles;
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const roles = await resolveLiveRoles(auth);
  if (!roles.includes('admin')) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  req.auth = { userId: auth.userId, roles };
  next();
}

/** Viewer identity for sanitization — JWT session only (SEC-007). */
export function getViewerIdFromRequest(req: AuthenticatedRequest): string | undefined {
  return req.auth?.userId;
}
