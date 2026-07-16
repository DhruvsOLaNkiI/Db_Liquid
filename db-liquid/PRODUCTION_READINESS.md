# DB Liquid — Production Readiness Tracker

> Living checklist for security, bidding infrastructure, CDN/cache, rate limits, and launch requirements.  
> Use this file to track what is **done**, **in progress**, or **not started**. A monitoring app can parse checkbox states and section IDs from this document.

**Last audited:** 2026-07-09  
**Last updated:** 2026-07-09  
**Codebase:** `db-liquid/`  
**Related platforms (separate repos):** DB Asset, DB Expo

---

## Current launch scope

**In scope for this release:** security, server-side bidding, rate limits, CDN/cache basics.  
**Out of scope (deferred):** real payments, email/SMS/push notifications, Redis / WebSocket live push, CAPTCHA on auth.

| Deferred | Item IDs | Notes |
|----------|----------|-------|
| **Payments** | BID-011, LEGAL-003, LEGAL-006 | Keep simulated credits / admin top-up for now |
| **Notifications** | AUTH-003, AUTH-004, AUTH-007 | No email verify, reset password, or phone OTP yet |
| **Payment alerts** | MON-004 (payment part only) | Bid errors + DB down alerts still planned in Phase 2 |
| **Redis / multi-server live** | RT-001, RT-002, RT-003, RT-004, PERF-007 | Single API + 30s polling for now — see [RT deferred note](docs/completed/RT-001-004-realtime-deferred.md) |
| **CAPTCHA** | RL-004 | Rate limits + Cloudflare WAF cover abuse for now — see [RL-004 deferred note](docs/completed/RL-004-captcha-deferred.md) |

Items marked `[—]` in tables below are **won't do for current launch** — revisit when payments/notifications are added.

---

## Timeline estimates

Estimates assume **full-time** work. Add ~40% calendar buffer for part-time or shared context.

### Full checklist (all 76 items, includes payments + notifications)

| Scope | Solo dev | 2 developers |
|-------|----------|--------------|
| Phase 1 only (P0 — safe online) | 4–6 weeks | 2–3 weeks |
| Phase 1 + 2 (live auctions + payments) | 10–14 weeks | 6–8 weeks |
| Everything (all phases) | 5–7 months | 3–4 months |

### Current launch scope (no payments, no notifications)

| Scope | Solo dev | 2 developers | Delivers |
|-------|----------|--------------|----------|
| **Path A — Closed beta** | 4–5 weeks | 2–3 weeks | Phase 1; invite-only; 30s polling OK |
| **Path B — Public bidding demo** | 7–9 weeks | 4–5 weeks | Phase 1 + bid rules + WebSockets; simulated credits |
| **Path C — Production (no pay/notify)** | 10–12 weeks | 6–7 weeks | Path B + DB split, CDN, monitoring, legal pages |
| **Full checklist minus deferred** | 3–4 months | 2–2.5 months | Scale + ecosystem SSO |

**Fastest realistic targets (current scope):**

- **~1 month** with 2 devs → safe closed beta (Path A)  
- **~2 months** with 2 devs → public bidding without real money (Path B)  
- Skip WebSockets (keep polling) → subtract **~1 week**

### Week-by-week — Path B (solo, recommended)

| Week | Focus |
|------|--------|
| 1–2 | Auth + password hash + protect routes |
| 3–4 | Server bid APIs + refactor `ListingsContext` |
| 5 | Bid validation (min increment, credits, seller rules) |
| 6 | WebSockets or 10s polling + rate limits |
| 7 | Admin lockdown, staging, bug fixes |
| 8 | Polish, ToS/privacy, soft launch |

### Active vs deferred item counts

| | Count |
|--|-------|
| Total items | 76 |
| **Active (in current launch)** | **69** |
| **Deferred** | **7** |

---

## How to use this document

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done |
| `[—]` | Won't do / N/A (add reason in Notes) |

**Priority:** `P0` = block launch · `P1` = before real users/auctions · `P2` = scale & polish · `P3` = ecosystem / nice-to-have

**Suggested monitoring app fields per item:**

- `id` — stable slug (e.g. `SEC-001`)
- `title` — short name
- `priority` — P0–P3
- `category` — Security, Bidding, etc.
- `status` — `not_started` \| `in_progress` \| `done` \| `wont_do`
- `launchScope` — `active` \| `deferred` \| `future`
- `owner` — assignee
- `notes` — blockers, PR links, dates

---

## Summary dashboard

