import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';
import { getSharedListings, persistListings } from './sharedStore';

export const LISTINGS_STORAGE_KEY = 'db-liquid-listings';

export function loadListingsFromStorage(): PropertyListing[] {
  return getSharedListings();
}

export function mergeListingsById(
  ...groups: PropertyListing[][]
): PropertyListing[] {
  const byId = new Map<string, PropertyListing>();

  for (const group of groups) {
    for (const listing of group) {
      const existing = byId.get(listing.id);
      if (!existing) {
        byId.set(listing.id, listing);
        continue;
      }

      const existingTime = new Date(existing.publishedAt).getTime();
      const listingTime = new Date(listing.publishedAt).getTime();
      const pickIncoming =
        listingTime > existingTime ||
        listing.bids.length > existing.bids.length ||
        listing.chatMessages.length > existing.chatMessages.length;

      byId.set(listing.id, pickIncoming ? listing : existing);
    }
  }

  return [...byId.values()];
}

export function sortListingsByNewest(listings: PropertyListing[]) {
  return [...listings].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function saveListingsToStorage(listings: PropertyListing[]): PropertyListing[] {
  const sorted = sortListingsByNewest(listings);
  void persistListings(sorted);
  return sorted;
}

export function appendListingToStorage(listing: PropertyListing): PropertyListing[] {
  const existing = loadListingsFromStorage();
  const next = sortListingsByNewest([
    normalizeListing(listing),
    ...existing.filter((l) => l.id !== listing.id),
  ]);
  return saveListingsToStorage(next);
}

export function replaceAllListings(listings: PropertyListing[]) {
  void persistListings(sortListingsByNewest(listings));
  return listings;
}

export function migrateListingsSellerId(
  fromSellerId: string,
  toSellerId: string,
  sellerName: string,
  sellerPhone: string,
) {
  if (!fromSellerId || fromSellerId === toSellerId) return;

  const listings = loadListingsFromStorage();
  let changed = false;

  const updated = listings.map((listing) => {
    if (listing.sellerId !== fromSellerId) return listing;
    changed = true;
    return {
      ...listing,
      sellerId: toSellerId,
      sellerName,
      sellerPhone,
    };
  });

  if (changed) {
    saveListingsToStorage(updated);
  }
}

export function syncUserProfileOnListings(userId: string, name: string, phone: string) {
  const listings = loadListingsFromStorage();
  let changed = false;

  const updated = listings.map((listing) => {
    let next = listing;

    if (listing.sellerId === userId) {
      changed = true;
      next = {
        ...next,
        sellerName: name,
        sellerPhone: phone,
        chatSellerName: listing.chatSellerName ? name : listing.chatSellerName,
        chatSellerPhone: listing.chatSellerPhone ? phone : listing.chatSellerPhone,
      };
    }

    const bids = listing.bids.map((bid) => {
      if (bid.bidderUserId !== userId) return bid;
      changed = true;
      return { ...bid, bidderName: name, bidderPhone: phone };
    });

    if (bids !== listing.bids) {
      next = { ...next, bids };
    }

    const acceptedBid = listing.acceptedBidId
      ? next.bids.find((bid) => bid.id === listing.acceptedBidId)
      : null;

    if (acceptedBid?.bidderUserId === userId && listing.chatBuyerName) {
      changed = true;
      next = { ...next, chatBuyerName: name, chatBuyerPhone: phone };
    }

    return next;
  });

  if (changed) {
    saveListingsToStorage(updated);
  }
}
