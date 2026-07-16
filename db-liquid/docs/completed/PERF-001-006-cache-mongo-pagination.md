# PERF-001 → PERF-006 — CDN, cache, Mongo split, indexes, pagination

**Status:** Done  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## PERF-001 — CDN for static assets (`dist/`)

With **one Hostinger server**, Cloudflare (RL-003) sits in front and caches hashed Vite assets after the first origin fetch.

App emits long-cache headers for `/assets/*` so the CDN/browser can keep them.

| Cloudflare (ops) | App |
|------------------|-----|
| Orange-cloud DNS | `server/staticCache.ts` |
| Cache `/assets/*` | `Cache-Control: public, max-age=31536000, immutable` |
| Bypass `/api/*` | Listing APIs send `private, no-store` |

---

## PERF-002 — CDN for property images

Property photos stay on **private** object storage (SEC-011: local / S3 / R2) with signed URLs.

CDN path for production:

1. Put media on **Cloudflare R2** (or S3)
2. Optional **custom domain** on the bucket (Cloudflare CDN)
3. Set `IMAGE_CDN_ORIGINS` so CSP allows those hosts
4. Local signed file responses use `Cache-Control: private, max-age=900` (matches signed TTL)

Not required: a second app server.

---

## PERF-003 — Cache-Control headers

| Resource | Header |
|----------|--------|
| `index.html` (SPA shell) | `no-cache, no-store, must-revalidate` |
| `/assets/*` hashed JS/CSS | `public, max-age=31536000, immutable` |
| Other static files | `public, max-age=3600` |
| Listing/bid APIs | `private, no-store` |

---

## PERF-004 — Split MongoDB data model

Replaced `app_state` array docs with:

| Collection | Shape |
|------------|--------|
| `users` | One document per user (`id`) |
| `listings` | One document per listing (`id`) |

On startup, data is migrated from legacy `app_state` / JSON if the new collections are empty. `getUsers` / `saveUsers` / `getListings` / `saveListings` keep working for existing call sites.

---

## PERF-005 — MongoDB indexes

| Collection | Indexes |
|------------|---------|
| `users` | `{ id: 1 }` unique, `{ email: 1 }` sparse |
| `listings` | `{ id: 1 }` unique, `{ sellerId: 1 }`, `{ biddingEndsAt: 1 }`, `{ publishedAt: -1 }` |

Login uses `findUserByEmail`; listing detail uses `getListingById`.

---

## PERF-006 — Pagination on `GET /api/listings`

```http
GET /api/listings?page=1&limit=20
```

```json
{
  "listings": [ ... ],
  "page": 1,
  "limit": 20,
  "total": 42,
  "totalPages": 3
}
```

Without `page`/`limit`, response remains a **full array** (backward compatible for the 30s poller). Client helper: `fetchListingsPage()` in `sharedStore.ts`.

---

## Verify

```bash
npm run test:perf001
```

Restart the API after deploy so migration + indexes run once.
