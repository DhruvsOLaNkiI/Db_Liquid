import * as Sentry from '@sentry/react';

/**
 * MON-001 — browser error monitoring (db-liquid-web).
 * Uses VITE_SENTRY_DSN from env. No-op when unset (local without Sentry).
 */
export function initBrowserSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string') {
    if (import.meta.env.DEV) {
      console.info('[Sentry] Skipped — set VITE_SENTRY_DSN in .env and restart npm run dev');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    // Error monitoring only — no traces/replay on free tier by default
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });

  if (import.meta.env.DEV) {
    console.info('[Sentry] Browser SDK initialized for db-liquid-web');
  }
}

export { Sentry };
