import type { Express, Request, Response, NextFunction } from 'express';
import path from 'node:path';
import express from 'express';

const IMMUTABLE_ASSET = /\/assets\/[^/]+\.[a-z0-9]+$/i;
const LONG_CACHE = 'public, max-age=31536000, immutable';
const NO_CACHE_HTML = 'no-cache, no-store, must-revalidate';

/**
 * PERF-001 / PERF-003 — Cache-Control for Vite SPA output.
 * Hashed /assets/* → long CDN/browser cache; index.html → never cache.
 * Cloudflare (RL-003) can honor these headers when proxying the origin.
 */
export function applyStaticAssetCaching(app: Express, distPath: string) {
  app.use(
    express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        const base = path.basename(filePath);
        if (base === 'index.html') {
          res.setHeader('Cache-Control', NO_CACHE_HTML);
          return;
        }
        if (filePath.includes(`${path.sep}assets${path.sep}`) || IMMUTABLE_ASSET.test(filePath)) {
          res.setHeader('Cache-Control', LONG_CACHE);
          return;
        }
        // Other public files (favicon, robots, etc.)
        res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    }),
  );

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API route not found.' });
      return;
    }
    res.setHeader('Cache-Control', NO_CACHE_HTML);
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}
