# SEC-008 — Security Headers (helmet) (Completed)

**Tracker ID:** SEC-008  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Security headers (helmet).** CSP, HSTS, X-Frame-Options, etc.

**Acceptance criteria met:**

- `helmet` middleware on Express
- **CSP** — restricts scripts, styles, images, fonts, connections
- **X-Frame-Options: DENY** — clickjacking protection
- **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin**
- **HSTS** — enabled when `NODE_ENV=production` (off on localhost dev)

---

## Files changed

| File | Change |
|------|--------|
| `server/securityHeaders.ts` | New — `applySecurityHeaders()` |
| `server/index.ts` | Call `applySecurityHeaders(app)` early |
| `package.json` | Added `helmet`, `test:sec008` |
| `.env.example` | Document `DISABLE_HSTS` |

---

## CSP allowances (DB Liquid)

| Directive | Allowed |
|-----------|---------|
| `img-src` | `'self'`, `data:`, `blob:`, `images.unsplash.com` |
| `font-src` | `'self'`, `fonts.gstatic.com` |
| `style-src` | `'self'`, `'unsafe-inline'`, `fonts.googleapis.com` |
| `connect-src` | `'self'` (same-origin API) |
| `frame-ancestors` | `'none'` |

---

## How to verify

```bash
npm run dev          # restart after code changes
npm run test:sec008
```

**Note:** `npm run dev` serves the UI from Vite on **:3000** (no helmet). Headers apply to the **Express server on :3001** (API) and to the **production** SPA when served from `dist/` via `npm start`.

HSTS appears only when `NODE_ENV=production`.

---

## Test output (dev)

```
✓ x-content-type-options: nosniff
✓ x-frame-options: DENY
✓ referrer-policy: strict-origin-when-cross-origin
✓ content-security-policy: ...
○ strict-transport-security: (off in dev)
```
