# BID-008 — Immutable Bid Audit Log (Completed)

**Tracker ID:** BID-008  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Keep a dispute-ready record of bids that the client cannot edit:

| Field | Source |
|-------|--------|
| Who | `actorUserId`, `bidderUserId`, `bidderName` |
| When | Server `createdAt` |
| Amount | `bidTotal`, `amountPerSqFt` |
| IP | Client IP (`X-Forwarded-For` / `req.ip`) |
| Extra | `userAgent`, `idempotencyKey`, `action` |

---

## Storage

- Mongo collection: `bid_audit_log`
- **Append-only** (`insertOne` only — no update/delete API)
- Separate from listings sync, so clients cannot rewrite history

Actions logged:

- `place` — new bid created
- `place_replay` — idempotent retry (BID-007)
- `accept` — seller accepted a bid

---

## Admin API

```http
GET /api/admin/bid-audit?listingId=<id>&bidId=<id>&limit=100
```

Requires admin session.

---

## Files

| File | Change |
|------|--------|
| `server/bidAudit.ts` | Append-only store + query |
| `server/index.ts` | Log on place/accept; admin read route |
| `scripts/test-bid008.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid008
```
