import type { ChatMessage, TokenStatus } from './deal';

export type Bid = {
  id: string;
  bidderName: string;
  bidderPhone: string;
  bidderUserId?: string;
  amountPerSqFt: number;
  /** Exact rupee total entered by the buyer (source of truth for display and ranking). */
  bidTotal?: number;
  createdAt: string;
  /** Client idempotency key — prevents double-submit (BID-007). */
  idempotencyKey?: string;
  /** Set when this bid's credit was refunded (BID-012). */
  creditRefundedAt?: string;
};

export type ListingVerifications = {
  titleVerified: boolean;
  postedByOwner: boolean;
  bankApproved: boolean;
  freehold: boolean;
};

export type VerificationDocType = keyof ListingVerifications;

export type VerificationDocStatus = 'pending' | 'approved' | 'rejected';

export type VerificationReviewStatus = 'none' | 'pending' | 'approved' | 'partial';

export type VerificationDocument = {
  id: string;
  type: VerificationDocType;
  fileName: string;
  mimeType: string;
  /** Legacy inline base64 — prefer storageKey for new uploads */
  dataUrl: string;
  /** Private object storage key (S3/R2/local) */
  storageKey?: string;
  uploadedAt: string;
  status: VerificationDocStatus;
  reviewedAt?: string;
};

export type PropertyPhoto = {
  id: string;
  fileName: string;
  mimeType: string;
  /** Legacy inline base64 — prefer storageKey for new uploads */
  dataUrl: string;
  /** Private object storage key (S3/R2/local) */
  storageKey?: string;
  uploadedAt: string;
};

export type PropertyVideo = {
  id: string;
  fileName: string;
  mimeType: string;
  /** Signed playback URL at runtime (or empty when only storageKey is stored) */
  dataUrl: string;
  /** Private object storage key (S3/R2/local) */
  storageKey?: string;
  uploadedAt: string;
};

export const DEFAULT_LISTING_VERIFICATIONS: ListingVerifications = {
  titleVerified: false,
  postedByOwner: false,
  bankApproved: false,
  freehold: false,
};

export type PropertyListing = {
  id: string;
  sellerId: string;
  propertyType: string;
  location: string;
  locality?: string;
  address?: string;
  state?: string;
  pincode?: string;
  floor?: string;
  totalFloors?: string;
  pricePerSqFt: number;
  totalPrice: number;
  areaSqFt: number;
  detailsSummary: string;
  description: string;
  verifications: ListingVerifications;
  verificationDocuments?: VerificationDocument[];
  verificationReviewStatus?: VerificationReviewStatus;
  propertyPhotos?: PropertyPhoto[];
  propertyVideos?: PropertyVideo[];
  furnishing?: string;
  facing?: string;
  parking?: number;
  possession?: string;
  cornerPlot?: boolean;
  boundaryWall?: boolean;
  plotOpenSides?: string;
  plotRoadWidthMeters?: number;
  plotConstructionDone?: boolean;
  plotGatedColony?: boolean;
  landZone?: string;
  /** Commercial shop — Under Construction / Ready to Move In */
  assetStatus?: string;
  paymentComplete?: boolean;
  paymentRemaining?: boolean;
  paymentRemainingPercent?: number;
  assuredReturn?: boolean;
  assuredReturnPercent?: number;
  leaseGuarantee?: boolean;
  leaseGuaranteeAmount?: number;
  /** Self use / By Developer */
  rightsOfUse?: string;
  /** Mall / Highstreet / Society Shop */
  shopType?: string;
  idealForBusinesses?: string;
  personalWashroom?: boolean;
  pantryCafeteria?: string;
  shopWashrooms?: string;
  cornerShop?: boolean;
  mainRoadFacing?: boolean;
  publishedAt: string;
  biddingEndsAt: string;
  /** Set by server job when biddingEndsAt passes (BID-009). */
  auctionClosedAt?: string | null;
  bids: Bid[];
  acceptedBidId: string | null;
  acceptedAt: string | null;
  proceededAt: string | null;
  tokenStatus: TokenStatus;
  chatMessages: ChatMessage[];
  sellerName: string;
  sellerPhone: string;
  chatSellerName: string;
  chatSellerPhone: string;
  chatBuyerName: string;
  chatBuyerPhone: string;
  lastDeclinedBuyerUserId?: string;
  lastDeclinedAt?: string;
  /** Total property page views (excludes seller self-views) */
  viewCount?: number;
  /** Distinct visitors who opened the listing */
  uniqueVisitorCount?: number;
  /** Visitors who came back at least once */
  returnVisitorCount?: number;
  /** Internal map of anonymous visitor id → visit count */
  visitorVisits?: Record<string, number>;
};

