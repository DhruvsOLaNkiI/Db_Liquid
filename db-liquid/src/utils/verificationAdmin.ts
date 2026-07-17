import type {
  ListingVerifications,
  PropertyListing,
  PropertyPhoto,
  VerificationDocument,
  VerificationReviewStatus,
} from '../types/listing';
import type { User } from '../types/user';
import {
  getSharedListings,
  getSharedUsers,
  reloadListingsFromServer,
  reloadUsersFromServer,
} from './sharedStore';
import { apiFetch } from './api';

export type AdminSellerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  roles?: string[];
  profileImageUrl?: string;
  aadharNumber?: string;
  aadharVerified?: boolean;
  panNumber?: string;
  panVerified?: boolean;
  listingCount?: number;
};

export type AdminUserProfile = AdminSellerProfile;

export type VerificationQueueListing = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
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
  publishedAt: string;
  verificationReviewStatus?: VerificationReviewStatus;
  verifications: ListingVerifications;
  verificationDocuments: VerificationDocument[];
  propertyPhotos: PropertyPhoto[];
  sellerProfile?: AdminSellerProfile;
};

function buildApprovedVerifications(documents: VerificationDocument[]): ListingVerifications {
  return {
    titleVerified: documents.some((d) => d.type === 'titleVerified' && d.status === 'approved'),
    postedByOwner: documents.some((d) => d.type === 'postedByOwner' && d.status === 'approved'),
    bankApproved: documents.some((d) => d.type === 'bankApproved' && d.status === 'approved'),
    freehold: documents.some((d) => d.type === 'freehold' && d.status === 'approved'),
  };
}

function toAdminUser(user: User, listingCount = 0): AdminUserProfile {
  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    roles: user.roles ?? [],
    createdAt: user.createdAt ?? '',
    profileImageUrl: user.profileImageUrl,
    aadharNumber: user.aadharNumber,
    aadharVerified: user.aadharVerified ?? false,
    panNumber: user.panNumber,
    panVerified: user.panVerified ?? false,
    listingCount,
  };
}

function toAdminListing(listing: PropertyListing, seller?: User): VerificationQueueListing {
  const documents = listing.verificationDocuments ?? [];
  const verifications = listing.verifications ?? buildApprovedVerifications(documents);

  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName ?? seller?.name ?? '',
    sellerPhone: listing.sellerPhone ?? seller?.phone ?? '',
    propertyType: listing.propertyType,
    location: listing.location,
    locality: listing.locality,
    address: listing.address,
    state: listing.state,
    pincode: listing.pincode,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    pricePerSqFt: listing.pricePerSqFt,
    totalPrice: listing.totalPrice,
    areaSqFt: listing.areaSqFt,
    detailsSummary: listing.detailsSummary ?? '',
    description: listing.description ?? '',
    publishedAt: listing.publishedAt,
    verificationReviewStatus: listing.verificationReviewStatus,
    verifications,
    verificationDocuments: documents,
    propertyPhotos: listing.propertyPhotos ?? [],
    sellerProfile: seller ? toAdminUser(seller) : undefined,
  };
}

async function parseAdminJson<T>(res: Response, fallbackMessage: string) {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {
      ok: false as const,
      error: 'Admin API unavailable. Stop and restart `npm run dev` to load the latest server routes.',
    };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, error: (data as { error?: string }).error ?? fallbackMessage };
  }

  return { ok: true as const, data };
}

async function buildFromSharedStore() {
  await Promise.all([
    reloadUsersFromServer({ force: true }),
    reloadListingsFromServer({ force: true }),
  ]);

  const users = getSharedUsers();
  const listings = getSharedListings();
  const usersById = new Map(users.map((user) => [user.id, user]));
  const listingCountBySeller = new Map<string, number>();

  for (const listing of listings) {
    listingCountBySeller.set(
      listing.sellerId,
      (listingCountBySeller.get(listing.sellerId) ?? 0) + 1,
    );
  }

  return {
    users: users
      .map((user) => toAdminUser(user, listingCountBySeller.get(user.id) ?? 0))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    listings: listings
      .map((listing) => toAdminListing(listing, usersById.get(listing.sellerId)))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
  };
}

