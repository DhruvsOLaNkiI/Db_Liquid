# RL-002 — Per-Route Rate Limits (Completed)

**Tracker ID:** RL-002  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Tighter IP limits on abuse-prone endpoints (on top of RL-001 global `/api` limit and AUTH-005 login lockout).

| Route | Default limit | Env overrides |
|-------|---------------|---------------|
| `POST /api/auth/login` | 5 / minute | `LOGIN_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_WINDOW_MS` |
| `POST /api/auth/register` | 3 / hour | `SIGNUP_RATE_LIMIT_MAX`, `SIGNUP_RATE_LIMIT_WINDOW_MS` |
| `POST /api/listings/:id/bids` | 10 / minute | `BID_RATE_LIMIT_MAX`, `BID_RATE_LIMIT_WINDOW_MS` |

Each returns `429` with a route-specific message + `Retry-After`.

---

## Files

| File | Change |
|------|--------|
| `server/rateLimit.ts` | `loginRateLimit`, `signupRateLimit`, `placeBidRateLimit` |
| `server/index.ts` | Mounted on login / register / bids |
| `scripts/test-rl002.mjs` | Regression test |

---

## Verify

```bash
API_PORT=3022 LOGIN_RATE_LIMIT_MAX=2 API_RATE_LIMIT_MAX=200 node --import tsx server/index.ts
API_URL=http://localhost:3022 LOGIN_RATE_LIMIT_MAX=2 npm run test:rl002
```
