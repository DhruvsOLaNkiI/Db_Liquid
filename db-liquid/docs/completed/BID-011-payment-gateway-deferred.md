# BID-011 — Real Payment Gateway (Deferred)

**Tracker ID:** BID-011  
**Priority:** P1  
**Status:** Deferred (`[—]`)  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## Decision

Real payment gateway integration (Razorpay/PayU) is **deferred** for the current launch.

| Keep for now | Later (when BID-011 is opened) |
|--------------|--------------------------------|
| Simulated buyer credits | Live card/UPI checkout |
| Admin / self top-up via API | GST invoices + receipts (LEGAL-003 / LEGAL-006) |
| Server credit spend + refunds (BID-012) | Gateway capture / refund APIs |

No Razorpay/PayU SDK or merchant keys are required for the current bidding path.
