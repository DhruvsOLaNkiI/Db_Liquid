# BID-007 — Bid Idempotency Keys (Completed)

**Tracker ID:** BID-007  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-12  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this required

Prevent double-submit from creating two bids / charging two credits.

| Rule | Behavior |
|------|----------|
| Request must include `idempotencyKey` (UUID) | Validated by Zod |
| Same user + same key + same listing + same amount | Return original bid (`idempotent: true`), no second credit spend |
| Same key + different amount | `409` |
| Same key + different listing | `409` |
| New key | Creates a new bid normally |

---

## Client behavior

`PropertyBidPage` keeps one pending key per submit attempt and reuses it on retry until success, then clears it.

---

## Request

```json
{
  "bidTotal": 112000,
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Files

| File | Change |
|------|--------|
| `server/bids.ts` | Idempotent lookup + store key on bid |
| `server/schemas.ts` | Require `idempotencyKey` |
| `src/pages/PropertyBidPage.tsx` | Reuse key until success |
| `src/utils/sharedStore.ts` | Send key |
| `scripts/test-bid007.mjs` | Regression test |

---

## Verify

```bash
npm run test:bid007
```
