# BID-012 — Credit Refund Policy (Completed)

**Tracker ID:** BID-012  
**Priority:** P2  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Policy (coded)

| Event | Credit behavior |
|-------|-----------------|
| Place bid | Spend **1** credit |
| Seller declines accepted buyer | Refund **1** credit to that buyer |
| Auction auto-closes with no accepted bid | Refund **1** credit per unrefunded bid on the listing |
| Accepted deal proceeds (not declined) | **No** refund of the bid credit |
| Real money refunds via Razorpay/PayU | Deferred with BID-011 |

Refunds are idempotent via `bid.creditRefundedAt` and appear in `creditHistory` as `type: "refund"`.

---

## Server APIs

| Endpoint | Role |
|----------|------|
| `POST /api/listings/:id/decline-bid` | Seller-only; clears accept + refunds credit |
| Auction closer job | Closes expired auctions + refunds open bids |

---

## Files

| File | Change |
|------|--------|
| `server/creditRefunds.ts` | Shared refund helper + policy notes |
| `server/bids.ts` | `declineAcceptedBidOnServer()` |
| `server/auctionCloser.ts` | Refund on auto-close |
| `src/context/ListingsContext.tsx` | Decline uses server endpoint |
| `src/pages/FAQPage.tsx` / `FAQ.tsx` | Policy documented for users |
| `scripts/test-bid012.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid012
```
