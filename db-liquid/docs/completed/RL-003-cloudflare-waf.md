# RL-003 — CDN / WAF via Cloudflare (Completed)

**Tracker ID:** RL-003  
**Priority:** P1  
**Status:** Done (app ready + setup guide)  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Put **Cloudflare in front of the Hostinger app** for CDN caching of static assets, WAF/bot filtering, and DDoS absorption. This is mostly DNS/dashboard configuration — not a new Express route.

App code still helps:

| Change | Purpose |
|--------|---------|
| Prefer `CF-Connecting-IP` | Correct IP for RL-001 / RL-002 / AUTH-005 behind Cloudflare |
| Optional `REQUIRE_CLOUDFLARE=true` | Reject requests missing `CF-Ray` (blocks casual direct-origin hits) |
| Existing `trust proxy` | Express understands reverse-proxy hops |

---

## Cloudflare setup (do this on the live domain)

1. **Add site** in Cloudflare → use Cloudflare nameservers at your domain registrar.
2. **DNS**
   - `A` / `CNAME` for the app hostname → Hostinger
   - Proxy status: **Proxied** (orange cloud)
3. **SSL/TLS**
   - Mode: **Full (strict)** once Hostinger has a valid cert, or **Full** while testing
   - Enable **Always Use HTTPS**
4. **Security**
   - Security level: Medium (or higher under attack)
   - Enable **Bot Fight Mode** / Super Bot Fight (plan dependent)
   - WAF → managed ruleset (Cloudflare Free has basic protections; Pro+ has more)
5. **Caching** (CDN for static)
   - Cache Level: Standard
   - Create a Cache Rule: cache `*.js` / `*.css` / hashed `/assets/*` from `dist/`
   - Bypass cache for `/api/*` (bids must stay dynamic)
6. **Origin locking** (recommended)
   - Hostinger firewall / allowlist: only [Cloudflare IP ranges](https://www.cloudflare.com/ips/)
   - Then set `REQUIRE_CLOUDFLARE=true` in production `.env`

---

## App env

```bash
# After Cloudflare orange-cloud is live:
REQUIRE_CLOUDFLARE=true
```

Local `npm run dev` leaves this unset so localhost works without Cloudflare.

---

## Files

| File | Change |
|------|--------|
| `server/cloudflare.ts` | `getClientIp` + optional `requireCloudflareProxy` |
| `server/loginProtection.ts` | Re-exports Cloudflare-aware IP helper |
| `server/rateLimit.ts` | Uses Cloudflare-aware IP for keys |
| `server/index.ts` | Mounts optional Cloudflare gate |
| `scripts/test-rl003.mjs` | Regression for IP + gate |

---

## Verify

```bash
npm run test:rl003
```

After go-live: open the site → DevTools Network → response headers should include `cf-ray` / `cf-cache-status`.
