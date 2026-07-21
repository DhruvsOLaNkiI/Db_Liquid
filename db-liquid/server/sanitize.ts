type Bid = {
  id: string;
  bidderName: string;
  bidderPhone: string;
  bidderUserId?: string;
  amountPerSqFt: number;
  bidTotal?: number;
  createdAt: string;
  idempotencyKey?: string;
};

export type Listing = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  address?: string;
  pincode?: string;
  publishedAt?: string;
  biddingEndsAt?: string;
  auctionClosedAt?: string | null;
  bids: Bid[];
  acceptedBidId: string | null;
  acceptedAt?: string | null;
  chatMessages: unknown[];
  chatSellerName: string;
  chatSellerPhone: string;
  chatBuyerName: string;
  chatBuyerPhone: string;
  verificationDocuments?: { dataUrl?: string; storageKey?: string; url?: string }[];
  propertyPhotos?: { dataUrl?: string; storageKey?: string; url?: string }[];
  propertyVideos?: { dataUrl?: string; storageKey?: string; url?: string }[];
  lastDeclinedBuyerUserId?: string;
  lastDeclinedAt?: string;
  [key: string]: unknown;
};

type User = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password?: string;
  roles: string[];
  createdAt: string;
  credits?: number;
  creditHistory?: unknown[];
  profileImageUrl?: string;
};

function isAcceptedBuyer(listing: Listing, viewerId?: string) {
  if (!viewerId || !listing.acceptedBidId) return false;
  const accepted = listing.bids.find((bid) => bid.id === listing.acceptedBidId);
  return accepted?.bidderUserId === viewerId;
}

function canViewChat(listing: Listing, viewerId?: string) {
  if (!viewerId) return false;
  return listing.sellerId === viewerId || isAcceptedBuyer(listing, viewerId);
}

function redactBid(bid: Bid, index: number, viewerId?: string, isSeller?: boolean) {
  const isOwnBid = Boolean(viewerId && bid.bidderUserId === viewerId);
  const reveal = isSeller || isOwnBid;

  return {
    id: bid.id,
    amountPerSqFt: bid.amountPerSqFt,
    ...(bid.bidTotal != null ? { bidTotal: bid.bidTotal } : {}),
    createdAt: bid.createdAt,
    bidderName: reveal ? bid.bidderName : `Bidder ${index + 1}`,
    bidderPhone: reveal ? bid.bidderPhone : '',
    ...(reveal && bid.bidderUserId ? { bidderUserId: bid.bidderUserId } : {}),
    // Keep key only for the bidder (needed for client replay awareness).
    ...(isOwnBid && bid.idempotencyKey ? { idempotencyKey: bid.idempotencyKey } : {}),
  };
}

export function sanitizeListing(listing: Listing, viewerId?: string): Listing {
  const isSeller = Boolean(viewerId && listing.sellerId === viewerId);
  const chatAllowed = canViewChat(listing, viewerId);

  const sanitized: Listing = {
    ...listing,
    sellerName: isSeller ? listing.sellerName : 'Property Owner',
    sellerPhone: isSeller ? listing.sellerPhone : '',
    address: isSeller ? listing.address : '',
    pincode: isSeller ? listing.pincode : '',
    bids: listing.bids.map((bid, index) => redactBid(bid, index, viewerId, isSeller)),
    chatSellerName: chatAllowed ? listing.chatSellerName : '',
    chatSellerPhone: chatAllowed ? listing.chatSellerPhone : '',
    chatBuyerName: chatAllowed ? listing.chatBuyerName : '',
    chatBuyerPhone: chatAllowed ? listing.chatBuyerPhone : '',
    chatMessages: chatAllowed ? listing.chatMessages : [],
    // Never ship inline base64 — it turns /api/listings into multi-MB payloads.
    // Signed URLs are attached later from storageKey only.
    verificationDocuments: isSeller
      ? listing.verificationDocuments?.map((doc) => ({
          ...doc,
          dataUrl: '',
          url: undefined,
        }))
      : listing.verificationDocuments?.map((doc) => {
          const { storageKey: _key, url: _url, ...rest } = doc;
          return { ...rest, dataUrl: '', storageKey: undefined, url: undefined };
        }),
    propertyPhotos: listing.propertyPhotos?.map((photo) => ({
      ...photo,
      dataUrl: '',
      url: undefined,
    })),
    propertyVideos: listing.propertyVideos?.map((video) => ({
      ...video,
      dataUrl: '',
      url: undefined,
    })),
  };

  if (!isSeller) {
    delete sanitized.lastDeclinedBuyerUserId;
    delete sanitized.lastDeclinedAt;
    delete sanitized.viewCount;
    delete sanitized.uniqueVisitorCount;
    delete sanitized.returnVisitorCount;
  }

  delete sanitized.visitorVisits;

  return sanitized;
}

export function sanitizeListings(listings: Listing[], viewerId?: string) {
  return listings.map((listing) => sanitizeListing(listing, viewerId));
}

export function sanitizeUser(user: User, viewerId?: string) {
  const isSelf = Boolean(viewerId && user.id === viewerId);
  const { password: _password, ...rest } = user;

  if (!isSelf) {
    return {
      id: user.id,
      name: user.name,
      roles: user.roles,
      createdAt: user.createdAt,
    };
  }


  return {
    ...rest,
    creditHistory: user.creditHistory ?? [],
  };
}

export function sanitizeUsers(users: User[], viewerId?: string) {
  return users.map((user) => sanitizeUser(user, viewerId));
}