| Category | Total | Active | Deferred | Done | In progress | Not started |
|----------|-------|--------|----------|------|-------------|-------------|
| Security | 12 | 12 | 0 | 10 | 0 | 2 |
| Authentication & sessions | 7 | 4 | 3 | 0 | 0 | 4 |
| Bidding platform | 12 | 11 | 1 | 0 | 0 | 11 |
| Real-time & live auctions | 4 | 4 | 0 | 0 | 0 | 4 |
| Rate limiting & abuse | 5 | 5 | 0 | 0 | 0 | 5 |
| CDN, cache & performance | 10 | 10 | 0 | 0 | 0 | 10 |
| Infrastructure & deployment | 8 | 8 | 0 | 0 | 0 | 8 |
| Monitoring & reliability | 6 | 6 | 0 | 0 | 0 | 6 |
| Legal, trust & compliance | 8 | 6 | 2 | 0 | 0 | 6 |
| Ecosystem (DB Asset / DB Expo) | 4 | 4 | 0 | 0 | 0 | 4 |
| **Total** | **76** | **69** | **7** | **10** | **0** | **59** |

_Update the Summary dashboard counts when items change status. "Not started" counts **active** items only._

---

## Current state (baseline)

What exists today in code:

| Area | Current implementation | Risk |
|------|------------------------|------|
| Auth | Email/password; session in `localStorage` | High — no server session |
| Passwords | Plaintext in MongoDB | Critical |
| API writes | `PUT /api/users`, `PUT /api/listings` — no auth | Critical |
| Bids | Client-side `placeBid` → full array PUT | Critical — bypassable |
| Admin | `/api/admin/*`, `/admin/verification` — public | Critical |
| Payments | Simulated delay (prototype) | High — no real money flow |
| Live updates | 30s polling | Medium — not real-time |
| Data model | All users/listings in two MongoDB `app_state` docs | Medium — won't scale |
| Images / KYC | Base64 in MongoDB | Medium — size & privacy |
| Rate limiting | None | High |
| CDN / cache headers | None configured | Medium |
| Cross-platform SSO | Marketing copy only | N/A until central auth |

**Key files to change:** `server/index.ts`, `server/mongoStore.ts`, `src/context/ListingsContext.tsx`, `src/data/usersTable.ts`, `src/utils/sharedStore.ts`, `src/context/AuthContext.tsx`

---

## Phase plan

| Phase | Goal | When | Est. (current scope) |
|-------|------|------|----------------------|
| **Phase 1** | Safe to expose to internet (security + server bids) | Before any real users | 4–5 weeks solo · 2–3 weeks (2 devs) |
| **Phase 2** | Live auction ready (real-time, bid rules — **no payments/notifications**) | Before first public bidding event | +3–4 weeks solo · +2 weeks (2 devs) |
| **Phase 3** | Scale & ecosystem (CDN, DB split, SSO, monitoring) | Growth & DB Asset/Expo integration | +2–3 months solo · +1.5–2 months (2 devs) |

**Future phase (not in current scope):** payments (Razorpay/PayU), email/SMS notifications, GST/invoices — add **~2–3 weeks** when needed.

---

## 1. Security

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| SEC-001 | P0 | [x] | Hash passwords (bcrypt/argon2) | Done — see [SEC-001 completion doc](docs/completed/SEC-001-password-hashing.md) |
| SEC-002 | P0 | [x] | Server-side auth middleware | Done — see [SEC-002 completion doc](docs/completed/SEC-002-server-auth.md) |
| SEC-003 | P0 | [x] | Protect `PUT /api/users` | Done — see [SEC-003 completion doc](docs/completed/SEC-003-protect-users-api.md) |
| SEC-004 | P0 | [x] | Protect `PUT /api/listings` | Remove full-array client writes for bids/actions |
| SEC-005 | P0 | [x] | Protect `/api/admin/*` | Require `admin` role; no public KYC queue |
| SEC-006 | P0 | [x] | Protect `/admin/verification` UI | Route guard + server auth |
| SEC-007 | P0 | [x] | Stop trusting `X-Viewer-User-Id` | Derive viewer from session/token only |
| SEC-008 | P1 | [x] | Security headers (helmet) | Done — see [SEC-008 completion doc](docs/completed/SEC-008-security-headers.md) |
| SEC-009 | P1 | [x] | Input validation (Zod/Joi) | Done — see [SEC-009 completion doc](docs/completed/SEC-009-input-validation.md) |
| SEC-010 | P1 | [x] | CSRF protection | Done — see [SEC-010 completion doc](docs/completed/SEC-010-csrf-protection.md) |
| SEC-011 | P1 | [x] | Move KYC/docs to private object storage | S3/R2 + signed URLs; photos, PDF, Word, profile images |
| SEC-012 | P2 | [x] | Sanitize `/api/health` response | Done — see [SEC-012 completion doc](docs/completed/SEC-012-health-sanitize.md) |