export const BIDDING_DAYS = 7;
export const MIN_BID_INCREMENT = 100;
/** Lowest allowed bid per sq.ft when there are no competing bids yet. */
export const ABSOLUTE_MIN_BID_PER_SQFT = 1;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact Indian price: ₹2.5 Cr, ₹45 Lakh, ₹12 K */
export function formatPriceShort(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return '₹0';

  if (amount >= 1_00_00_000) {
    const cr = amount / 1_00_00_000;
    const value = cr >= 100 ? Math.round(cr) : Math.round(cr * 10) / 10;
    return `₹${value.toLocaleString('en-IN')} Cr`;
  }
  if (amount >= 1_00_000) {
    const lakh = amount / 1_00_000;
    const value = lakh >= 100 ? Math.round(lakh) : Math.round(lakh * 10) / 10;
    return `₹${value.toLocaleString('en-IN')} Lakh`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    const value = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
    return `₹${value.toLocaleString('en-IN')} K`;
  }
  if (amount >= 100) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return formatPrice(amount);
}

export function getAreaSqFt(isPlot: boolean, builtUpArea: string, landSqFt: string) {
  const area = isPlot ? landSqFt : builtUpArea;
  return Number(area) || 0;
}

export function getTotalPrice(pricePerSqFt: string, areaSqFt: number) {
  return (Number(pricePerSqFt) || 0) * areaSqFt;
}

export function getBiddingEndDate(publishedAt: string) {
  const end = new Date(publishedAt);
  end.setDate(end.getDate() + BIDDING_DAYS);
  return end.toISOString();
}

export function normalizeBid(
  raw: Partial<Bid> & { id: string; bidderName: string; amountPerSqFt: number; createdAt: string },
): Bid {
  return {
    id: raw.id,
    bidderName: raw.bidderName,
    bidderPhone: raw.bidderPhone ?? '',
    bidderUserId: raw.bidderUserId,
    amountPerSqFt: raw.amountPerSqFt,
    bidTotal: raw.bidTotal,
    createdAt: raw.createdAt,
    idempotencyKey: raw.idempotencyKey,
    creditRefundedAt: raw.creditRefundedAt,
  };
}

export function normalizeVerifications(raw?: Partial<ListingVerifications>): ListingVerifications {
  if (!raw) {
    return {
      titleVerified: true,
      postedByOwner: true,
      bankApproved: true,
      freehold: true,
    };
  }
  return {
    titleVerified: raw.titleVerified ?? false,
    postedByOwner: raw.postedByOwner ?? false,
    bankApproved: raw.bankApproved ?? false,
    freehold: raw.freehold ?? false,
  };
}

