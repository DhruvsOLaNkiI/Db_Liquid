# SEC-002 — Server-Side Auth Middleware (Completed)

**Tracker ID:** SEC-002  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-09  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Server-side auth middleware.** JWT or httpOnly cookies; validate on every protected route.

**Acceptance criteria met:**

- Login sets a signed **JWT** in an **httpOnly cookie** (`db_liquid_session`)
- Protected API routes reject unauthenticated requests with **401**
- Admin routes require `admin` role with **403** if missing
- Client sends cookie automatically via `credentials: 'include'`
- Session restored on page refresh via `GET /api/auth/me`
- Logout clears server cookie

---

## Problem before (what was wrong)

| Area | Before |
|------|--------|
| **Session** | Only `localStorage` on client — server never knew who you were |
| **API writes** | `PUT /api/users`, `PUT /api/listings` open to anyone |
| **Admin APIs** | `/api/admin/*` fully public |
| **Identity** | Client sent `X-Viewer-User-Id` header — easily spoofed |
| **Change password** | Accepted any `userId` in JSON body |
| **Signup** | Client-side `createUser` + unauthenticated `PUT /api/users` |

**Risk:** Anyone could call the API directly and modify users, listings, or admin data without logging in.

---

## What we applied

| Technique | Detail |
|-----------|--------|
| **Token** | JWT signed with `JWT_SECRET` |
| **Storage** | `httpOnly` cookie — JavaScript cannot read it (XSS-safe) |
| **TTL** | 24 hours (matches client session expiry) |
| **Middleware** | `requireAuth`, `requireAdmin`, `optionalAuth` |
| **Client** | `apiFetch()` wrapper with `credentials: 'include'` |
| **Signup** | New `POST /api/auth/register` sets cookie on success |

---

## Files changed

### New files

| File | Purpose |
|------|---------|
| `server/auth.ts` | JWT sign/verify, cookie set/clear |
| `server/authMiddleware.ts` | `requireAuth`, `requireAdmin`, `optionalAuth` |
| `src/utils/api.ts` | `apiFetch()` — sends cookies on every request |
| `scripts/test-sec002.mjs` | Automated auth tests |

### Modified files

| File | What changed |
|------|----------------|
| `server/index.ts` | Cookie parser, auth routes, middleware on protected routes |
| `src/utils/sharedStore.ts` | `apiFetch`, `fetchAuthMe`, `registerViaApi`, `logoutViaApi` |
| `src/context/AuthContext.tsx` | Restore session from `/api/auth/me`, async signup, server logout |
| `src/pages/SignupPage.tsx` | Async signup via register API |
| `src/data/usersTable.ts` | Change-password uses cookie (no `userId` in body) |
| `src/utils/verificationAdmin.ts` | Admin fetches use `apiFetch` |
| `src/utils/listingViews.ts` | Uses `apiFetch` |
| `.env.example` | Added `JWT_SECRET` |
| `package.json` | `jsonwebtoken`, `cookie-parser`, `test:sec002` |

---

## Route protection map

| Route | Before | Now |
|-------|--------|-----|
| `GET /api/health` | Public | Public |
| `POST /api/auth/login` | Public | Public — sets cookie |
| `POST /api/auth/register` | — | Public — creates user + cookie |
| `POST /api/auth/logout` | — | Public — clears cookie |
| `GET /api/auth/me` | — | **requireAuth** |
| `POST /api/auth/change-password` | Open + trusted `userId` body | **requireAuth** — uses JWT user id |
| `GET /api/users` | Public | **optionalAuth** (sanitization) |
| `PUT /api/users` | **Open** | **requireAuth** |
| `GET /api/listings` | Public | **optionalAuth** |
| `PUT /api/listings` | **Open** | **requireAuth** |
| `GET/POST /api/admin/*` | **Open** | **requireAdmin** |

---

## Code: before vs after

### 1. Login — no server session

**Before:**

```ts
res.json({ ok: true, user: sanitizeUser(user, user.id) });
// Client stored userId in localStorage only
```

**After:**

```ts
setAuthCookie(res, savedUser.id, roles);
res.json({ ok: true, user: sanitizeUser(savedUser, savedUser.id) });
// httpOnly db_liquid_session cookie set — JS cannot read it
```

