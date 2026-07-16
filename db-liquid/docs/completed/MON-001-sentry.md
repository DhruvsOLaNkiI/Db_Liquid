# MON-001 — Sentry Error Tracking (Completed)

**Tracker ID:** MON-001  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-15  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What we installed

```bash
npm install @sentry/react @sentry/node
```

| Package | Where |
|---------|--------|
| `@sentry/react` | Browser / Vite SPA |
| `@sentry/node` | Express API |

---

## Env vars (your DSNs from Sentry)

Put in `db-liquid/.env` (and Hostinger env):

```bash
# React project (db-liquid-web) — Vite exposes VITE_* to the browser
VITE_SENTRY_DSN="https://xxxx@o....ingest.us.sentry.io/...."

# Express project (db-liquid-api) — server only
SENTRY_DSN="https://yyyy@o....ingest.us.sentry.io/...."
```

If unset, the app runs normally with Sentry disabled.

---

## Code changes

| File | Role |
|------|------|
| `src/sentry.ts` | `Sentry.init` for browser |
| `src/main.tsx` | Calls `initBrowserSentry()` + `Sentry.ErrorBoundary` |
| `server/sentry.ts` | `Sentry.init` + Express error handler |
| `server/index.ts` | Init early; `setupSentryErrorHandler(app)` after routes |
| `server/securityHeaders.ts` | CSP `connectSrc` allows Sentry ingest hosts |
| `.env.example` | Documents the two DSNs |

Errors reported automatically:

- Uncaught React render errors → ErrorBoundary  
- Browser bootstrap / API connection failures → `captureException`  
- Unhandled Express errors → `setupExpressErrorHandler`

---

## Verify

1. Add both DSNs to `.env`
2. Restart `npm run dev`
3. In browser console: throw a test error, or use Sentry’s “Send test event”
4. Check Issues in `db-liquid-web` / `db-liquid-api`

```bash
npm run test:mon001
```
