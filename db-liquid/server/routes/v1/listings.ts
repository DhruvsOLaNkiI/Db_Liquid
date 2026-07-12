import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../authMiddleware';
import { saveListings, updateListings } from '../../mongoStore';
import {
  applyAdminListingsMerge,
  applyListingsSync,
  ListingUpdateError,
  stripVerificationPayloads,
} from '../../listingUpdates';

export async function putListingsSync(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await updateListings(async (existing) => {
      const merged = applyListingsSync(req.auth!.userId, existing as never[], req.body);
      const stripped = stripVerificationPayloads(merged as never[]);
      await saveListings(stripped);
      return stripped.length;
    });
    res.json({ ok: true, count });
  } catch (error) {
    if (error instanceof ListingUpdateError) {
      res.status(403).json({ error: error.message });
      return;
    }
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export async function putAdminListings(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await updateListings(async (existing) => {
      const merged = applyAdminListingsMerge(existing as never[], req.body);
      const stripped = stripVerificationPayloads(merged as never[]);
      await saveListings(stripped);
      return stripped.length;
    });
    res.json({ ok: true, count });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export function deprecatedBulkListingsPut(_req: AuthenticatedRequest, res: Response) {
  res.status(403).json({
    error: 'Bulk listing writes are not allowed on this endpoint.',
    deprecated: true,
    use: {
      sync: 'PUT /api/v1/listings/sync',
      admin: 'PUT /api/v1/admin/listings',
    },
  });
}
