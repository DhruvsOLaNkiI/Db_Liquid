import type { Express, Request, Response, NextFunction } from 'express';

const NO_STORE = 'private, no-store';

/**
 * PERF-009 — bid/auth/listing responses must not be stored by CDNs or shared caches.
 * Local signed files may override with a short private max-age.
 */
export function applyApiNoStoreCache(app: Express) {
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Allow /api/v1/files to set its own private short TTL after this middleware.
    const isSignedFile = req.path === '/v1/files' || req.path.startsWith('/v1/files?');
    if (!isSignedFile) {
      res.setHeader('Cache-Control', NO_STORE);
      res.setHeader('Pragma', 'no-cache');
    }
    next();
  });
}

export { NO_STORE as API_NO_STORE_CACHE };
