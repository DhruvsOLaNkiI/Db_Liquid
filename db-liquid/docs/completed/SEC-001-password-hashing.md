# SEC-001 — Password Hashing (Completed)

**Tracker ID:** SEC-001  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-09  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

From the production readiness tracker:

> **Hash passwords (bcrypt/argon2).** No plaintext in DB; migrate existing users on login.

**Acceptance criteria met:**

- Passwords are never stored as plaintext in MongoDB after save
- New signups, password changes, and bulk user imports are hashed on the server
- Existing users with legacy plaintext passwords can still log in once; their password is upgraded to bcrypt automatically on that login
- API responses still never expose password hashes to other users (existing `sanitize.ts` behavior kept)

---

## Problem before (what was wrong)

| Area | Before |
|------|--------|
| **MongoDB** | User `password` field stored raw text, e.g. `seller123`, `buyer123` |
| **Login API** | Compared with `entry.password === password` (direct string match) |
| **Change password API** | Saved new password as plaintext: `password: newPassword` |
| **Signup / user save** | Client sent plaintext via `PUT /api/users`; server saved it as-is |
| **Client cache** | After signup, plaintext password could sit in in-memory user cache |
| **Client `validateLogin`** | Compared plaintext locally (unused in app, but unsafe if called) |
| **Dependencies** | No `bcrypt` or `argon2` package |

**Risk:** Anyone with database access (or a DB leak) could read every user's password directly.

---

## What we applied

| Technique | Detail |
|-----------|--------|
| **Library** | `bcrypt` (npm package) |
| **Cost factor** | 12 rounds (`BCRYPT_ROUNDS = 12`) |
| **Hash format** | Standard bcrypt string, e.g. `$2b$12$...` |
| **Verification** | `bcrypt.compare()` for hashed passwords |
| **Legacy support** | Plaintext still accepted temporarily via `verifyPassword()` for migration only |
| **Migration trigger** | On successful login, if stored password is not bcrypt → re-hash and `saveUsers()` |
| **Bulk hashing** | `PUT /api/users` runs `hashPlaintextPasswords()` before every save |
| **Client hygiene** | Passwords stripped from browser cache after successful server save |

---

## Files changed

### New file

| File | Purpose |
|------|---------|
| `server/password.ts` | Central password helpers: hash, verify, detect hash, bulk hash |

### Modified files

| File | What changed |
|------|----------------|
| `server/index.ts` | Login, change-password, and `PUT /api/users` use bcrypt |
| `src/utils/sharedStore.ts` | Strip passwords from client cache after save |
| `src/data/usersTable.ts` | Signup returns user without password; `validateLogin` disabled |
| `package.json` | Added `bcrypt` + `@types/bcrypt` |
| `PRODUCTION_READINESS.md` | SEC-001 marked `[x]` done |

### Unchanged (still relevant)

| File | Role |
|------|------|
| `server/sanitize.ts` | Still removes `password` from API responses to other users |
| `src/context/AuthContext.tsx` | Still uses `loginViaApi()` — no client-side password check |
| `server/mergeUsers.ts` | Merge logic unchanged; hashing happens after merge in `index.ts` |

---

## Code: before vs after

### 1. Login — `POST /api/auth/login`

**Before:**

```ts
const user = users.find(
  (entry) =>
    entry.email.toLowerCase() === email &&
    entry.password === password,  // plaintext compare
);
```

**After:**

```ts
const index = users.findIndex((entry) => entry.email.toLowerCase() === email);
const user = users[index];
const valid = await verifyPassword(password, user.password);

if (user.password && !isPasswordHashed(user.password)) {
  users[index] = { ...user, password: await hashPassword(password) };
  await saveUsers(users);  // migrate legacy user on login
}
```

---

### 2. Change password — `POST /api/auth/change-password`

**Before:**

```ts
if (user.password !== currentPassword) { /* error */ }
users[index] = { ...user, password: newPassword };  // plaintext
```

**After:**

```ts
const valid = await verifyPassword(currentPassword, user.password);
users[index] = { ...user, password: await hashPassword(newPassword) };  // bcrypt
```