---

## 2. Authentication & sessions

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| AUTH-001 | P0 | [x] | Replace `localStorage` session | Done — see [AUTH-001 completion doc](docs/completed/AUTH-001-httponly-session.md) |
| AUTH-002 | P0 | [x] | Add `POST /api/auth/register` | Done with SEC-002 — server signup + cookie |
| AUTH-003 | P1 | [—] | Email verification | **Deferred** — no notifications in current launch |
| AUTH-004 | P1 | [—] | Forgot / reset password | **Deferred** — no email notifications in current launch |
| AUTH-005 | P1 | [x] | Login rate limit + lockout | Done — see [AUTH-005 completion doc](docs/completed/AUTH-005-login-rate-limit.md) |
| AUTH-006 | P1 | [x] | RBAC (`buyer`, `seller`, `admin`) | Done — dual member + admin; see [AUTH-006](docs/completed/AUTH-006-rbac.md) |
| AUTH-007 | P2 | [—] | Phone OTP before first bid | **Deferred** — no SMS in current launch |

---

## 3. Bidding platform

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| BID-001 | P0 | [x] | `POST /api/listings/:id/bids` | Done — see [BID-001-004 completion doc](docs/completed/BID-001-004-server-bids.md) |
| BID-002 | P0 | [x] | Server validates bid rules | Open auction, logged-in buyer, has credits |
| BID-003 | P0 | [x] | Enforce minimum bid increment | New bid must beat current highest (not just `> 0`) |
| BID-004 | P0 | [x] | Atomic bid + credit deduction | Server-side serialized critical section updates listing + credit together |
| BID-005 | P0 | [x] | `POST /api/listings/:id/accept-bid` | Done — see [BID-005 completion doc](docs/completed/BID-005-accept-bid.md) |
| BID-006 | P1 | [x] | Server authoritative timestamps | Done — see [BID-006 completion doc](docs/completed/BID-006-server-timestamps.md) |
| BID-007 | P1 | [x] | Idempotency keys for bids | Done — see [BID-007 completion doc](docs/completed/BID-007-idempotency.md) |
| BID-008 | P1 | [x] | Immutable bid audit log | Done — see [BID-008 completion doc](docs/completed/BID-008-bid-audit.md) |
| BID-009 | P1 | [x] | Auto-close expired auctions | Done — see [BID-009 completion doc](docs/completed/BID-009-auto-close.md) |
| BID-010 | P1 | [x] | Block seller bidding on own listing | Done — see [BID-010 completion doc](docs/completed/BID-010-own-listing-block.md) |
| BID-011 | P1 | [—] | Real payment gateway (Razorpay/PayU) | **Deferred** — see [BID-011 deferred note](docs/completed/BID-011-payment-gateway-deferred.md) |
| BID-012 | P2 | [x] | Credit refund policy | Done — see [BID-012 completion doc](docs/completed/BID-012-credit-refunds.md) |

---

## 4. Real-time & live auctions

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| RT-001 | P1 | [—] | WebSockets or SSE for bid updates | **Deferred** — keep 30s polling; no Redis stack for now |
| RT-002 | P1 | [—] | Redis pub/sub (or equivalent) | **Deferred** — single API process; Redis not needed |
| RT-003 | P2 | [—] | Anti-sniping / bid extension | **Deferred** — polish after live push exists |
| RT-004 | P2 | [—] | Connection status UI | **Deferred** — only useful with RT-001 |

See [RT-001–004 deferred note](docs/completed/RT-001-004-realtime-deferred.md).

---

## 5. Rate limiting & abuse prevention

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| RL-001 | P0 | [x] | API rate limiting | Done — see [RL-001 completion doc](docs/completed/RL-001-api-rate-limit.md) |
| RL-002 | P1 | [x] | Per-route limits | Done — see [RL-002 completion doc](docs/completed/RL-002-per-route-limits.md) |
| RL-003 | P1 | [x] | CDN/WAF (Cloudflare etc.) | Done — see [RL-003 setup guide](docs/completed/RL-003-cloudflare-waf.md) |
| RL-004 | P1 | [—] | CAPTCHA on signup/login | **Deferred** — see [RL-004 deferred note](docs/completed/RL-004-captcha-deferred.md) |
| RL-005 | P2 | [x] | IP logging on bids | Done — see [RL-005 completion doc](docs/completed/RL-005-bid-ip-logging.md); UI at `/admin/verification` → Bid IP audit |