export async function fetchVerificationQueue(): Promise<
  { ok: true; listings: VerificationQueueListing[] } | { ok: false; error: string }
> {
  const res = await apiFetch('/api/admin/verification-queue');
  const parsed = await parseAdminJson<{ listings?: VerificationQueueListing[] }>(
    res,
    'Failed to load verification queue.',
  );

  if (parsed.ok && Array.isArray(parsed.data.listings) && parsed.data.listings.length > 0) {
    return { ok: true, listings: parsed.data.listings };
  }

  if (parsed.ok && Array.isArray(parsed.data.listings)) {
    const fallback = await buildFromSharedStore();
    if (fallback.listings.length > 0) {
      return { ok: true, listings: fallback.listings };
    }
    return { ok: true, listings: [] };
  }

  const fallback = await buildFromSharedStore();
  if (fallback.listings.length > 0) {
    return { ok: true, listings: fallback.listings };
  }

  return { ok: false, error: parsed.ok ? 'No listings found.' : parsed.error };
}

export async function fetchAdminUsers(): Promise<
  { ok: true; users: AdminUserProfile[] } | { ok: false; error: string }
> {
  const res = await apiFetch('/api/admin/users');
  const parsed = await parseAdminJson<{ users?: AdminUserProfile[] }>(
    res,
    'Failed to load users.',
  );

  if (parsed.ok && Array.isArray(parsed.data.users) && parsed.data.users.length > 0) {
    return { ok: true, users: parsed.data.users };
  }

  if (parsed.ok && Array.isArray(parsed.data.users)) {
    const fallback = await buildFromSharedStore();
    if (fallback.users.length > 0) {
      return { ok: true, users: fallback.users };
    }
    return { ok: true, users: [] };
  }

  const fallback = await buildFromSharedStore();
  if (fallback.users.length > 0) {
    return { ok: true, users: fallback.users };
  }

  return { ok: false, error: parsed.ok ? 'No users found.' : parsed.error };
}

export async function reviewVerificationDocument(
  listingId: string,
  documentId: string,
  status: 'approved' | 'rejected',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch('/api/admin/verification/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, documentId, status }),
  });

  const parsed = await parseAdminJson(res, 'Failed to update document.');
  if (!parsed.ok) return parsed;

  return { ok: true };
}

export async function reviewUserKyc(
  userId: string,
  field: 'aadhar' | 'pan',
  verified: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch('/api/admin/users/review-kyc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, field, verified }),
  });

  const parsed = await parseAdminJson(res, 'Failed to update user verification.');
  if (!parsed.ok) return parsed;

  return { ok: true };
}

export async function deleteAdminListing(
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await apiFetch(`/api/admin/listings/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
  });
  const parsed = await parseAdminJson(res, 'Failed to delete listing.');
  if (!parsed.ok) return parsed;
  return { ok: true };
}

/** RL-005 / BID-008 — admin bid audit trail (includes client IP). */
export type BidAuditEntry = {
  id: string;
  action: string;
  listingId: string;
  bidId: string;
  actorUserId: string;
  bidderUserId?: string;
  bidderName?: string;
  bidTotal: number;
  amountPerSqFt?: number;
  idempotencyKey?: string;
  ip: string;
  userAgent?: string;
  createdAt: string;
};

export async function fetchBidAudit(filters?: {
  listingId?: string;
  bidId?: string;
  ip?: string;
  limit?: number;
}): Promise<{ ok: true; entries: BidAuditEntry[] } | { ok: false; error: string }> {
  const params = new URLSearchParams();
  if (filters?.listingId?.trim()) params.set('listingId', filters.listingId.trim());
  if (filters?.bidId?.trim()) params.set('bidId', filters.bidId.trim());
  if (filters?.ip?.trim()) params.set('ip', filters.ip.trim());
  if (filters?.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const res = await apiFetch(`/api/admin/bid-audit${qs ? `?${qs}` : ''}`);
  const parsed = await parseAdminJson<{ entries?: BidAuditEntry[] }>(
    res,
    'Failed to load bid audit.',
  );
  if (!parsed.ok) return parsed;
  return { ok: true, entries: Array.isArray(parsed.data.entries) ? parsed.data.entries : [] };
}
