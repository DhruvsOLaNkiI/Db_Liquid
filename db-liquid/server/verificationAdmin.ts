type VerificationDocStatus = 'pending' | 'approved' | 'rejected';
type VerificationReviewStatus = 'none' | 'pending' | 'approved' | 'partial';

type VerificationDocument = {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  storageKey?: string;
  uploadedAt: string;
  status: VerificationDocStatus;
  reviewedAt?: string;
};

type PropertyPhoto = {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  storageKey?: string;
  uploadedAt: string;
};

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

export type AdminListingVerifications = {
  titleVerified: boolean;
  postedByOwner: boolean;
  bankApproved: boolean;
  freehold: boolean;
};

export type AdminListing = {
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
  verifications: AdminListingVerifications;
  verificationDocuments: VerificationDocument[];
  propertyPhotos: PropertyPhoto[];
  sellerProfile?: AdminSellerProfile;
};

type UserRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  createdAt?: string;
  profileImageUrl?: string;
  aadharNumber?: string;
  aadharVerified?: boolean;
  panNumber?: string;
  panVerified?: boolean;
};

export function toAdminUser(user: UserRecord, listingCount = 0): AdminUserProfile {
  return {
    id: String(user.id),
    name: String(user.name ?? ''),
    email: String(user.email ?? ''),
    phone: String(user.phone ?? ''),
    roles: user.roles ?? [],
    createdAt: String(user.createdAt ?? ''),
    profileImageUrl: user.profileImageUrl,
    aadharNumber: user.aadharNumber,
    aadharVerified: user.aadharVerified ?? false,
    panNumber: user.panNumber,
    panVerified: user.panVerified ?? false,
    listingCount,
  };
}

export function reviewUserKyc(
  user: Record<string, unknown>,
  field: 'aadhar' | 'pan',
  verified: boolean,
): { ok: true; user: Record<string, unknown> } | { ok: false; error: string } {
  if (field === 'aadhar') {
    if (verified && !user.aadharNumber) {
      return { ok: false, error: 'User has not provided an Aadhar number.' };
    }
    return { ok: true, user: { ...user, aadharVerified: verified } };
  }

  if (verified && !user.panNumber) {
    return { ok: false, error: 'User has not provided a PAN number.' };
  }
  return { ok: true, user: { ...user, panVerified: verified } };
}

export function computeVerificationReviewStatus(
  documents: VerificationDocument[] | undefined,
): VerificationReviewStatus {
  if (!documents?.length) return 'none';
  const allApproved = documents.every((doc) => doc.status === 'approved');
  if (allApproved) return 'approved';
  const hasPending = documents.some((doc) => doc.status === 'pending');
  const hasReviewed = documents.some((doc) => doc.status !== 'pending');
  if (hasPending && hasReviewed) return 'partial';
  if (hasPending) return 'pending';
  return 'partial';
}

export function buildApprovedVerifications(documents: VerificationDocument[]) {
  return {
    titleVerified: documents.some((d) => d.type === 'titleVerified' && d.status === 'approved'),
    postedByOwner: documents.some((d) => d.type === 'postedByOwner' && d.status === 'approved'),
    bankApproved: documents.some((d) => d.type === 'bankApproved' && d.status === 'approved'),
    freehold: documents.some((d) => d.type === 'freehold' && d.status === 'approved'),
  };
}

function toSellerProfile(user: UserRecord | undefined, listing: Record<string, unknown>): AdminSellerProfile {
  return {
    id: String(user?.id ?? listing.sellerId ?? ''),
    name: String(user?.name ?? listing.sellerName ?? ''),
    email: String(user?.email ?? ''),
    phone: String(user?.phone ?? listing.sellerPhone ?? ''),
    roles: user?.roles ?? [],
    createdAt: String(user?.createdAt ?? ''),
    profileImageUrl: user?.profileImageUrl,
    aadharNumber: user?.aadharNumber,
    aadharVerified: user?.aadharVerified ?? false,
    panNumber: user?.panNumber,
    panVerified: user?.panVerified ?? false,
  };
}

export function toAdminListing(
  listing: Record<string, unknown>,
  seller?: UserRecord,
): AdminListing {
  const documents = (listing.verificationDocuments as VerificationDocument[] | undefined) ?? [];
  const storedVerifications = listing.verifications as AdminListingVerifications | undefined;
  const verifications = storedVerifications ?? buildApprovedVerifications(documents);

  return {
    id: String(listing.id),
    sellerId: String(listing.sellerId ?? ''),
    sellerName: String(listing.sellerName ?? ''),
    sellerPhone: String(listing.sellerPhone ?? ''),
    propertyType: String(listing.propertyType ?? ''),
    location: String(listing.location ?? ''),
    locality: listing.locality ? String(listing.locality) : undefined,
    address: listing.address ? String(listing.address) : undefined,
    state: listing.state ? String(listing.state) : undefined,
    pincode: listing.pincode ? String(listing.pincode) : undefined,
    floor: listing.floor ? String(listing.floor) : undefined,
    totalFloors: listing.totalFloors ? String(listing.totalFloors) : undefined,
    pricePerSqFt: Number(listing.pricePerSqFt ?? 0),
    totalPrice: Number(listing.totalPrice ?? 0),
    areaSqFt: Number(listing.areaSqFt ?? 0),
    detailsSummary: String(listing.detailsSummary ?? ''),
    description: String(listing.description ?? ''),
    publishedAt: String(listing.publishedAt ?? ''),
    verificationReviewStatus: listing.verificationReviewStatus as VerificationReviewStatus | undefined,
    verifications,
    verificationDocuments: documents,
    propertyPhotos: (listing.propertyPhotos as PropertyPhoto[] | undefined) ?? [],
    sellerProfile: toSellerProfile(seller, listing),
  };
}

export function reviewVerificationDocument(
  listing: Record<string, unknown>,
  documentId: string,
  status: 'approved' | 'rejected',
) {
  const documents = ((listing.verificationDocuments as VerificationDocument[] | undefined) ?? []).map((doc) =>
    doc.id === documentId
      ? {
          ...doc,
          status,
          reviewedAt: new Date().toISOString(),
        }
      : doc,
  );

  const verificationReviewStatus = computeVerificationReviewStatus(documents);

  return {
    ...listing,
    verificationDocuments: documents,
    verificationReviewStatus,
    verifications: buildApprovedVerifications(documents),
  };
}
