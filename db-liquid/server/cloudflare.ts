import type { NextFunction, Request, Response } from 'express';

/**
 * Prefer Cloudflare's client IP when the orange-cloud proxy is in front (RL-003).
 * Falls back to X-Forwarded-For / Express req.ip for local / Hostinger-only.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim();
  }
  if (Array.isArray(cfIp) && cfIp[0]) {
    return String(cfIp[0]).trim();
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).split(',')[0]!.trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Optional: reject traffic that never passed through Cloudflare (production hardening).
 * Enable with REQUIRE_CLOUDFLARE=true after DNS is proxied (orange cloud).
 * Spoofing CF-Ray is still possible if origin is public — also lock Hostinger firewall to Cloudflare IPs.
 */
export function requireCloudflareProxy(req: Request, res: Response, next: NextFunction) {
  if (process.env.REQUIRE_CLOUDFLARE !== 'true') {
    next();
    return;
  }

  const path = req.path || '';
  if (path === '/api/health' || path === '/health') {
    next();
    return;
  }

  const cfRay = req.headers['cf-ray'];
  if (typeof cfRay === 'string' && cfRay.trim()) {
    next();
    return;
  }

  res.status(403).json({ error: 'Direct origin access is not allowed.' });
}