---

### 2. Protected route — `PUT /api/users`

**Before:**

```ts
app.put('/api/users', async (req, res) => {
  // Anyone could call this
```

**After:**

```ts
app.put('/api/users', requireAuth, async (req, res) => {
  // 401 without valid cookie
```

---

### 3. Admin route

**Before:**

```ts
app.get('/api/admin/users', async (_req, res) => {
```

**After:**

```ts
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  // 401 if not logged in, 403 if not admin role
```

---

### 4. Change password — no spoofed userId

**Before:**

```ts
const userId = req.body.userId; // attacker could pass any id
```

**After:**

```ts
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const userId = req.auth!.userId; // from verified JWT only
```

---

### 5. Client fetch

**Before:**

```ts
fetch('/api/users', { method: 'PUT', body: ... })
```

**After:**

```ts
apiFetch('/api/users', { method: 'PUT', body: ... })
// credentials: 'include' sends httpOnly cookie automatically
```

---

### 6. Page refresh session restore

**Before:**

```ts
const found = findUserById(getSession().userId); // localStorage only
```

**After:**

```ts
const me = await fetchAuthMe(); // validates cookie with server
if (me.ok) setUser(me.user);
```

---

## New server modules

### `server/auth.ts`

- `signAuthToken(userId, roles)` — create JWT
- `verifyAuthToken(token)` — validate JWT
- `setAuthCookie(res, userId, roles)` — httpOnly cookie
- `clearAuthCookie(res)` — logout

### `server/authMiddleware.ts`

- `requireAuth` — 401 if no valid cookie
- `requireAdmin` — 401 or 403
- `optionalAuth` — attach user if logged in (for GET sanitization)
- `getViewerIdFromRequest` — prefer JWT over spoofable header

---

## Environment variable

Add to `.env` (required in production):

```env
JWT_SECRET="your-long-random-secret-here"
```

Dev fallback exists if unset (not for production).

---

## What is NOT included (next items)

| ID | Item | Notes |
|----|------|-------|
| SEC-003 | Protect `PUT /api/users` self-only | Any **logged-in** user can still update the full users array — SEC-002 only requires login |
| SEC-004 | Protect listing writes granularly | Writes require auth but not per-listing ownership yet |
| SEC-005/006 | Admin UI guard | API blocked; UI route `/admin/verification` not gated yet |

---

## How to test

### Automated

```bash
cd db-liquid
npm run dev          # terminal 1
npm run test:sec002  # terminal 2
```

**Expected output:**

- PUT without login → **401**
- Admin without login → **401**
- Login → cookie set
- `/api/auth/me` → **200**
- Admin as non-admin → **403**
- Logout → `/me` → **401**

### Browser

1. Open **http://localhost:3000/login** and sign in
2. DevTools → **Application** → **Cookies** → `localhost`
3. Confirm `db_liquid_session` exists with **HttpOnly** ✓
4. Refresh page — you should stay logged in (`/api/auth/me`)
5. Log out — cookie should disappear

### Manual breach test (should fail now)

```bash
# Without cookie — should return 401
curl -X PUT http://localhost:3001/api/users \
  -H 'Content-Type: application/json' \
  -d '[{"id":"x","credits":999999}]'
```

```bash
# Login and save cookie
curl -c /tmp/cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"x"}'

# With cookie — should return 200
curl -b /tmp/cookies.txt -X PUT http://localhost:3001/api/listings \
  -H 'Content-Type: application/json' \
  -d '[]'
```

### Create admin user (for admin API testing)

In MongoDB, add `"admin"` to a user's `roles` array, then log in as that user. Admin routes will return 200 instead of 403.

---

## Dependencies added

```json
"jsonwebtoken": "^9.x",
"cookie-parser": "^1.x",
"@types/jsonwebtoken": "^9.x",
"@types/cookie-parser": "^1.x"
```

---

## Summary

| | Before | Now |
|--|--------|-----|
| Server knows user? | No | Yes — JWT in httpOnly cookie |
| Unauthenticated writes | Allowed | **401** |
| Admin APIs | Public | **401 / 403** |
| Session on refresh | localStorage only | Cookie validated via `/api/auth/me` |
| Password change userId | Client-controlled | JWT-controlled |
