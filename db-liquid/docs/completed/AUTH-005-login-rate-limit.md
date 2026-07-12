# AUTH-005 — Login Rate Limit + Lockout (Completed)

**Tracker ID:** AUTH-005  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-11  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Login rate limit + lockout.** Brute-force protection.

**Acceptance criteria met:**

- Per-email lockout after **5** failed logins for **15 minutes**
- Per-IP rate limit: **30** login attempts per **15 minutes**
- Failed attempts recorded for unknown emails too (same 401 message)
- Successful login clears that email’s failure counter
- `429` + `Retry-After` when blocked
- `trust proxy` enabled so IP limits work behind Hostinger / reverse proxies

---

## How it works

```
POST /api/auth/login
  → assertLoginAllowed(email, ip)
       locked email? → 429 lockout
       IP over limit? → 429 ip_rate
  → verify password
       fail → recordLoginFailure → 401
       ok   → recordLoginSuccess → set cookie
```

State is **in-memory** (fine for a single API process). Multi-instance deploys should move this to Redis later (see RL-001).

---

## Limits

| Guard | Threshold | Window |
|-------|-----------|--------|
| Email lockout | 5 failures | 15 min lock |
| IP rate | 30 attempts | 15 min sliding |

---

## Files

| File | Role |
|------|------|
| `server/loginProtection.ts` | Counters + guard helpers |
| `server/index.ts` | Wired on login; `trust proxy` |
| `scripts/test-auth005.mjs` | Regression test |

---

## Verify

```bash
npm run test:auth005
```
