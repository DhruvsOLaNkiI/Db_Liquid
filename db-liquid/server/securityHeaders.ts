import type { Express } from 'express';
import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';
const enableHsts = isProduction && process.env.DISABLE_HSTS !== 'true';

/** PERF-002 — allow R2/S3/CDN image hosts in CSP (comma-separated https origins). */
function extraImageSources(): string[] {
  const raw = process.env.IMAGE_CDN_ORIGINS || process.env.S3_PUBLIC_HOST || '';
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('https://') || entry.startsWith('http://'));
}

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
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          frameSrc: ["'self'", 'https://corporate.digitalbroker.in'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://images.unsplash.com',
            'https://www.google-analytics.com',
            'https://www.googletagmanager.com',
            ...extraImageSources(),
          ],
          mediaSrc: ["'self'", 'blob:', ...extraImageSources()],
          objectSrc: ["'none'"],
          // unsafe-inline needed for GA gtag bootstrap snippet in index.html
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          connectSrc: [
            "'self'",
            ...extraImageSources(),
            // MON-001 — browser SDK posts errors to Sentry ingest
            'https://*.ingest.sentry.io',
            'https://*.ingest.us.sentry.io',
            'https://www.google-analytics.com',
            'https://analytics.google.com',
            'https://www.googletagmanager.com',
            'https://*.google-analytics.com',
            'https://*.analytics.google.com',
          ],
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
