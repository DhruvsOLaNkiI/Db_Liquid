# BID-001 through BID-004 — Server-Side Bids (Completed)

**Tracker IDs:** BID-001, BID-002, BID-003, BID-004  
**Priority:** P0  
**Status:** Done  
**Completed:** 2026-07-11  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What these items required

| ID | Requirement | Result |
|----|-------------|--------|
| BID-001 | `POST /api/listings/:id/bids` | Added server-only bid creation endpoint |
| BID-002 | Server validates bid rules | Login, credits, open auction, not own listing |
| BID-003 | Minimum increment | Bid must be greater than current highest |
| BID-004 | Atomic bid + credit deduction | Server-side serialized critical section updates user credits/history + listing bid together |

---

## New flow

The browser now sends only:

```json
{ "bidTotal": 112 }
```

The server creates:

- `bid.id`
- `bidderName` / `bidderPhone` from authenticated user
- `bidderUserId` from JWT cookie
- `amountPerSqFt`
- `createdAt` from server clock
- credit spend history row

---

## Security behavior

- Client cannot invent bidder identity or timestamp
- Client cannot skip credit deduction
- Client cannot bid after close or after accepted bid
- Client cannot bid on own listing
- Old `/api/v1/listings/sync` no longer creates/edits bid records

Note: the current `app_state` storage shape keeps users and listings in separate documents, and this dev Mongo setup does not support multi-document transactions. The server now serializes the bid critical section so one request computes and saves the credit spend + bid together. A future schema split can move this to Mongo transaction/atomic document updates.

---

## Files

| File | Change |
|------|--------|
| `server/bids.ts` | Server bid rules + credit/listing update |
| `server/index.ts` | `POST /api/listings/:id/bids` |
| `server/mongoStore.ts` | `updateUsersAndListings()` serialized critical section |
| `server/mergeListings.ts` | Sync preserves existing bids only |
| `src/context/ListingsContext.tsx` | Place Bid uses server endpoint |
| `src/utils/sharedStore.ts` | `createBidOnServer()` |
| `scripts/test-bid001.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid001
```
