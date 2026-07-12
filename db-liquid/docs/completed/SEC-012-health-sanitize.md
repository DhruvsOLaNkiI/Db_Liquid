# SEC-012 — Sanitize `/api/health` (Completed)

**Tracker ID:** SEC-012  
**Priority:** P2  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Sanitize `/api/health` response.** Do not expose DB URI/details publicly.

**Acceptance criteria met:**

- Public `GET /api/health` returns only `{ ok: true }` or `{ ok: false }` (503)
- No MongoDB URI (even redacted), database name, storage driver, or error messages with connection details
- `getMongoInfo()` remains for **server console** startup logs only

---

## Before → after

```json
// Before (leaked infra)
{ "ok": true, "storage": "mongodb", "uri": "mongodb+srv://***:***@cluster0....", "db": "db_liquid" }

// After
{ "ok": true }
```

---

## Verify

```bash
npm run test:sec012
# or
curl -s http://localhost:3001/api/health
```

---

## Files

| File | Change |
|------|--------|
| `server/index.ts` | Health handler returns `{ ok }` only |
| `scripts/test-sec012.mjs` | Regression test |
| `package.json` | `test:sec012` |
