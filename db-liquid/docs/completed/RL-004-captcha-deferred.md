# RL-004 — CAPTCHA on Signup/Login (Deferred)

**Tracker ID:** RL-004  
**Priority:** P1  
**Status:** Deferred (`[—]`)  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Decision

Turnstile / reCAPTCHA on signup and login is **not required** for the current launch.

Abuse control for auth is covered by:

| Control | Tracker |
|---------|---------|
| Global + per-route rate limits | RL-001, RL-002 |
| Login lockout (email + IP) | AUTH-005 |
| CDN / WAF / bot protection (Cloudflare) | RL-003 |

Revisit CAPTCHA later if signup spam or credential stuffing still appears after Cloudflare + rate limits are live.
