# BID-006 — Server Authoritative Timestamps (Completed)

**Tracker ID:** BID-006  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

`createdAt` / auction timestamps must come from the **server clock**, not the browser.

| Field | Behavior |
|-------|----------|
| `bid.createdAt` | Set only in `POST /api/listings/:id/bids` |
| `acceptedAt` / `proceededAt` | Set only in `POST /api/listings/:id/accept-bid` |
| `publishedAt` | Stamped on listing create during sync |
| `biddingEndsAt` | Derived from server `publishedAt` + 7 days on create |
| Existing `publishedAt` | Locked on later sync updates |
| Client-supplied bids on create | Stripped (empty array) |

---

## Files

| File | Change |
|------|--------|
| `server/listingUpdates.ts` | `stampNewListing()` |
| `server/mergeListings.ts` | Preserve `publishedAt` / server `acceptedAt` |
| `server/bids.ts` | Bid `createdAt` from server (already; documented) |
| `scripts/test-bid006.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid006
```
