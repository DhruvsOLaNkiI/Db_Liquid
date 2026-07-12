import { randomUUID } from 'node:crypto';
import { saveListings, updateListings, updateUsersAndListings } from './mongoStore';

const CREDIT_COST_PER_BID = 1;

type Bid = {
  id: string;
  bidderName: string;
  bidderPhone: string;
  bidderUserId?: string;
  amountPerSqFt: number;
  bidTotal?: number;
  createdAt: string;
};

type ListingRecord = Record<string, unknown> & {
  id: string;
  sellerId?: string;
  location?: string;
  areaSqFt?: number;
  acceptedBidId?: string | null;
  acceptedAt?: string | null;
  proceededAt?: string | null;
  tokenStatus?: string;
  biddingEndsAt?: string;
  bids?: Bid[];
};

type UserRecord = Record<string, unknown> & {
  id: string;
  name?: string;
  phone?: string;
  roles?: string[];
  credits?: number;
  creditHistory?: unknown[];
};

export class BidError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = 'BidError';
  }
}

function getBidTotal(bid: Bid, areaSqFt: number) {
  if (typeof bid.bidTotal === 'number' && Number.isFinite(bid.bidTotal)) return bid.bidTotal;
  if (Number.isFinite(bid.amountPerSqFt) && areaSqFt > 0) return bid.amountPerSqFt * areaSqFt;
  return 0;
}

function getHighestBidTotal(listing: ListingRecord) {
  const areaSqFt = Number(listing.areaSqFt ?? 0);
  return ((listing.bids ?? []) as Bid[]).reduce(
    (max, bid) => Math.max(max, getBidTotal(bid, areaSqFt)),
    0,
  );
}

function isBiddingOpen(listing: ListingRecord) {
  if (listing.acceptedBidId) return false;
  if (!listing.biddingEndsAt) return true;
  return new Date(listing.biddingEndsAt).getTime() > Date.now();
}

function appendCreditHistory(user: UserRecord, entry: Record<string, unknown>) {
  const tx = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const history = Array.isArray(user.creditHistory) ? user.creditHistory : [];
  user.creditHistory = [tx, ...history].slice(0, 50);
}

export async function placeBidOnServer(input: {
  listingId: string;
  userId: string;
  bidTotal: number;
}) {
  return updateUsersAndListings(async ({ users, listings }) => {
    const user = users.find((entry) => (entry as UserRecord).id === input.userId) as
      | UserRecord
      | undefined;
    if (!user) throw new BidError('User not found.', 404);
    if (!Array.isArray(user.roles) || !user.roles.includes('buyer')) {
      throw new BidError('Only members can place bids.', 403);
    }

    const listingIndex = listings.findIndex(
      (entry) => (entry as ListingRecord).id === input.listingId,
    );
    if (listingIndex === -1) throw new BidError('Listing not found.', 404);

    const listing = listings[listingIndex] as ListingRecord;
    if (listing.sellerId === input.userId) {
      throw new BidError('You cannot bid on your own listing.', 403);
    }
    if (!isBiddingOpen(listing)) {
      throw new BidError('Bidding has closed for this property.', 409);
    }
    if (!Number.isFinite(input.bidTotal) || input.bidTotal <= 0) {
      throw new BidError('Enter a bid amount greater than ₹0.');
    }

    const highestBid = getHighestBidTotal(listing);
    if (input.bidTotal <= highestBid) {
      throw new BidError(`Bid must be greater than current highest bid ₹${highestBid}.`);
    }

    const credits = Number(user.credits ?? 0);
    if (!Number.isFinite(credits) || credits < CREDIT_COST_PER_BID) {
      throw new BidError(
        `Not enough credits. You need ${CREDIT_COST_PER_BID} credit per bid. Top up to add more credits.`,
        402,
      );
    }

    const nextCredits = credits - CREDIT_COST_PER_BID;
    user.credits = nextCredits;
    appendCreditHistory(user, {
      type: 'spend',
      credits: CREDIT_COST_PER_BID,
      balanceAfter: nextCredits,
      note: `Bid on ${String(listing.location ?? 'property')}`,
      listingId: listing.id,
    });

    const areaSqFt = Number(listing.areaSqFt ?? 0);
    const amountPerSqFt = areaSqFt > 0 ? input.bidTotal / areaSqFt : input.bidTotal;
    const bid: Bid = {
      id: randomUUID(),
      bidderName: String(user.name ?? 'Buyer'),
      bidderPhone: String(user.phone ?? ''),
      bidderUserId: input.userId,
      amountPerSqFt,
      bidTotal: input.bidTotal,
      createdAt: new Date().toISOString(),
    };

    listing.bids = [bid, ...((listing.bids ?? []) as Bid[])];
    listings[listingIndex] = listing;

    return {
      bid,
      creditsRemaining: nextCredits,
      listing,
    };
  });
}

export async function acceptBidOnServer(input: {
  listingId: string;
  bidId: string;
  sellerId: string;
}) {
  return updateListings(async (listings) => {
    const listingIndex = listings.findIndex(
      (entry) => (entry as ListingRecord).id === input.listingId,
    );
    if (listingIndex === -1) throw new BidError('Listing not found.', 404);

    const listing = listings[listingIndex] as ListingRecord;
    if (listing.sellerId !== input.sellerId) {
      throw new BidError('Not your listing.', 403);
    }
    if (listing.acceptedBidId) {
      throw new BidError('A bid has already been accepted.', 409);
    }

    const bid = ((listing.bids ?? []) as Bid[]).find((entry) => entry.id === input.bidId);
    if (!bid) throw new BidError('Bid not found.', 404);

    const now = new Date().toISOString();
    listing.acceptedBidId = input.bidId;
    listing.acceptedAt = now;
    listing.proceededAt = now;
    listing.tokenStatus = 'pending';
    listings[listingIndex] = listing;
    await saveListings(listings);

    return { listing, bid };
  });
}
