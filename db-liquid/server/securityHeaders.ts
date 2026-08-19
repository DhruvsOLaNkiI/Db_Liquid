import type { Express } from 'express';
import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';
const enableHsts = isProduction && process.env.DISABLE_HSTS !== 'true';

function originFromEnvUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return url.origin;
  } catch {
    return null;
  }
}

/** PERF-002 — allow R2/S3/CDN image hosts in CSP (comma-separated https origins). */
function extraImageSources(): string[] {
  const raw = [
    process.env.IMAGE_CDN_ORIGINS,
    process.env.S3_PUBLIC_HOST,
    process.env.S3_ENDPOINT,
  ]
    .filter(Boolean)
    .join(',');

  const origins = new Set<string>();
  for (const entry of raw.split(',')) {
    const origin = originFromEnvUrl(entry);
    if (origin) origins.add(origin);
  }

  // Presigned R2/S3 URLs are a different host than the app; without this, uploads
  // succeed but the browser shows grey boxes (img-src CSP block).
  if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) {
    origins.add('https://*.r2.cloudflarestorage.com');
    origins.add('https://*.r2.dev');
    origins.add('https://*.amazonaws.com');
  }

  return [...origins];
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
