# BID-009 — Auto-Close Expired Auctions (Completed)

**Tracker ID:** BID-009  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

When `biddingEndsAt` passes, the server must persist a closed auction state (not only rely on client clock checks).

| Behavior | Detail |
|----------|--------|
| Job | Runs on API start + every `AUCTION_CLOSE_INTERVAL_MS` (default 60s) |
| Action | Sets `auctionClosedAt` on expired, non-accepted listings |
| Idempotent | Skips listings that already have `auctionClosedAt` or an accepted bid |
| Sync | Clients cannot clear `auctionClosedAt` |
| Bids | Place-bid also runs the closer first, then rejects closed auctions |

---

## Admin trigger

```http
POST /api/admin/close-expired-auctions
```

---

## Files

| File | Change |
|------|--------|
| `server/auctionCloser.ts` | Closer job + `closeExpiredAuctions()` |
| `server/index.ts` | Start interval; admin route; pre-bid close |
| `server/bids.ts` / client `isBiddingOpen` | Treat `auctionClosedAt` as closed |
| `server/mergeListings.ts` | Preserve `auctionClosedAt` |
| `scripts/test-bid009.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid009
```
