import type { ChatMessage, TokenStatus } from './deal';

export type Bid = {
  id: string;
  bidderName: string;
  bidderPhone: string;
  bidderUserId?: string;
  amountPerSqFt: number;
  createdAt: string;
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
  dataUrl: string;
  uploadedAt: string;
  status: VerificationDocStatus;
  reviewedAt?: string;
};

export type PropertyPhoto = {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
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
  furnishing?: string;
  facing?: string;
  parking?: number;
  possession?: string;
  cornerPlot?: boolean;
  boundaryWall?: boolean;
  publishedAt: string;
  biddingEndsAt: string;
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
};

export const BIDDING_DAYS = 7;
export const MIN_BID_INCREMENT = 100;

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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
    createdAt: raw.createdAt,
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
    furnishing: raw.furnishing,
    facing: raw.facing,
    parking: raw.parking,
    possession: raw.possession,
    cornerPlot: raw.cornerPlot,
    boundaryWall: raw.boundaryWall,
    publishedAt,
    biddingEndsAt: raw.biddingEndsAt ?? getBiddingEndDate(publishedAt),
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

export function getHighestBidPerSqFt(listing: PropertyListing) {
  if (listing.bids.length === 0) return listing.pricePerSqFt;
  return Math.max(...listing.bids.map((b) => b.amountPerSqFt));
}

export function getMinNextBid(listing: PropertyListing) {
  const highest = getHighestBidPerSqFt(listing);
  return highest + MIN_BID_INCREMENT;
}

/** Lowest valid next bid — shown as the recommended amount. */
export function getRecommendedBid(listing: PropertyListing) {
  return getMinNextBid(listing);
}

export type FastBidPreset = {
  id: string;
  label: string;
  amount: number;
  hint?: string;
};

/** Quick bid amounts above the current minimum. */
export function getFastBidPresets(listing: PropertyListing): FastBidPreset[] {
  const min = getMinNextBid(listing);
  return [
    { id: 'min', label: 'Minimum', amount: min, hint: 'Recommended' },
    { id: 'plus500', label: '+ ₹500', amount: min + 500 },
    { id: 'plus1000', label: '+ ₹1,000', amount: min + 1000 },
    { id: 'plus5000', label: '+ ₹5,000', amount: min + 5000 },
  ];
}

export function getBidTotal(amountPerSqFt: number, areaSqFt: number) {
  return amountPerSqFt * areaSqFt;
}

export function isBiddingOpen(listing: PropertyListing) {
  if (listing.acceptedBidId) return false;
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
