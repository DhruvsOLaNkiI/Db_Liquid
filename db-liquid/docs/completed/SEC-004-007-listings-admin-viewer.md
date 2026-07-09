# SEC-004–SEC-007 — Listings, Admin & Viewer Identity (Completed)

**Tracker IDs:** SEC-004, SEC-005, SEC-006, SEC-007  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-09  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Summary

| ID | Item | What we did |
|----|------|-------------|
| SEC-004 | Protect `PUT /api/listings` | Legacy bulk PUT → 403; `PUT /api/v1/listings/sync` with server merge rules |
| SEC-005 | Protect `/api/admin/*` | Already `requireAdmin`; verified in tests |
| SEC-006 | Protect `/admin/verification` UI | `AdminRoute` component + `isAdmin` in auth context |
| SEC-007 | Stop trusting `X-Viewer-User-Id` | Viewer id from JWT only; client no longer sends header/query |

---

## SEC-004 — Listings

**Before:** Any logged-in user could `PUT /api/listings` with the full array and inject bids on other sellers' listings.

**After:**

- `PUT /api/listings` → **403** with hints to use v1 endpoints
- `PUT /api/v1/listings/sync` → authenticated sync; `applyListingsSync()` validates ownership
- `PUT /api/v1/admin/listings` → admin bulk import
- `mergeListings.ts` — non-sellers cannot add bids for others; seller-only fields protected

**Test:** `npm run test:sec004`

---

## SEC-005 — Admin APIs

All admin routes use `requireAdmin`:

- `GET /api/admin/verification-queue`
- `POST /api/admin/verification/review`
- `GET /api/admin/users`
- `POST /api/admin/users/review-kyc`

Unauthenticated → **401**. Non-admin → **403**.

---

## SEC-006 — Admin UI

- `src/components/AdminRoute.tsx` — redirects to `/login` if not admin
- `App.tsx` — `/admin/verification` wrapped in `<AdminRoute>`
- `AuthContext` — `isAdmin` from `user.roles.includes('admin')`

---

## SEC-007 — Viewer identity

- `getViewerIdFromRequest()` — returns `req.auth?.userId` only (no header/query fallback)
- `sharedStore.ts` — removed `X-Viewer-User-Id` and `?viewerId=` on fetches
- `listingViews.ts` — server derives logged-in viewer from cookie for view analytics

---

## Files changed

| File | Change |
|------|--------|
| `server/listingUpdates.ts` | New — sync validation |
| `server/routes/v1/listings.ts` | New — sync, admin, deprecated |
| `server/mergeListings.ts` | Secure merge for bids and seller fields |
| `server/authMiddleware.ts` | SEC-007 viewer from JWT only |
| `server/index.ts` | Wire v1 listings routes |
| `src/utils/sharedStore.ts` | Use `/api/v1/listings/sync` |
| `src/components/AdminRoute.tsx` | New — UI guard |
| `src/App.tsx` | Admin route wrapper |
| `src/context/AuthContext.tsx` | `isAdmin` |
| `src/types/user.ts` | `admin` role type |
| `scripts/test-sec004.mjs` | New — SEC-004/005/007 tests |
| `scripts/test-sec002.mjs` | Listings PUT now expects 403 |

---

## How to verify

```bash
npm run dev          # terminal 1
npm run test:sec004  # terminal 2
```

Browser (SEC-006):

1. Log out → visit `/admin/verification` → redirect to login  
2. Log in as non-admin → same redirect  
3. Log in as admin → dashboard loads  
