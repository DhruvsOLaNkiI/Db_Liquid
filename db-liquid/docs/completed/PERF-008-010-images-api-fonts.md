# PERF-008 / PERF-009 / PERF-010 — Images, API cache, fonts

**Status:** Done  
**Completed:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## PERF-008 — Image optimization

| Piece | Detail |
|-------|--------|
| Upload | Property / profile photos resized (max edge 1600px) and encoded as **WebP** in the browser before upload |
| Display | `OptimizedImage` + `loading="lazy"` / `sizes` on browse cards and gallery |
| LCP | Hero / first slider frame uses `loading="eager"` + `fetchPriority="high"` |

Files: `src/utils/optimizeImage.ts`, `src/utils/fileUpload.ts`, `src/components/OptimizedImage.tsx`.

---

## PERF-009 — API cache strategy

All `/api/*` responses (except signed file downloads, which keep a short **private** TTL) send:

```http
Cache-Control: private, no-store
Pragma: no-cache
```

So CDNs / shared proxies must not cache bids, auth, or listing payloads.

File: `server/apiCache.ts`.

---

## PERF-010 — Self-hosted fonts

Removed Google Fonts stylesheet from `index.html`.

Bundled via `@fontsource/inter` + `@fontsource/space-grotesk` in `src/main.tsx`.

CSP no longer allows `fonts.googleapis.com` / `fonts.gstatic.com`.

---

## Verify

```bash
npm run test:perf008
```
