# INFRA-001 → INFRA-008 — Deployment infrastructure

**Status:** Done  
**Completed:** 2026-07-15  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## INFRA-001 — HTTPS everywhere

| Layer | What to do |
|-------|------------|
| Cloudflare | Always Use HTTPS + SSL **Full (strict)** (see RL-003) |
| App | `forceHttps` middleware redirects when `X-Forwarded-Proto` is `http` |
| Cookies / HSTS | Already `secure` + HSTS in production |

Env: auto-on in `NODE_ENV=production`, or set `FORCE_HTTPS=true`. Disable with `FORCE_HTTPS=false`.

---

## INFRA-002 — Secrets in env only

- Secrets live in Hostinger / `.env` (gitignored)
- Client `src/` has **no** `VITE_` secrets or Mongo/JWT literals
- Scan: `npm run test:infra002`

Required prod secrets: `MONGODB_URI_ATLAS`, `JWT_SECRET`.

---

## INFRA-003 — CORS allowlist

`server/cors.ts` allowlists:

- `APP_URL`
- `CORS_ORIGINS` (comma-separated)
- Localhost origins when not production

Credentials + CSRF header allowed. Unknown browser origins → **403**.

---

## INFRA-004 — Separate API + frontend domains (optional)

**Current launch:** same origin (Express serves `dist/` + `/api`) — simplest on Hostinger.

**If you split later:**

| Frontend | API |
|----------|-----|
| `https://www.example.com` | `https://api.example.com` |

Set `APP_URL` to the frontend origin and `CORS_ORIGINS` accordingly. Cookie `SameSite=lax` works for same-site subdomains; cross-site needs more cookie care.

---

## INFRA-005 — Staging environment

Recommended:

| Item | Staging | Production |
|------|---------|------------|
| Hostinger app / URL | `staging.example.com` | `example.com` |
| `MONGODB_DB` | `db_liquid_staging` | `db_liquid` |
| `APP_URL` | staging URL | prod URL |
| `JWT_SECRET` | different from prod | unique |
| Cloudflare | separate DNS or same zone, different hostname |

Test bids / KYC on staging before promoting the same build to prod.

---

## INFRA-006 — Graceful shutdown

On `SIGTERM` / `SIGINT`:

1. Stop auction closer interval  
2. `server.close()` (stop new connections)  
3. `closeMongo()`  

Needed for clean Nixpacks / Hostinger restarts.

---

## INFRA-007 — MongoDB backups

Ops (Atlas dashboard — not code):

1. Cluster → Backup  
2. Enable **Cloud Backup** / continuous backup  
3. Prefer **Point-in-Time Restore (PITR)** on M10+ (or scheduled snapshots on shared tiers)  
4. Test a restore to a scratch DB once per quarter  

---

## INFRA-008 — Health check (no sensitive data)

Already completed as **SEC-012**:

```http
GET /api/health → { "ok": true } | 503 { "ok": false }
```

No Mongo URI, DB name, or connection details in the response. Safe for uptime monitors (MON-003).

---

## Verify

```bash
npm run test:infra001
npm run test:infra002
```
