# SEC-003 — Protect `PUT /api/users` (Completed)

**Tracker ID:** SEC-003  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-09  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Protect `PUT /api/users`.** Only authenticated user can update self; admin for others.

**Acceptance criteria met:**

- Legacy bulk `PUT /api/users` is **blocked** (403 + migration hint)
- Users update **only themselves** via `PATCH /api/v1/users/me`
- Admins use versioned bulk endpoint `PUT /api/v1/admin/users`
- Server blocks privilege escalation (`admin` role, `id`, `password`, etc.)
- Credit changes require valid `creditHistory` append (no free credits)

---

## Problem before (what was wrong)

| Area | Before (after SEC-002) |
|------|-------------------------|
| `PUT /api/users` | Any **logged-in** user could send full users array |
| Attack | Change **another user's** credits, email, or add `admin` role |
| API shape | One bulk endpoint for everything |
| Versioning | None — hard to change without breaking clients |

**Example attack (fixed now):**
```bash
# Logged in as user A, overwrite user B's credits
PUT /api/users
[{ "id": "USER_B_ID", "credits": 999999 }]
```

---

## What we applied

| Technique | Detail |
|-----------|--------|
| **API versioning** | New routes under `/api/v1/` |
| **Self update** | `PATCH /api/v1/users/me` — JWT user only |
| **Admin bulk** | `PUT /api/v1/admin/users` — `requireAdmin` |
| **Legacy deprecation** | `PUT /api/users` → **403** with `use` hints |
| **Field allowlist** | Server strips/forbids dangerous self fields |
| **Credit validation** | History must append; balance must match |

---

## API versioning map

| Version | Endpoint | Method | Who | Purpose |
|---------|----------|--------|-----|---------|
| legacy | `/api/users` | PUT | — | **Deprecated → 403** |
| **v1** | `/api/v1/users/me` | PATCH | Logged-in user | Update own profile/credits |
| **v1** | `/api/v1/admin/users` | PUT | Admin only | Bulk import / admin tools |
| legacy | `/api/users` | GET | Public | Unchanged (sanitized read) |

**Response when legacy PUT is used:**
```json
{
  "error": "Bulk user writes are not allowed on this endpoint.",
  "deprecated": true,
  "use": {
    "self": "PATCH /api/v1/users/me",
    "admin": "PUT /api/v1/admin/users"
  }
}
```

---

## Files changed

### New files

| File | Purpose |
|------|---------|
| `server/userUpdates.ts` | Self-patch rules, credit validation, admin merge |
| `server/routes/v1/users.ts` | v1 handlers: PATCH me, PUT admin, legacy 403 |
| `scripts/test-sec003.mjs` | Automated SEC-003 tests |

### Modified files

| File | What changed |
|------|----------------|
| `server/index.ts` | Wire v1 routes; deprecate `PUT /api/users`; dual-role on login |
| `src/utils/sharedStore.ts` | `mutateUsers` → `PATCH /api/v1/users/me`; admin bulk API |
| `src/data/usersTable.ts` | `ensureDualRole` in-memory; async `replaceAllUsers` |
| `src/utils/testDataExcel.ts` | Await admin bulk import |
| `PRODUCTION_READINESS.md` | SEC-003 marked `[x]` |

---

## Code: before vs after

### 1. Bulk user write — `PUT /api/users`

**Before:**
```ts
app.put('/api/users', requireAuth, async (req, res) => {
  const merged = mergeUsersForSave(existing, req.body);
  await saveUsers(hashed); // any logged-in user, any user id
});
```

**After:**
```ts
app.put('/api/users', requireAuth, deprecatedBulkUsersPut); // 403

app.patch('/api/v1/users/me', requireAuth, patchCurrentUser);
app.put('/api/v1/admin/users', requireAdmin, putAdminUsers);
```

---

### 2. Client save — full array → self PATCH

**Before:**
```ts
await apiFetch('/api/users', { method: 'PUT', body: JSON.stringify(allUsers) });
```

**After:**
```ts
await apiFetch('/api/v1/users/me', {
  method: 'PATCH',
  body: JSON.stringify(changedFieldsOnly),
});
```

---

### 3. Self-update rules — `server/userUpdates.ts`

**Blocked for self:**
- `id`, `createdAt`, `password`
- Adding `admin` role (only `buyer` / `seller` can be added)

**Credits:**
- Must append exactly one `creditHistory` entry
- `credits` must equal `balanceAfter` on that entry

---

## Protected vs open (after SEC-003)

| Action | Endpoint | Auth | Result |
|--------|----------|------|--------|
| Read users | `GET /api/users` | Optional | Public sanitized data |
| Bulk write (legacy) | `PUT /api/users` | Login | **403 deprecated** |
| Update self | `PATCH /api/v1/users/me` | Login | **200** own user only |
| Bulk write (admin) | `PUT /api/v1/admin/users` | Admin | **200** |
| Escalate to admin | `PATCH /api/v1/users/me` | Login | **Ignored** — no admin role |

---

## How to test

### Automated
```bash
cd db-liquid
npm run dev
npm run test:sec003
```

### Thunder Client / Postman

**1. Login**
```
POST http://localhost:3001/api/auth/login
{"email":"a@b.com","password":"x"}
```

**2. Legacy bulk (should fail)**
```
PUT http://localhost:3001/api/users
[{"id":"any-id","credits":999999}]
```
→ **403** + `use.self` / `use.admin` hints

**3. Self update (should work)**
```
PATCH http://localhost:3001/api/v1/users/me
{"name":"My Name"}
```
→ **200**

**4. Admin bulk (non-admin)**
```
PUT http://localhost:3001/api/v1/admin/users
[]
```
→ **403**

---

## What is NOT included (next items)

| ID | Item |
|----|------|
| SEC-004 | Protect listing writes (same pattern for listings) |
| SEC-007 | Stop trusting `X-Viewer-User-Id` header |
| BID-001+ | Dedicated server bid/credit endpoints |

---

## Summary

| | Before SEC-003 | After SEC-003 |
|--|----------------|---------------|
| Logged-in user | Could edit **any** user via PUT | Can only **PATCH self** |
| Bulk import | `PUT /api/users` | Admin: `PUT /api/v1/admin/users` |
| API versioning | None | `/api/v1/...` for writes |
| Role escalation | Possible | Blocked server-side |
