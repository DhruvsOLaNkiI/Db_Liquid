# RT-001 through RT-004 — Real-time / Redis (Deferred)

**Tracker IDs:** RT-001, RT-002, RT-003, RT-004 (also PERF-007)  
**Status:** Deferred (`[—]`)  
**Deferred:** 2026-07-14  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Decision

No Redis for the current launch. Live push (WebSockets/SSE) and multi-server pub/sub are deferred.

| Keep for now | Later (when reopening RT-*) |
|--------------|-----------------------------|
| 30s listing poll on non-auth pages | RT-001 — SSE or WebSockets on one API |
| Single Hostinger / one Node process | RT-002 — Redis (or equivalent) only if 2+ API instances |
| Server bid APIs already correct without live UI | RT-003 — anti-snipe / bid extension |
| | RT-004 — Live / reconnecting indicator |
| | PERF-007 — Redis cache for hot listings |

---

## Why not required now

- Bidding rules and credits are already server-enforced (BID-001–012).
- One API process can fan out SSE later without Redis.
- Redis is only needed to sync pushes across multiple API servers.
