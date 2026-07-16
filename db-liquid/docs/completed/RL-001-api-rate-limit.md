# RL-001 — API Rate Limiting (Completed)

**Tracker ID:** RL-001  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Protect all `/api/*` routes from abusive request volume using `express-rate-limit` (app-level; CDN/WAF is RL-003).

| Setting | Default | Env override |
|---------|---------|--------------|
| Window | 60 seconds | `API_RATE_LIMIT_WINDOW_MS` |
| Max requests / IP | 120 | `API_RATE_LIMIT_MAX` |
| Skipped | `GET /api/health` | — |

Returns `429` with `Retry-After` and `{ error, retryAfterSec }`.

Login lockout remains separate (AUTH-005). Tighter per-route limits are RL-002.

---

## Files

| File | Change |
|------|--------|
| `server/rateLimit.ts` | Global `/api` limiter |
| `server/index.ts` | `applyApiRateLimit(app)` after trust proxy |
| `scripts/test-rl001.mjs` | Regression test |

---

## Verify

```bash
# Optional: lower limits for a fast local test
API_RATE_LIMIT_MAX=5 API_RATE_LIMIT_WINDOW_MS=60000 API_PORT=3021 node --import tsx server/index.ts
API_URL=http://localhost:3021 API_RATE_LIMIT_MAX=5 npm run test:rl001
```
