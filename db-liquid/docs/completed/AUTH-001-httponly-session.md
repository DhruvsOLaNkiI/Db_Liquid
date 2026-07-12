# AUTH-001 — Replace localStorage Session (Completed)

**Tracker ID:** AUTH-001  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Replace `localStorage` session.** httpOnly secure cookie or short-lived JWT + refresh.

**Acceptance criteria met:**

- Auth identity is the httpOnly JWT cookie `db_liquid_session` (from SEC-002)
- Client no longer stores `userId` / expiry / roles as an auth session in `localStorage`
- Legacy key `db-liquid-session` is cleared on load / login / logout
- Session restore uses `GET /api/auth/me` (cookie) only
- Periodic / visibility checks call `/api/auth/me` instead of reading localStorage TTL
- In-memory `getAuthUserId()` exists only for client cache writes (not a security boundary)

---

## Why

`localStorage` is readable by any XSS script. Stealing a stored `userId`/session blob lets attackers impersonate the user in the UI. httpOnly cookies cannot be read by JavaScript.

---

## Architecture

```
Browser                          API
───────                          ───
Login  ──────────────────────►  Set-Cookie: db_liquid_session (httpOnly JWT)
                                 
Reload ── GET /api/auth/me ──►  Verify JWT cookie → user JSON
         (credentials: include)

localStorage: NO auth session
Memory: optional userId for cache patches only
```

---

## Files

| File | Change |
|------|--------|
| `src/utils/authSession.ts` | New — in-memory user id + legacy cleanup |
| `src/data/usersTable.ts` | Removed `getSession` / `setSession` / localStorage session |
| `src/context/AuthContext.tsx` | Cookie + `/api/auth/me` only |
| `src/utils/sharedStore.ts` | Uses `getAuthUserId()` instead of localStorage |
| `src/types/user.ts` | Removed `AuthSession` type |

---

## Verify

```bash
npm run test:auth001
```

In DevTools → Application → Local Storage: after login, `db-liquid-session` must be absent.  
Application → Cookies: `db_liquid_session` must be **HttpOnly**.
