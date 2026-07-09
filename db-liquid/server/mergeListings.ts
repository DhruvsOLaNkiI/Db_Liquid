import type { Listing } from './sanitize';
import { mergeViewAnalytics } from './listingViews';

type Bid = Listing['bids'][number];

function isAcceptedBuyer(listing: Listing, viewerId?: string) {
  if (!viewerId || !listing.acceptedBidId) return false;
  const accepted = listing.bids.find((bid) => bid.id === listing.acceptedBidId);
  return accepted?.bidderUserId === viewerId;
}

function mergeBid(existing: Bid, incoming: Bid, viewerId?: string, isSeller?: boolean) {
  const isOwnBid = Boolean(viewerId && incoming.bidderUserId === viewerId);

  if (!existing) return incoming;
  if (isSeller || isOwnBid) return incoming;

  return {
    ...existing,
    amountPerSqFt: incoming.amountPerSqFt,
    bidTotal: incoming.bidTotal ?? existing.bidTotal,
    createdAt: incoming.createdAt,
  };
}

function mergeBids(existingBids: Bid[], incomingBids: Bid[], viewerId?: string, isSeller?: boolean) {
  const byId = new Map(existingBids.map((bid) => [bid.id, bid]));

  for (const incoming of incomingBids) {
    const prev = byId.get(incoming.id);
    if (!prev) {
      const isOwnBid = Boolean(viewerId && incoming.bidderUserId === viewerId);
      if (isSeller || isOwnBid) {
        byId.set(incoming.id, incoming);
      }
      continue;
    }
    byId.set(incoming.id, mergeBid(prev, incoming, viewerId, isSeller));
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function mergeListing(existing: Listing, incoming: Listing, viewerId?: string): Listing {
  const isSeller = Boolean(viewerId && existing.sellerId === viewerId);
  const chatAllowed = isSeller || isAcceptedBuyer(existing, viewerId);
  const analytics = mergeViewAnalytics(
    existing as Record<string, unknown>,
    incoming as Record<string, unknown>,
  );

  if (isSeller) {
    const merged: Listing = {
      ...existing,
      ...incoming,
      sellerId: existing.sellerId,
      sellerName: incoming.sellerName || existing.sellerName,
      sellerPhone: incoming.sellerPhone || existing.sellerPhone,
      address: incoming.address ?? existing.address,
      pincode: incoming.pincode ?? existing.pincode,
      bids: mergeBids(existing.bids, incoming.bids, viewerId, true),
      verificationDocuments: incoming.verificationDocuments ?? existing.verificationDocuments,
      lastDeclinedBuyerUserId:
        incoming.lastDeclinedBuyerUserId ?? existing.lastDeclinedBuyerUserId,
      lastDeclinedAt: incoming.lastDeclinedAt ?? existing.lastDeclinedAt,
      ...analytics,
    };
    return merged;
  }

  if (chatAllowed) {
    return {
      ...existing,
      bids: mergeBids(existing.bids, incoming.bids, viewerId, false),
      proceededAt: incoming.proceededAt ?? existing.proceededAt,
      tokenStatus: incoming.tokenStatus ?? existing.tokenStatus,
      chatMessages:
        incoming.chatMessages.length >= existing.chatMessages.length
          ? incoming.chatMessages
          : existing.chatMessages,
      chatSellerName: incoming.chatSellerName || existing.chatSellerName,
      chatSellerPhone: incoming.chatSellerPhone || existing.chatSellerPhone,
      chatBuyerName: incoming.chatBuyerName || existing.chatBuyerName,
      chatBuyerPhone: incoming.chatBuyerPhone || existing.chatBuyerPhone,
      ...analytics,
    };
  }

  return {
    ...existing,
    bids: mergeBids(existing.bids, incoming.bids, viewerId, false),
    ...analytics,
  };
}

export function mergeListingsForSave(
  existingListings: Listing[],
  incomingListings: Listing[],
  viewerId?: string,
) {
  const existingById = new Map(existingListings.map((listing) => [listing.id, listing]));
  const incomingIds = new Set(incomingListings.map((listing) => listing.id));

  const mergedIncoming = incomingListings.map((incoming) => {
    const existing = existingById.get(incoming.id);
    if (!existing) {
      return incoming;
    }
    return mergeListing(existing, incoming, viewerId);
  });

  const untouched = existingListings.filter((listing) => !incomingIds.has(listing.id));
  return [...untouched, ...mergedIncoming];
}