---

## 6. CDN, cache & performance

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| PERF-001 | P1 | [x] | CDN for static assets (`dist/`) | Done — Cache-Control + Cloudflare (see [PERF-001–006](docs/completed/PERF-001-006-cache-mongo-pagination.md)) |
| PERF-002 | P1 | [x] | CDN for property images | Done — R2/S3 + `IMAGE_CDN_ORIGINS` CSP (same doc) |
| PERF-003 | P1 | [x] | Cache-Control headers | Done — `index.html` no-cache; `/assets/*` immutable |
| PERF-004 | P1 | [x] | Split MongoDB data model | Done — `users` / `listings` collections |
| PERF-005 | P1 | [x] | MongoDB indexes | Done — email, id, sellerId, biddingEndsAt, publishedAt |
| PERF-006 | P2 | [x] | Pagination on `GET /api/listings` | Done — `?page=&limit=` envelope |
| PERF-007 | P2 | [—] | Redis cache for hot listings | **Deferred** — no Redis in current launch |
| PERF-008 | P2 | [x] | Image optimization | Done — see [PERF-008–010](docs/completed/PERF-008-010-images-api-fonts.md) |
| PERF-009 | P2 | [x] | API cache strategy | Done — `/api` `private, no-store` (bid-safe) |
| PERF-010 | P3 | [x] | Self-host or optimize fonts | Done — `@fontsource` Inter + Space Grotesk |

---

## 7. Infrastructure & deployment

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| INFRA-001 | P0 | [x] | HTTPS everywhere | Done — see [INFRA-001–008](docs/completed/INFRA-001-008-deployment.md) |
| INFRA-002 | P0 | [x] | Secrets in env only | Done — client scan `test:infra002`; secrets server-only |
| INFRA-003 | P1 | [x] | CORS allowlist | Done — `APP_URL` / `CORS_ORIGINS` |
| INFRA-004 | P1 | [x] | Separate API + frontend domains | Done — optional; same-origin default + CORS-ready |
| INFRA-005 | P1 | [x] | Staging environment | Done — staging runbook in INFRA doc |
| INFRA-006 | P2 | [x] | Graceful shutdown | Done — SIGTERM closes HTTP + Mongo |
| INFRA-007 | P2 | [x] | MongoDB backups | Done — Atlas PITR ops checklist in INFRA doc |
| INFRA-008 | P2 | [x] | Health check without sensitive data | Done — same as SEC-012 `{ ok: true\|false }` |

---

## 8. Monitoring & reliability

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| MON-001 | P1 | [x] | Error tracking (Sentry) | Done — see [MON-001](docs/completed/MON-001-sentry.md) |
| MON-002 | P1 | [x] | Structured logging | Done — Pino + `X-Request-Id` — [MON-002–006](docs/completed/MON-002-006-monitoring.md) |
| MON-003 | P1 | [x] | Uptime monitoring | Done — `/api/health` + UptimeRobot ops note |
| MON-004 | P2 | [x] | Alerts | Done — bid/DB via Sentry + uptime (**payment alerts deferred**) |
| MON-005 | P2 | [x] | Product analytics funnel | Done — `product_events` signup→top-up→bid→accept |
| MON-006 | P2 | [x] | Admin audit log | Done — `admin_audit_log` KYC / doc review trail |

---
  

## 9. Legal, trust & compliance (India)

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| LEGAL-001 | P1 | [ ] | Terms of Service + bidding rules | Binding vs non-binding, disputes |
| LEGAL-002 | P1 | [ ] | Privacy policy (DPDP) | KYC data handling |
| LEGAL-003 | P1 | [—] | Payment compliance | **Deferred** — GST/invoices when payments added |
| LEGAL-004 | P2 | [ ] | RERA / state regulations | If applicable to listed properties |
| LEGAL-005 | P2 | [ ] | Real KYC API integration | Beyond manual admin review |
| LEGAL-006 | P2 | [—] | Token payment receipts | **Deferred** — when real payment gateway added |
| LEGAL-007 | P2 | [ ] | Dispute resolution workflow | Seller decline, refunds |
| LEGAL-008 | P3 | [ ] | Cookie consent | If analytics/tracking added |

---

