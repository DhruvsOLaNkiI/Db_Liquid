# SEC-010 — CSRF Protection (Completed)

**Tracker ID:** SEC-010  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **CSRF protection.** If using cookie sessions.

**Acceptance criteria met:**

- Double-submit CSRF cookie (`db_liquid_csrf`, readable by JS)
- Mutating requests must send matching `X-CSRF-Token` header
- `GET /api/auth/csrf` issues/refreshes the token
- Client `apiFetch` auto-fetches CSRF and attaches the header
- Login/register rotate CSRF; logout clears it

---

## How it works      
import (React) "./rect/import 

```
1. Browser GET /api/auth/csrf  →  Set-Cookie: db_liquid_csrf=<token>
2. Browser POST /api/...       →  Cookie: db_liquid_csrf=<token>
                                 Header: X-CSRF-Token: <token>
3. Server compares cookie === header  →  allow or 403
```

Evil sites can trigger cookie send but **cannot read** the CSRF cookie (same-origin policy) to set the header.

Works together with existing `SameSite=Lax` on the session cookie.

---

## Files changed

| File | Change |
|------|--------|
| `server/csrf.ts` | New — cookie helpers + `requireCsrf` |
| `server/index.ts` | CSRF on mutating routes + `/api/auth/csrf` |
| `src/utils/api.ts` | Auto CSRF header on POST/PUT/PATCH/DELETE |
| `scripts/api-test-client.mjs` | Shared test cookie/CSRF helper |
| `scripts/test-sec010.mjs` | SEC-010 tests |
| Other `test-sec00*.mjs` | Updated to send CSRF |

---

## How to verify

```bash
npm run dev          # restart after pull
npm run test:sec010
```

Expected:

- Login without CSRF → **403**
- Login with CSRF → **200**
- Wrong CSRF header → **403**
