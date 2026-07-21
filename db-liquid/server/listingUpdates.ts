import { createHash } from 'node:crypto';
import { logger } from './logger';
import { mergeListingsForSave } from './mergeListings';
import { parseDataUrlOrBase64, putPrivateObject } from './objectStorage';
import type { Listing } from './sanitize';

export class ListingUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListingUpdateError';
  }
}

const BIDDING_DAYS = 7;

function serverNowIso() {
  return new Date().toISOString();
}

function biddingEndsFrom(publishedAt: string) {
  const end = new Date(publishedAt);
  end.setDate(end.getDate() + BIDDING_DAYS);
  return end.toISOString();
}

/** BID-006: new listings get server clock; bids/accept state cannot be invented on create. */
export function stampNewListing(incoming: Listing): Listing {
  const publishedAt = serverNowIso();
  return {
    ...incoming,
    publishedAt,
    biddingEndsAt: biddingEndsFrom(publishedAt),
    bids: [],
    acceptedBidId: null,
    acceptedAt: null,
    auctionClosedAt: null,
  };
}

function isAcceptedBuyer(existing: Listing, userId: string) {
  if (!existing.acceptedBidId) return false;
  const accepted = existing.bids.find((bid) => bid.id === existing.acceptedBidId);
  return accepted?.bidderUserId === userId;
}

/** Drop inline base64 when a storageKey exists so MongoDB stays small (SEC-011). */
function stripMediaPayloads<T extends { storageKey?: string; dataUrl?: string; url?: string }>(
  items: T[] | undefined,
): T[] | undefined {
  if (!items?.length) return items;
  return items.map((item) => {
    if (!item.storageKey) return item;
    const { url: _url, ...rest } = item;
    return { ...rest, dataUrl: '', url: undefined } as T;
  });
}

export function stripVerificationPayloads<T extends Listing>(listings: T[]): T[] {
  return listings.map((listing) => ({
    ...listing,
    verificationDocuments: stripMediaPayloads(listing.verificationDocuments),
    propertyPhotos: stripMediaPayloads(listing.propertyPhotos),
    propertyVideos: stripMediaPayloads(listing.propertyVideos),
  }));
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/**
 * Move any remaining inline base64 media into object storage so listing
 * documents (and /api/listings payloads) stay small. Content-hash keys make
 * re-syncs of the same media idempotent.
 */
async function externalizeMediaArray<
  T extends { storageKey?: string; dataUrl?: string; mimeType?: string },
>(items: T[] | undefined, purpose: string): Promise<T[] | undefined> {
  if (!items?.length) return items;
  const next: T[] = [];
  for (const item of items) {
    if (item?.storageKey || typeof item?.dataUrl !== 'string' || !item.dataUrl.startsWith('data:')) {
      next.push(item);
      continue;
    }
    try {
      const parsed = parseDataUrlOrBase64(item.dataUrl);
      if (!parsed.buffer.length) {
        next.push(item);
        continue;
      }
      const mimeType = parsed.mimeType || item.mimeType || 'image/jpeg';
      const hash = createHash('sha256').update(parsed.buffer).digest('hex').slice(0, 32);
      const key = `${purpose}/${hash}${EXT_BY_MIME[mimeType] ?? '.jpg'}`;
      const stored = await putPrivateObject({
        buffer: parsed.buffer,
        fileName: key,
        mimeType,
        purpose,
        key,
      });
      next.push({ ...item, storageKey: stored.storageKey, mimeType, dataUrl: '' });
    } catch (error) {
      // Keep the inline payload rather than losing the media on storage errors,
      // but log it — silent failures let multi-MB base64 pile up in MongoDB.
      logger.error({ err: error, purpose }, 'externalize-inline-media failed; keeping inline payload');
      next.push(item);
    }
  }
  return next;
}

export async function externalizeInlineMedia<T extends Listing>(listings: T[]): Promise<T[]> {
  return Promise.all(
    listings.map(async (listing) => ({
      ...listing,
      propertyPhotos: await externalizeMediaArray(listing.propertyPhotos, 'photo'),
      propertyVideos: await externalizeMediaArray(listing.propertyVideos, 'video'),
      verificationDocuments: await externalizeMediaArray(listing.verificationDocuments, 'kyc'),
    })),
  );
}

/** Authenticated user sync — only create/update listings this user may write. */
export function applyListingsSync(
  userId: string,
  existingListings: Listing[],
  incomingListings: Listing[],
): Listing[] {
  const existingById = new Map(existingListings.map((listing) => [listing.id, listing]));
  const allowed: Listing[] = [];

  for (const incoming of incomingListings) {
    const existing = existingById.get(incoming.id);

    // New listing — must be owned by the authenticated user.
    if (!existing) {
      if (String(incoming.sellerId ?? '') !== userId) {
        throw new ListingUpdateError('Cannot create a listing for another seller.');
      }
      allowed.push(stampNewListing(incoming));
      continue;
    }

    if (existing.sellerId === userId) {
      allowed.push(incoming);
      continue;
    }

    const hasOwnBid =
      isAcceptedBuyer(existing, userId) ||
      existing.bids.some((bid) => bid.bidderUserId === userId);

    if (hasOwnBid) {
      allowed.push(incoming);
      continue;
    }

    // Client cache includes other sellers' sanitized listings. Ignore those —
    // do not fail the whole sync (that blocked publishing new listings).
  }

  return mergeListingsForSave(existingListings, allowed, userId);
}

/** Admin bulk merge — full array replace/merge (imports, admin tools). */
export function applyAdminListingsMerge(
  existingListings: Listing[],
  incomingListings: Listing[],
): Listing[] {
  const existingById = new Map(existingListings.map((listing) => [listing.id, listing]));
  const incomingIds = new Set(incomingListings.map((listing) => listing.id));

  const mergedIncoming = incomingListings.map((incoming) => {
    const existing = existingById.get(incoming.id);
    if (!existing) return incoming;
    return { ...existing, ...incoming };
  });

  const untouched = existingListings.filter((listing) => !incomingIds.has(listing.id));
  return [...untouched, ...mergedIncoming];
}
