# MON-002 → MON-006 — Monitoring & reliability

**Tracker IDs:** MON-002, MON-003, MON-004, MON-005, MON-006  
**Priority:** P1 / P2  
**Status:** Done  
**Completed:** 2026-07-15  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## MON-002 — Structured logging

| Piece | Detail |
|-------|--------|
| Logger | Pino (`server/logger.ts`) |
| HTTP | `pino-http` access logs (skips `/api/health`) |
| Request ID | `req.id` + response header `X-Request-Id` |
| Level | `LOG_LEVEL` (default `debug` locally, `info` in production) |

Pretty transport (`pino-pretty`) is used outside production only.

---

## MON-003 — Uptime monitoring

Probe: `GET /api/health` → `{ "ok": true }` or `503 { "ok": false }` (no secrets — SEC-012).

### External ping setup (ops)

1. Create a monitor in [UptimeRobot](https://uptimerobot.com/), Better Stack, Pingdom, or Cloudflare Health Checks.
2. URL: `https://<your-domain>/api/health`
3. Interval: 1–5 minutes; alert on non-2xx or body without `"ok":true`.
4. Optional keyword check: `"ok":true`.

Health failures are also logged + sent to Sentry (see MON-004).

---

## MON-004 — Alerts

| Signal | Where |
|--------|--------|
| DB down / health fail | Sentry exception from `/api/health` + uptime monitor |
| Bid route failures | Structured `bid.rejected` / `bid.failed` logs + Sentry (`reportBidFailure`) |
| Payment alerts | **Deferred** (no payment gateway yet) |

**Suggested Sentry alerts:** Issues with tag `bid.action`, spike in `health.check_failed`, new unresolved issues.

**Suggested uptime alerts:** email / Slack / PagerDuty on consecutive failed health checks.

---

## MON-005 — Product analytics funnel

Events stored in Mongo `product_events` and mirrored to structured logs (`funnel.<event>`):

| Event | When |
|-------|------|
| `signup` | `POST /api/auth/register` |
| `top_up` | `PATCH /api/v1/users/me` when credits increase |
| `place_bid` | Successful non-idempotent place bid |
| `accept_bid` | Seller accepts bid |
| `decline_bid` | Seller declines accepted bid |

Admin read: `GET /api/admin/product-events?event=&userId=&limit=`

Funnel view: signup → top_up → place_bid → accept_bid.

---

## MON-006 — Admin audit log

Append-only Mongo `admin_audit_log` for KYC / listing document reviews:

| Action | Source |
|--------|--------|
| `listing_doc_approve` / `listing_doc_reject` | `POST /api/admin/verification/review` |
| `kyc_aadhar_verify` / `kyc_aadhar_unverify` | `POST /api/admin/users/review-kyc` |
| `kyc_pan_verify` / `kyc_pan_unverify` | same |

Each row records `actorUserId`, target ids, IP, and `requestId`.

Admin read: `GET /api/admin/audit?targetUserId=&listingId=&limit=`

---

## Files

| File | Role |
|------|------|
| `server/logger.ts` | Pino + request middleware |
| `server/productEvents.ts` | Funnel events |
| `server/adminAudit.ts` | KYC/admin trail |
| `server/index.ts` | Wiring + alert hooks + admin GETs |
| `server/routes/v1/users.ts` | `top_up` tracking |

---

## Verify

```bash
npm run test:mon002
```

Manual:

1. Hit any API → response has `X-Request-Id`; server logs JSON / pretty lines.
2. UptimeRobot against `/api/health`.
3. Register / top-up / bid → `GET /api/admin/product-events` (admin session).
4. Approve KYC → `GET /api/admin/audit`.
