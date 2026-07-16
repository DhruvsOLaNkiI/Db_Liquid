# RL-005 — IP Logging on Bids (Completed)

**Tracker ID:** RL-005  
**Priority:** P2  
**Status:** Done  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Store the **client IP** (and user-agent) on every bid-related action so admins can investigate fraud / multi-account abuse.

Storage was already implemented under **BID-008** (`bid_audit_log.ip`). This item adds:

| Piece | Detail |
|-------|--------|
| Write path | `ip: getClientIp(req)` on place / accept / decline / refund |
| Cloudflare-aware IP | Prefers `CF-Connecting-IP` (RL-003) |
| Admin API filter | `GET /api/admin/bid-audit?ip=` (+ listingId / bidId) |
| Mongo index | `{ ip: 1, createdAt: -1 }` |
| Admin UI | `/admin/verification` → **Bid IP audit** tab |

---

## Where to view

1. Log in as an **admin**
2. Open `/admin/verification`
3. Click **Bid IP audit**
4. Optionally filter by listing ID or IP

API (same data):

```http
GET /api/admin/bid-audit?listingId=<id>&ip=<ip>&limit=100
```

---

## Verify

```bash
npm run test:rl005
```