## 10. Ecosystem — DB Asset & DB Expo (other repos)

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| ECO-001 | P2 | [ ] | Central auth service design | Shared user store or OAuth provider |
| ECO-002 | P2 | [ ] | Shared user ID across platforms | Not per-app `randomId()` |
| ECO-003 | P2 | [ ] | DB Liquid integrates central auth | Replace local-only login |
| ECO-004 | P3 | [ ] | Platform-specific profile completion | Prompt missing Liquid KYC if user from Expo |

---

## Implementation order (recommended)

### Phase 1 — P0 (block launch) · ~4–5 weeks solo

1. SEC-001 → SEC-007  
2. AUTH-001, AUTH-002  
3. BID-001 → BID-005  
4. RL-001  
5. INFRA-001, INFRA-002  

### Phase 2 — P1 (live auctions, current scope) · +3–4 weeks solo

_Skips: AUTH-003, AUTH-004, AUTH-007, BID-011, LEGAL-003, LEGAL-006, RL-004_

1. BID-006 → BID-010 (not BID-011)  
2. ~~RT-001, RT-002~~ **Deferred** (no Redis / keep polling)  
3. RL-002 → RL-003 (not RL-004)  
4. PERF-001 → PERF-005  
5. AUTH-005, AUTH-006 (not AUTH-003, AUTH-004, AUTH-007)  
6. MON-001 → MON-003  
7. LEGAL-001, LEGAL-002 (not LEGAL-003)  

### Phase 3 — P2+ (scale & ecosystem)

1. Remaining active PERF, MON, LEGAL items  
2. ECO-001 → ECO-004  
3. ~~RT-003, RT-004~~ deferred with RT-001/002 until live push is needed

### Future phase — payments & notifications (when needed) · +2–3 weeks

1. BID-011 — Razorpay/PayU (credits + token)  
2. AUTH-003, AUTH-004 — email verify + password reset  
3. AUTH-007 — phone OTP (optional)  
4. LEGAL-003, LEGAL-006 — GST, invoices, receipts  
5. MON-004 — payment failure alerts  

---

## Machine-readable export (optional)

For a monitoring app, each row can be exported as JSON:

```json
{
  "id": "SEC-001",
  "title": "Hash passwords (bcrypt/argon2)",
  "priority": "P0",
  "category": "Security",
  "status": "done",
  "launchScope": "active",
  "phase": 1,
  "estimateWeeksSolo": null,
  "owner": null,
  "notes": "bcrypt 12 rounds; server/password.ts; migrate on login",
  "completedAt": "2026-07-09"
}
```

**`launchScope` values:** `active` | `deferred` | `future`

**Deferred item IDs:** `AUTH-003`, `AUTH-004`, `AUTH-007`, `BID-011`, `LEGAL-003`, `LEGAL-006`, `RT-001`, `RT-002`, `RT-003`, `RT-004`, `PERF-007`

**Status mapping from checkbox:**

- `[ ]` → `not_started`
- `[~]` → `in_progress`
- `[x]` → `done`
- `[—]` → `wont_do`

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-07-09 | — | Initial audit from codebase review |
| 2026-07-10 | — | SEC-010 CSRF double-submit cookie protection completed |
| 2026-07-14 | — | RT-001–004 + PERF-007 deferred (no Redis; keep polling) |
| 2026-07-14 | — | RL-001 global `/api` rate limiting with express-rate-limit |
| 2026-07-14 | — | RL-002 per-route limits (login / signup / bid) |
| 2026-07-14 | — | RL-003 Cloudflare CDN/WAF readiness + setup guide |
| 2026-07-14 | — | RL-004 CAPTCHA deferred (rate limits + Cloudflare cover abuse) |
| 2026-07-14 | — | RL-005 bid IP audit (admin UI + ip filter) |
| 2026-07-14 | — | PERF-001–006 CDN headers, Mongo split, indexes, listings pagination |
| 2026-07-14 | — | PERF-008–010 WebP/lazy images, API no-store, self-hosted fonts |
| 2026-07-15 | — | INFRA-001–008 HTTPS, secrets, CORS, staging note, shutdown, backups, health |
| 2026-07-15 | — | MON-001 Sentry error monitoring (React + Express) |
| 2026-07-15 | — | MON-002–006 structured logs, uptime, alerts, funnel, admin audit |

---

## References

- Server API: `server/index.ts`
- Auth client: `src/context/AuthContext.tsx`, `src/data/usersTable.ts`
- Bidding client: `src/context/ListingsContext.tsx`
- Data layer: `server/mongoStore.ts`, `src/utils/sharedStore.ts`
- Sanitization: `server/sanitize.ts`
- Deployment: `nixpacks.toml`, `.env.example`
