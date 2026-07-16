import * as Sentry from '@sentry/node';
import type { Express } from 'express';

/**
 * MON-001 — API error monitoring (db-liquid-api).
 * Call initServerSentry() before creating routes that can throw.
 */
export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  return true;
}

/** Must be registered after all routes (Express error middleware order). */
export function setupSentryErrorHandler(app: Express) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