export function normalizeListing(raw: Partial<PropertyListing> & { id: string }): PropertyListing {
  const publishedAt = raw.publishedAt ?? new Date().toISOString();
  const locality = raw.locality?.trim() || undefined;
  const state = raw.state?.trim() || undefined;
  const location =
    raw.location?.trim() ||
    (locality && state ? `${locality}, ${state}` : raw.location ?? '');

  return {
    id: raw.id,
    sellerId: raw.sellerId ?? '',
    sellerName: raw.sellerName ?? 'Property Owner',
    sellerPhone: raw.sellerPhone ?? '',
    propertyType: raw.propertyType ?? 'Property',
    location,
    locality,
    address: raw.address?.trim() || undefined,
    state,
    pincode: raw.pincode?.trim() || undefined,
    floor: raw.floor?.trim() || undefined,
    totalFloors: raw.totalFloors?.trim() || undefined,
    pricePerSqFt: raw.pricePerSqFt ?? 0,
    totalPrice: raw.totalPrice ?? 0,
    areaSqFt: raw.areaSqFt ?? 0,
    detailsSummary: raw.detailsSummary ?? '',
    description: raw.description ?? '',
    verifications: normalizeVerifications(raw.verifications),
    verificationDocuments: (raw.verificationDocuments ?? []).map((doc) => ({
      ...doc,
      status: doc.status ?? 'pending',
    })),
    verificationReviewStatus: raw.verificationReviewStatus ?? 'none',
    propertyPhotos: raw.propertyPhotos ?? [],
    propertyVideos: raw.propertyVideos ?? [],
    furnishing: raw.furnishing,
    facing: raw.facing,
    parking: raw.parking,
    possession: raw.possession,
    cornerPlot: raw.cornerPlot,
    boundaryWall: raw.boundaryWall,
    plotOpenSides: raw.plotOpenSides,
    plotRoadWidthMeters: raw.plotRoadWidthMeters,
    plotConstructionDone: raw.plotConstructionDone,
    plotGatedColony: raw.plotGatedColony,
    landZone: raw.landZone,
    assetStatus: raw.assetStatus,
    paymentComplete: raw.paymentComplete,
    paymentRemaining: raw.paymentRemaining,
    paymentRemainingPercent: raw.paymentRemainingPercent,
    assuredReturn: raw.assuredReturn,
    assuredReturnPercent: raw.assuredReturnPercent,
    leaseGuarantee: raw.leaseGuarantee,
    leaseGuaranteeAmount: raw.leaseGuaranteeAmount,
    rightsOfUse: raw.rightsOfUse,
    shopType: raw.shopType,
    idealForBusinesses: raw.idealForBusinesses,
    personalWashroom: raw.personalWashroom,
    pantryCafeteria: raw.pantryCafeteria,
    shopWashrooms: raw.shopWashrooms,
    cornerShop: raw.cornerShop,
    mainRoadFacing: raw.mainRoadFacing,
    publishedAt,
    biddingEndsAt: raw.biddingEndsAt ?? getBiddingEndDate(publishedAt),
    auctionClosedAt: raw.auctionClosedAt ?? null,
    bids: (raw.bids ?? []).map((b) => normalizeBid(b as Bid)),
    acceptedBidId: raw.acceptedBidId ?? null,
    acceptedAt: raw.acceptedAt ?? null,
    proceededAt: raw.proceededAt ?? null,
    tokenStatus: raw.tokenStatus ?? 'none',
    chatMessages: raw.chatMessages ?? [],
    chatSellerName: raw.chatSellerName ?? '',
    chatSellerPhone: raw.chatSellerPhone ?? '',
    chatBuyerName: raw.chatBuyerName ?? '',
    chatBuyerPhone: raw.chatBuyerPhone ?? '',
    lastDeclinedBuyerUserId: raw.lastDeclinedBuyerUserId,
    lastDeclinedAt: raw.lastDeclinedAt,
    viewCount: raw.viewCount ?? 0,
    uniqueVisitorCount: raw.uniqueVisitorCount ?? 0,
    returnVisitorCount: raw.returnVisitorCount ?? 0,
    visitorVisits: raw.visitorVisits ?? {},
  };
}

export function isChatEnabled(listing: PropertyListing) {
  return listing.tokenStatus === 'paid' || listing.tokenStatus === 'skipped';
}

export function canProceed(listing: PropertyListing) {
  return listing.acceptedBidId !== null && !listing.proceededAt;
}

/** Buyer still needs to pay (or skip) the token after seller accepts. */
export function isBuyerTokenDue(listing: PropertyListing) {
  if (!listing.acceptedBidId) return false;
  if (listing.tokenStatus === 'paid' || listing.tokenStatus === 'skipped') return false;
  return true;
}

/** @deprecated Use isBuyerTokenDue */
export function isTokenStep(listing: PropertyListing) {
  return isBuyerTokenDue(listing);
}

export function isAcceptedBuyerForListing(
  listing: PropertyListing,
  user: { id: string; name: string; phone: string },
) {
  const bid = getAcceptedBid(listing);
  if (!bid) return false;
  if (bid.bidderUserId) return bid.bidderUserId === user.id;
  return bid.bidderName === user.name && bid.bidderPhone === user.phone;
}

export function wasBuyerDeclinedBySeller(listing: PropertyListing, buyerUserId: string) {
  return listing.lastDeclinedBuyerUserId === buyerUserId;
}

