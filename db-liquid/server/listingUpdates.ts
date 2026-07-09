import { mergeListingsForSave } from './mergeListings';
import type { Listing } from './sanitize';

export class ListingUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ListingUpdateError';
  }
}

function listingChanged(existing: Listing, incoming: Listing) {
  return JSON.stringify(existing) !== JSON.stringify(incoming);
}

function hasOwnNewBid(existing: Listing, incoming: Listing, userId: string) {
  return incoming.bids.some(
    (bid) =>
      bid.bidderUserId === userId && !existing.bids.some((prev) => prev.id === bid.id),
  );
}

function isAcceptedBuyer(existing: Listing, userId: string) {
  if (!existing.acceptedBidId) return false;
  const accepted = existing.bids.find((bid) => bid.id === existing.acceptedBidId);
  return accepted?.bidderUserId === userId;
}

/** Authenticated user sync — only create own listings; merges use JWT user id. */
export function applyListingsSync(
  userId: string,
  existingListings: Listing[],
  incomingListings: Listing[],
): Listing[] {
  const existingById = new Map(existingListings.map((listing) => [listing.id, listing]));

  for (const incoming of incomingListings) {
    const existing = existingById.get(incoming.id);
    if (!existing) {
      if (String(incoming.sellerId ?? '') !== userId) {
        throw new ListingUpdateError('Cannot create a listing for another seller.');
      }
      continue;
    }

    if (!listingChanged(existing, incoming)) {
      continue;
    }

    if (existing.sellerId === userId) {
      continue;
    }

    if (isAcceptedBuyer(existing, userId) || hasOwnNewBid(existing, incoming, userId)) {
      continue;
    }

    throw new ListingUpdateError('Cannot modify another seller\'s listing.');
  }

  return mergeListingsForSave(existingListings, incomingListings, userId);
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
