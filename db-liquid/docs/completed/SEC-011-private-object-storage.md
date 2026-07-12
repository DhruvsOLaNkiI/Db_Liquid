# SEC-011 — Private Object Storage for KYC/Docs (Completed)

**Tracker ID:** SEC-011  
**Priority:** P1  
**Status:** Done  
**Completed:** 2026-07-10  
**Parent checklist:** [PRODUCTION_READINESS.md](../../PRODUCTION_READINESS.md)

---

## What this item required

> **Move KYC/docs to private object storage.** S3/R2 + signed URLs; not base64 in MongoDB.

**Acceptance criteria met:**

- KYC documents, property photos, and profile images upload to private storage (local disk in dev, R2/S3 in prod)
- Allowed types: JPG, PNG, WEBP, PDF, Word (`.doc` / `.docx`)
- MongoDB stores `storageKey` only (no large base64 for new uploads)
- Listings attach short-lived signed URLs for photos (all viewers) and KYC docs (seller/admin)
- Public/non-seller listing responses strip KYC `storageKey`

---

## How it works

```
1. Seller selects KYC file in List Your Property
2. Client POST /api/v1/uploads (auth + CSRF) with base64 payload once
3. Server writes to data/private-uploads/ OR S3/R2 → returns storageKey + signed URL
4. Listing save stores { storageKey, fileName, mimeType, … } with empty dataUrl
5. GET listings / admin queue attaches fresh signed URLs for seller/admin only
6. Local driver: GET /api/v1/files?key=&expires=&sig=  (HMAC)
   S3/R2: AWS/R2 presigned GET URLs
```

---

## Key files

| File | Role |
|------|------|
| `server/objectStorage.ts` | Local + S3/R2 put/get + signed URLs |
| `server/routes/v1/uploads.ts` | Upload + local signed serve + attachSignedUrlsToDocs |
| `src/utils/fileUpload.ts` | Client `uploadPrivateFile` |
| `src/components/listing/SellerVerificationStep.tsx` | Uploads on file pick |
| `server/listingUpdates.ts` | `stripVerificationPayloads` before Mongo save |
| `server/sanitize.ts` | Redacts docs for non-sellers |

---

## Env (optional S3/R2)

```
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=   # R2 endpoint; omit for AWS
S3_REGION=auto
```

Without these, files land in `data/private-uploads/` (gitignored).

---

## Verify

```bash
npm run test:sec011
```

Or manually: upload a KYC doc while listing a property, confirm Mongo has `storageKey` and empty `dataUrl`, and admin verification queue can open the image via signed URL.