---

### 3. Save users — `PUT /api/users`

**Before:**

```ts
const merged = mergeUsersForSave(existing, req.body);
await saveUsers(merged);  // could persist plaintext
```

**After:**

```ts
const merged = mergeUsersForSave(existing, req.body);
const hashed = await hashPlaintextPasswords(merged);
await saveUsers(hashed);  // only bcrypt hashes in DB
```

Covers: signup, test Excel import, localStorage bootstrap migration, profile/credit updates that re-save the users array.

---

### 4. New module — `server/password.ts`

```ts
hashPassword(plain)           → bcrypt hash string
verifyPassword(plain, stored) → bcrypt.compare OR legacy plain === plain
isPasswordHashed(stored)      → detects $2a$ / $2b$ / $2y$ prefix
hashPlaintextPasswords(users) → hash any user still on plaintext
```

---

### 5. Client cache — `src/utils/sharedStore.ts`

**Before:** After `apiSaveUsers`, cache could still hold plaintext passwords (e.g. right after signup).

**After:**

```ts
function stripPasswordsFromUsers(users: User[]): User[] {
  return users.map(({ password: _password, ...rest }) => ({ ...rest, password: '' }));
}
// Called after every successful apiSaveUsers in persistUsers, mutateUsers, bootstrap
```

---

### 6. Signup return value — `src/data/usersTable.ts`

**Before:** `return { ok: true, user }` — user object included plaintext password.

**After:** `return { ok: true, user: { ...user, password: '' } }` — password sent to server once, not kept in React state.

---

## How it works now (flows)

### Login (legacy user, first time after deploy)

```
User enters email + password
    → POST /api/auth/login
    → verifyPassword: plain === stored (legacy)
    → hashPassword(plain) → save to MongoDB
    → return sanitized user (no password in response)
```

### Login (already migrated user)

```
User enters email + password
    → verifyPassword: bcrypt.compare(plain, hash)
    → no DB write needed
    → return sanitized user
```

### Signup

```
Client createUser() builds user with plaintext password
    → PUT /api/users (full users array)
    → server: hashPlaintextPasswords() on new user
    → MongoDB stores bcrypt hash only
    → client cache: passwords stripped
```

### Change password (Profile page)

```
Client POST /api/auth/change-password
    → verify current (bcrypt or legacy)
    → hash new password → saveUsers()
```

---

## Database example

| Field | Before | After (migrated) |
|-------|--------|------------------|
| `password` | `seller123` | `$2b$12$8K1p/a0dL1LXMIgoEDFrwOe6g...` (60 chars) |

Test accounts (`seller123`, `buyer123`, `both1234` from test workbook) keep working until first login; then they are hashed automatically.

---

## What is NOT included (future items)

These are separate production readiness tasks:

| ID | Item | Why not in SEC-001 |
|----|------|---------------------|
| SEC-002 | Server-side auth middleware (JWT / httpOnly cookies) | SEC-001 only covers password storage |
| SEC-003 | Protect `PUT /api/users` | Route is still open; only hashing was added |
| AUTH-002 | Move signup fully to server endpoint | Signup still starts on client; server hashes on save |

---

## How to verify

1. Restart API: `npm run dev`
2. Log in with a test account (e.g. seller / `seller123`)
3. Log in again — should still work
4. In MongoDB `app_state` → `users` document, confirm `password` starts with `$2b$12$`
5. Change password on Profile — new value in DB should also be bcrypt
6. Create a new account — password in DB should be bcrypt immediately after signup

---

## Dependencies added

```json
"bcrypt": "^6.0.0",
"@types/bcrypt": "^6.0.0"
```

---

## Summary

| | Before | Now |
|--|--------|-----|
| Storage in MongoDB | Plaintext | bcrypt (12 rounds) |
| Login check | `===` string compare | `verifyPassword()` + migrate on login |
| New passwords | Saved as typed | Hashed before `saveUsers()` |
| Client memory | Could hold plaintext | Stripped after server save |
| DB leak impact | Passwords readable | Only hashes exposed (not reversible to plain text) |
