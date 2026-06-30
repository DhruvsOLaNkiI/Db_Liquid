import type { Listing } from './sanitize';

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
    createdAt: incoming.createdAt,
  };
}

function mergeBids(existingBids: Bid[], incomingBids: Bid[], viewerId?: string, isSeller?: boolean) {
  const byId = new Map(existingBids.map((bid) => [bid.id, bid]));

  for (const incoming of incomingBids) {
    const prev = byId.get(incoming.id);
    byId.set(incoming.id, prev ? mergeBid(prev, incoming, viewerId, isSeller) : incoming);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function mergeListing(existing: Listing, incoming: Listing, viewerId?: string): Listing {
  const isSeller = Boolean(viewerId && existing.sellerId === viewerId);
  const chatAllowed = isSeller || isAcceptedBuyer(existing, viewerId);

  const merged: Listing = {
    ...existing,
    ...incoming,
    sellerName: isSeller ? incoming.sellerName || existing.sellerName : existing.sellerName,
    sellerPhone: isSeller ? incoming.sellerPhone || existing.sellerPhone : existing.sellerPhone,
    address: isSeller ? incoming.address ?? existing.address : existing.address,
    pincode: isSeller ? incoming.pincode ?? existing.pincode : existing.pincode,
    bids: mergeBids(existing.bids, incoming.bids, viewerId, isSeller),
    verificationDocuments: isSeller
      ? incoming.verificationDocuments ?? existing.verificationDocuments
      : existing.verificationDocuments,
    lastDeclinedBuyerUserId: isSeller
      ? incoming.lastDeclinedBuyerUserId ?? existing.lastDeclinedBuyerUserId
      : existing.lastDeclinedBuyerUserId,
    lastDeclinedAt: isSeller ? incoming.lastDeclinedAt ?? existing.lastDeclinedAt : existing.lastDeclinedAt,
  };

  if (chatAllowed) {
    merged.chatMessages =
      incoming.chatMessages.length >= existing.chatMessages.length
        ? incoming.chatMessages
        : existing.chatMessages;
    merged.chatSellerName = incoming.chatSellerName || existing.chatSellerName;
    merged.chatSellerPhone = incoming.chatSellerPhone || existing.chatSellerPhone;
    merged.chatBuyerName = incoming.chatBuyerName || existing.chatBuyerName;
    merged.chatBuyerPhone = incoming.chatBuyerPhone || existing.chatBuyerPhone;
  } else {
    merged.chatMessages = existing.chatMessages;
    merged.chatSellerName = existing.chatSellerName;
    merged.chatSellerPhone = existing.chatSellerPhone;
    merged.chatBuyerName = existing.chatBuyerName;
    merged.chatBuyerPhone = existing.chatBuyerPhone;
  }

  return merged;
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
    if (!existing) return incoming;
    return mergeListing(existing, incoming, viewerId);
  });

  const untouched = existingListings.filter((listing) => !incomingIds.has(listing.id));
  return [...untouched, ...mergedIncoming];
}
