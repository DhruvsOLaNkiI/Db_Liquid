import type { Express } from 'express';
import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';
const enableHsts = isProduction && process.env.DISABLE_HSTS !== 'true';

/**
 * SEC-008 — Browser security headers via helmet.
 * Applies to Express responses (API + production static SPA).
 * Vite dev server on :3000 is separate; run `npm run build && npm start` to test CSP on UI.
 */
export function applySecurityHeaders(app: Express) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: enableHsts ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: { action: 'deny' },
      hsts: enableHsts
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
        : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
}
