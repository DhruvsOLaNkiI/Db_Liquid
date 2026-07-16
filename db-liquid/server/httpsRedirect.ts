import type { NextFunction, Request, Response } from 'express';

/**
 * INFRA-001 — Prefer HTTPS when behind Cloudflare / reverse proxies.
 * Uses X-Forwarded-Proto (needs trust proxy). Skipped on localhost.
 * Enable with FORCE_HTTPS=true or automatically when NODE_ENV=production.
 */
export function forceHttps(req: Request, res: Response, next: NextFunction) {
  const enabled =
    process.env.FORCE_HTTPS === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false');

  if (!enabled) {
    next();
    return;
  }

  const host = String(req.hostname || '');
  if (host === 'localhost' || host === '127.0.0.1') {
    next();
    return;
  }

  const forwarded = req.headers['x-forwarded-proto'];
  const proto =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]!.trim().toLowerCase()
      : req.protocol;

  if (proto === 'https') {
    next();
    return;
  }

  const targetHost = req.headers.host || host;
  res.redirect(301, `https://${targetHost}${req.originalUrl}`);
}
