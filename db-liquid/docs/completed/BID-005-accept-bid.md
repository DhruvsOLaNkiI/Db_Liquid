# BID-005 — Server Accept Bid (Completed)

**Tracker ID:** BID-005  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-11  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

| Requirement | Result |
|-------------|--------|
| `POST /api/listings/:id/accept-bid` | Added |
| Seller-only | Uses JWT cookie user id; must match `listing.sellerId` |
| Server enforced | Listing sync cannot set `acceptedBidId` from null |

---

## Request

```json
{ "bidId": "<existing-bid-id>" }
```

Server sets:

- `acceptedBidId`
- `acceptedAt` (server clock)
- `proceededAt`
- `tokenStatus: "pending"`

---

## Files

| File | Change |
|------|--------|
| `server/bids.ts` | `acceptBidOnServer()` |
| `server/index.ts` | Route |
| `server/mergeListings.ts` | Block accept via sync |
| `src/utils/sharedStore.ts` | `acceptBidOnServer()` client helper |
| `src/context/ListingsContext.tsx` | Accept uses server endpoint |
| `scripts/test-bid005.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid005
```
