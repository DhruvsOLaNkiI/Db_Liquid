import cors from 'cors';
import type { Express, NextFunction, Request, Response } from 'express';

/**
 * INFRA-003 — CORS allowlist for browser origins.
 * Same-origin SPA+API needs no CORS; required when API is on another domain (INFRA-004).
 *
 * Env:
 *   APP_URL=https://app.example.com
 *   CORS_ORIGINS=https://app.example.com,https://staging.example.com
 *
 * Also allows Origin that matches this request's Host (Vite adds crossorigin to
 * /assets/*.js|css, so browsers send Origin even for same-site loads).
 */
function allowedOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const appUrl = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  const set = new Set<string>(fromList);
  if (appUrl) set.add(appUrl);

  if (process.env.NODE_ENV !== 'production') {
    set.add('http://localhost:3000');
    set.add('http://127.0.0.1:3000');
    set.add('http://localhost:3001');
    set.add('http://127.0.0.1:3001');
  }

  return [...set];
}

function isSameOriginRequest(req: Request, origin: string): boolean {
  try {
    const originHost = new URL(origin).host;
    const requestHost = (req.get('x-forwarded-host') || req.get('host') || '')
      .split(',')[0]
      ?.trim();
    return Boolean(requestHost) && originHost === requestHost;
  } catch {
    return false;
  }
}

export function applyCors(app: Express) {
  const origins = allowedOrigins();

  app.use((req: Request, res: Response, next: NextFunction) => {
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (origins.includes(origin) || isSameOriginRequest(req, origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
    })(req, res, next);
  });

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error && err.message.startsWith('Origin not allowed by CORS')) {
      res.status(403).json({ error: 'CORS origin not allowed.' });
      return;
    }
    next(err);
  });
}

export { allowedOrigins as listCorsOriginsForTests };