export function isListingAccepted(listing: PropertyListing) {
  return listing.acceptedBidId !== null;
}

export function getAcceptedBid(listing: PropertyListing) {
  if (!listing.acceptedBidId) return null;
  return listing.bids.find((b) => b.id === listing.acceptedBidId) ?? null;
}

export function getListingStatus(listing: PropertyListing): 'active' | 'accepted' | 'closed' {
  if (listing.acceptedBidId) return 'accepted';
  if (!isBiddingOpen(listing)) return 'closed';
  return 'active';
}

export function getBidTotal(amountPerSqFt: number, areaSqFt: number) {
  return amountPerSqFt * areaSqFt;
}

/** Rupee total for a bid — uses stored bidTotal when present. */
export function getBidAmount(bid: Bid, areaSqFt: number) {
  if (bid.bidTotal != null && bid.bidTotal > 0) return bid.bidTotal;
  return getBidTotal(bid.amountPerSqFt, areaSqFt);
}

export function getHighestBid(listing: PropertyListing): Bid | undefined {
  if (listing.bids.length === 0) return undefined;
  return listing.bids.reduce((best, bid) =>
    getBidAmount(bid, listing.areaSqFt) >= getBidAmount(best, listing.areaSqFt) ? bid : best,
  );
}

export function getHighestBidTotal(listing: PropertyListing) {
  const bid = getHighestBid(listing);
  return bid ? getBidAmount(bid, listing.areaSqFt) : 0;
}

export function sortBidsByAmount(bids: Bid[], areaSqFt: number) {
  return [...bids].sort(
    (a, b) => getBidAmount(b, areaSqFt) - getBidAmount(a, areaSqFt),
  );
}

export function getHighestBidPerSqFt(listing: PropertyListing) {
  const bid = getHighestBid(listing);
  if (!bid) return 0;
  if (listing.areaSqFt > 0) return getBidAmount(bid, listing.areaSqFt) / listing.areaSqFt;
  return bid.amountPerSqFt;
}

export function getMinNextBid(_listing: PropertyListing) {
  return ABSOLUTE_MIN_BID_PER_SQFT;
}

export function isValidBidTotal(bidTotal: number) {
  return Number.isFinite(bidTotal) && bidTotal > 0;
}

/** @deprecated Use isValidBidTotal — kept for legacy call sites. */
export function isValidBidAmount(amountPerSqFt: number, areaSqFt: number) {
  return amountPerSqFt > 0 && areaSqFt > 0 && getBidTotal(amountPerSqFt, areaSqFt) > 0;
}

/** Suggested bid total — ask price when no bids, otherwise the current highest bid total. */
export function getRecommendedBidTotal(listing: PropertyListing) {
  if (listing.bids.length === 0) return listing.totalPrice;
  return getHighestBidTotal(listing);
}

/** Suggested per-sq.ft rate derived from the recommended total. */
export function getRecommendedBid(listing: PropertyListing) {
  if (listing.areaSqFt <= 0) return listing.pricePerSqFt;
  return getRecommendedBidTotal(listing) / listing.areaSqFt;
}

export type FastBidPreset = {
  id: string;
  label: string;
  amount: number;
  hint?: string;
};

/** Quick bid amount suggestions (totals in rupees). */
export function getFastBidPresets(listing: PropertyListing): FastBidPreset[] {
  const base = getRecommendedBidTotal(listing);
  return [
    { id: 'suggested', label: 'Suggested', amount: base, hint: 'Recommended' },
    { id: 'plus500', label: '+ ₹500', amount: base + 500 },
    { id: 'plus1000', label: '+ ₹1,000', amount: base + 1000 },
    { id: 'plus5000', label: '+ ₹5,000', amount: base + 5000 },
  ];
}

export function isBiddingOpen(listing: PropertyListing) {
  if (listing.acceptedBidId) return false;
  if (listing.auctionClosedAt) return false;
  return new Date(listing.biddingEndsAt) > new Date();
}

export function getTimeRemaining(listing: PropertyListing) {
  const diff = new Date(listing.biddingEndsAt).getTime() - Date.now();
  if (diff <= 0) return 'Closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getBidCount(listing: PropertyListing) {
  return listing.bids.length;
}
