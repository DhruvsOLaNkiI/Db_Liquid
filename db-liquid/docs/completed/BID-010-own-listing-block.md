# BID-010 — Block Seller Bidding on Own Listing (Completed)

**Tracker ID:** BID-010  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Sellers must not be able to bid on their own listing, even if they call the API directly (UI hide is not enough).

| Layer | Behavior |
|-------|----------|
| Server | `POST /api/listings/:id/bids` returns `403` when `listing.sellerId === auth.userId` |
| UI | Bid form is hidden for the listing owner (`PropertyBidPage`) |

Implemented in `server/bids.ts` as part of server-side bid creation (BID-001+).

---

## Files

| File | Change |
|------|--------|
| `server/bids.ts` | Own-listing guard (`403`) |
| `scripts/test-bid010.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid010
```
