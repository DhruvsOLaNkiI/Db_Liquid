import type { Response } from 'express';
import type { AuthenticatedRequest } from '../authMiddleware';
import { getListings, saveListings } from '../mongoStore';
import {
  applyAdminListingsMerge,
  applyListingsSync,
  ListingUpdateError,
} from '../listingUpdates';

export async function putListingsSync(req: AuthenticatedRequest, res: Response) {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected an array of listings.' });
    return;
  }

  try {
    const existing = await getListings();
    const merged = applyListingsSync(req.auth!.userId, existing as never[], req.body);
    await saveListings(merged);
    res.json({ ok: true, count: merged.length });
  } catch (error) {
    if (error instanceof ListingUpdateError) {
      res.status(403).json({ error: error.message });
      return;
    }
    res.status(503).json({ error: error instanceof Error ? error.message : 'Database error' });
  }
}

export async function putAdminListings(req: AuthenticatedRequest, res: Response) {
  if (!Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected an array of listings.' });
    return;
  }

  try {
    const existing = await getListings();
    const merged = applyAdminListingsMerge(existing as never[], req.body);
    await saveListings(merged);
    res.json({ ok: true, count: merged.length });
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
