import { mergeListingsForSave } from './mergeListings';
import type { Listing } from './sanitize';

export class ListingUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListingUpdateError';
  }
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
  }));
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
      allowed.push(incoming);
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
