# AUTH-006 — RBAC (Completed)

**Tracker ID:** AUTH-006  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-11  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Product model

DB Liquid accounts are **dual-role by design**:

| Role set | Who | Can |
|----------|-----|-----|
| `buyer` + `seller` | Every registered member | Browse, bid, list & manage **own** properties |
| `admin` | Elevated staff only | Verification queue, KYC review, admin bulk APIs |

There is **no** separate “buyer-only” vs “seller-only” account type.

---

## Server enforcement (not UI-only)

| Rule | Where |
|------|--------|
| Must be logged in | `requireAuth` / `requireMember` |
| Must be admin | `requireAdmin` on `/api/admin/*` and `/api/v1/admin/*` |
| Cannot self-grant `admin` | `PATCH /api/v1/users/me` rejects `roles` |
| Own listings only | `applyListingsSync` — create/edit by `sellerId === JWT userId` |
| UI admin gate | `AdminRoute` (extra UX; API still enforces) |

---

## Acceptance criteria met

- [x] Roles exist: `buyer`, `seller`, `admin`
- [x] Members get `buyer` + `seller` on register (product requirement)
- [x] Admin APIs blocked for non-admins (`403`)
- [x] Members cannot change their own roles via profile API
- [x] Listing writes scoped to ownership on the server
- [x] `requireRole` / `requireMember` helpers available for future bid APIs

**Out of scope / later:** dedicated `POST /api/listings/:id/bids` (BID-001+) will use `requireMember` + credits — not a separate buyer-only role.

---

## Verify

```bash
npm run test:auth006
```
