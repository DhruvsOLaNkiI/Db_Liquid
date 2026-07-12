# DB Liquid — Production Readiness Tracker

> Living checklist for security, bidding infrastructure, CDN/cache, rate limits, and launch requirements.  
> Use this file to track what is **done**, **in progress**, or **not started**. A monitoring app can parse checkbox states and section IDs from this document.

**Last audited:** 2026-07-09  
**Last updated:** 2026-07-09  
**Codebase:** `db-liquid/`  
**Related platforms (separate repos):** DB Asset, DB Expo

---

## Current launch scope

**In scope for this release:** security, server-side bidding, rate limits, CDN/cache basics, live auction UX.  
**Out of scope (deferred):** real payments, email/SMS/push notifications.

| Deferred | Item IDs | Notes |
|----------|----------|-------|
| **Payments** | BID-011, LEGAL-003, LEGAL-006 | Keep simulated credits / admin top-up for now |
| **Notifications** | AUTH-003, AUTH-004, AUTH-007 | No email verify, reset password, or phone OTP yet |
| **Payment alerts** | MON-004 (payment part only) | Bid errors + DB down alerts still planned in Phase 2 |

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
| BID-006 | P1 | [ ] | Server authoritative timestamps | `createdAt` from server clock |
| BID-007 | P1 | [ ] | Idempotency keys for bids | Prevent double-submit |
| BID-008 | P1 | [ ] | Immutable bid audit log | Who, when, amount, IP for disputes |
| BID-009 | P1 | [ ] | Auto-close expired auctions | Cron/job when `biddingEndsAt` passes |
| BID-010 | P1 | [ ] | Block seller bidding on own listing | Server enforced |
| BID-011 | P1 | [—] | Real payment gateway (Razorpay/PayU) | **Deferred** — keep simulated credits / admin top-up |
| BID-012 | P2 | [ ] | Credit refund policy | Declined bid / cancelled auction behavior documented + coded |

---

## 4. Real-time & live auctions

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| RT-001 | P1 | [ ] | WebSockets or SSE for bid updates | Replace 30s polling on bid pages |
| RT-002 | P1 | [ ] | Redis pub/sub (or equivalent) | Broadcast bids to all viewers on a listing |
| RT-003 | P2 | [ ] | Anti-sniping / bid extension | Extend `biddingEndsAt` if bid in last N minutes |
| RT-004 | P2 | [ ] | Connection status UI | Live / reconnecting indicator |

---

## 5. Rate limiting & abuse prevention

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| RL-001 | P0 | [ ] | API rate limiting | express-rate-limit or edge WAF |
| RL-002 | P1 | [ ] | Per-route limits | Login 5/min, bid 10/min, signup 3/hr per IP |
| RL-003 | P1 | [ ] | CDN/WAF (Cloudflare etc.) | DDoS, bot protection in front of app |
| RL-004 | P1 | [ ] | CAPTCHA on signup/login | Turnstile or reCAPTCHA |
| RL-005 | P2 | [ ] | IP logging on bids | Fraud investigation support |

---

## 6. CDN, cache & performance

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| PERF-001 | P1 | [ ] | CDN for static assets (`dist/`) | Hashed JS/CSS long cache |
| PERF-002 | P1 | [ ] | CDN for property images | Cloudinary / S3 + CloudFront |
| PERF-003 | P1 | [ ] | Cache-Control headers | `index.html` no-cache; assets immutable |
| PERF-004 | P1 | [ ] | Split MongoDB data model | Per-user, per-listing collections (not one big array) |
| PERF-005 | P1 | [ ] | MongoDB indexes | `email`, `listingId`, `sellerId`, `biddingEndsAt` |
| PERF-006 | P2 | [ ] | Pagination on `GET /api/listings` | `?page=&limit=` |
| PERF-007 | P2 | [ ] | Redis cache for hot listings | Active auction pages |
| PERF-008 | P2 | [ ] | Image optimization | WebP, lazy load, responsive sizes |
| PERF-009 | P2 | [ ] | API cache strategy | No public cache on bid-sensitive endpoints |
| PERF-010 | P3 | [ ] | Self-host or optimize fonts | Reduce third-party dependency |

---

## 7. Infrastructure & deployment

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| INFRA-001 | P0 | [ ] | HTTPS everywhere | TLS + redirect HTTP |
| INFRA-002 | P0 | [ ] | Secrets in env only | No keys in client bundle |
| INFRA-003 | P1 | [ ] | CORS allowlist | Production origins only |
| INFRA-004 | P1 | [ ] | Separate API + frontend domains | Optional but recommended |
| INFRA-005 | P1 | [ ] | Staging environment | Test bids before production |
| INFRA-006 | P2 | [ ] | Graceful shutdown | SIGTERM handling |
| INFRA-007 | P2 | [ ] | MongoDB backups | Atlas PITR enabled |
| INFRA-008 | P2 | [ ] | Health check without sensitive data | For uptime monitors |

---

## 8. Monitoring & reliability

| ID | Pri | Status | Item | Notes / acceptance criteria |
|----|-----|--------|------|------------------------------|
| MON-001 | P1 | [ ] | Error tracking (Sentry) | Frontend + backend |
| MON-002 | P1 | [ ] | Structured logging | Request IDs, Pino/Winston |
| MON-003 | P1 | [ ] | Uptime monitoring | `/api/health` external ping |
| MON-004 | P2 | [ ] | Alerts | Bid errors, DB down (**payment alerts deferred**) |
| MON-005 | P2 | [ ] | Product analytics funnel | Signup → top-up → bid → accept |
| MON-006 | P2 | [ ] | Admin audit log | KYC approve/reject trail |

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

_Skips: AUTH-003, AUTH-004, AUTH-007, BID-011, LEGAL-003, LEGAL-006_

1. BID-006 → BID-010 (not BID-011)  
2. RT-001, RT-002 (or faster polling if WebSockets deferred)  
3. RL-002 → RL-004  
4. PERF-001 → PERF-005  
5. AUTH-005, AUTH-006 (not AUTH-003, AUTH-004, AUTH-007)  
6. MON-001 → MON-003  
7. LEGAL-001, LEGAL-002 (not LEGAL-003)  

### Phase 3 — P2+ (scale & ecosystem)

1. Remaining active PERF, MON, LEGAL items  
2. ECO-001 → ECO-004  
3. RT-003, RT-004  

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

**Deferred item IDs:** `AUTH-003`, `AUTH-004`, `AUTH-007`, `BID-011`, `LEGAL-003`, `LEGAL-006`

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

---

## References

- Server API: `server/index.ts`
- Auth client: `src/context/AuthContext.tsx`, `src/data/usersTable.ts`
- Bidding client: `src/context/ListingsContext.tsx`
- Data layer: `server/mongoStore.ts`, `src/utils/sharedStore.ts`
- Sanitization: `server/sanitize.ts`
- Deployment: `nixpacks.toml`, `.env.example`
