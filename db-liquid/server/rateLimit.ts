import { ipKeyGenerator, rateLimit, type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Express, Request, Response } from 'express';
import { getClientIp } from './cloudflare';

function envInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function makeLimiter(input: {
  windowMs: number;
  limit: number;
  message: string;
}): RateLimitRequestHandler {
  const { windowMs, limit, message } = input;
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => ipKeyGenerator(getClientIp(req) || 'unknown'),
    handler: (_req: Request, res: Response, _next, optionsUsed: Options) => {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(optionsUsed.statusCode).json({
        error: message,
        retryAfterSec,
      });
    },
  });
}

/**
 * RL-001: global API rate limit by client IP.
 * AUTH-005 still handles login lockout separately.
 */
export function applyApiRateLimit(app: Express) {
  const windowMs = envInt('API_RATE_LIMIT_WINDOW_MS', 60_000);
  const max = envInt('API_RATE_LIMIT_MAX', 120);

  const apiLimiter = rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => ipKeyGenerator(getClientIp(req) || 'unknown'),
    skip: (req: Request) => req.path === '/health',
    handler: (_req: Request, res: Response) => {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: 'Too many requests. Please try again shortly.',
        retryAfterSec,
      });
    },
  });

  app.use('/api', apiLimiter);
}

/** RL-002: login 5 / minute per IP */
export const loginRateLimit = makeLimiter({
  windowMs: envInt('LOGIN_RATE_LIMIT_WINDOW_MS', 60_000),
  limit: envInt('LOGIN_RATE_LIMIT_MAX', 5),
  message: 'Too many login attempts. Please wait and try again.',
});

/** RL-002: signup 3 / hour per IP */
export const signupRateLimit = makeLimiter({
  windowMs: envInt('SIGNUP_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000),
  limit: envInt('SIGNUP_RATE_LIMIT_MAX', 3),
  message: 'Too many signup attempts from this network. Please try again later.',
});

/** RL-002: place bid 10 / minute per IP */
export const placeBidRateLimit = makeLimiter({
  windowMs: envInt('BID_RATE_LIMIT_WINDOW_MS', 60_000),
  limit: envInt('BID_RATE_LIMIT_MAX', 10),
  message: 'Too many bid attempts. Please wait a moment and try again.',
});
