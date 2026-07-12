# SEC-009 — Input Validation with Zod (Completed)

**Tracker ID:** SEC-009  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Input validation (Zod/Joi).** All POST/PUT bodies validated.

**Acceptance criteria met:**

- Zod schemas for every mutating API body
- Shared `validateBody()` middleware returns **400** with clear errors
- Parsed/coerced values replace `req.body` before handlers run
- Unknown fields rejected on strict object schemas (e.g. cannot PATCH `password`)

---

## Routes covered

| Method | Path | Schema |
|--------|------|--------|
| POST | `/api/auth/login` | `loginBodySchema` |
| POST | `/api/auth/register` | `registerBodySchema` |
| POST | `/api/auth/change-password` | `changePasswordBodySchema` |
| PATCH | `/api/v1/users/me` | `patchCurrentUserBodySchema` |
| PUT | `/api/v1/admin/users` | `adminUsersBodySchema` |
| POST | `/api/listings/:id/record-view` | `recordViewBodySchema` |
| PUT | `/api/v1/listings/sync` | `listingsArrayBodySchema` |
| PUT | `/api/v1/admin/listings` | `listingsArrayBodySchema` |
| POST | `/api/admin/verification/review` | `reviewVerificationBodySchema` |
| POST | `/api/admin/users/review-kyc` | `reviewKycBodySchema` |

Deprecated endpoints (`PUT /api/users`, `PUT /api/listings`) still return **403** without needing body validation.

---

## Files changed

| File | Change |
|------|--------|
| `server/schemas.ts` | New — Zod schemas |
| `server/validate.ts` | New — `validateBody()` middleware |
| `server/index.ts` | Wire middleware on mutating routes |
| `server/routes/v1/users.ts` | Rely on middleware (removed duplicate checks) |
| `server/routes/v1/listings.ts` | Rely on middleware |
| `package.json` | Added `zod`, `test:sec009` |

---

## Error shape

```json
{
  "error": "email: Enter a valid email address.",
  "details": [
    { "path": "email", "message": "Enter a valid email address." }
  ]
}
```

---

## How to verify

```bash
npm run dev          # terminal 1 — restart after pull
npm run test:sec009  # terminal 2
```
