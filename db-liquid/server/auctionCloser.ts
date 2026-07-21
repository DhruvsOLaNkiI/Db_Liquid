import { refundBidCreditToUser } from './creditRefunds';
import { getListings, updateUsersAndListings } from './mongoStore';

export type CloseExpiredResult = {
  scanned: number;
  closed: number;
  closedListingIds: string[];
  refundedBids: number;
};

type BidRecord = {
  id: string;
  bidderUserId?: string;
  creditRefundedAt?: string;
};

type ListingRecord = Record<string, unknown> & {
  id: string;
  location?: string;
  biddingEndsAt?: string;
  acceptedBidId?: string | null;
  auctionClosedAt?: string | null;
  bids?: BidRecord[];
};

type UserRecord = {
  id: string;
  credits?: number;
  creditHistory?: unknown[];
};

function shouldClose(listing: ListingRecord, nowMs: number) {
  if (listing.acceptedBidId) return false;
  if (listing.auctionClosedAt) return false;
  if (!listing.biddingEndsAt) return false;
  const endsAt = new Date(listing.biddingEndsAt).getTime();
  if (!Number.isFinite(endsAt)) return false;
  return endsAt <= nowMs;
}

/**
 * BID-009 + BID-012: mark expired auctions closed and refund unrefunded bid credits.
 */
export async function closeExpiredAuctions(now = new Date()): Promise<CloseExpiredResult> {
  const nowMs = now.getTime();
  const nowIso = now.toISOString();

  // Cheap read-only pre-check. Without it, this job rewrites every user and
  // listing to MongoDB each run even when nothing changed, which both hammers
  // the database and can resurrect stale data read before a concurrent write.
  const candidates = (await getListings()) as ListingRecord[];
  if (!candidates.some((listing) => shouldClose(listing, nowMs))) {
    return {
      scanned: candidates.length,
      closed: 0,
      closedListingIds: [],
      refundedBids: 0,
    };
  }

  return updateUsersAndListings(async ({ users, listings }) => {
    const closedListingIds: string[] = [];
    let refundedBids = 0;
    const usersById = new Map(
      users.map((entry) => [(entry as UserRecord).id, entry as UserRecord]),
    );

    for (let i = 0; i < listings.length; i += 1) {
      const listing = listings[i] as ListingRecord;
      if (!shouldClose(listing, nowMs)) continue;

      const bids = (listing.bids ?? []) as BidRecord[];
      for (const bid of bids) {
        if (!bid.bidderUserId || bid.creditRefundedAt) continue;
        const buyer = usersById.get(bid.bidderUserId);
        if (!buyer) continue;
        refundBidCreditToUser(buyer, {
          listingId: listing.id,
          bidId: bid.id,
          note: `Refund — auction closed on ${String(listing.location ?? 'property')}`,
        });
        bid.creditRefundedAt = nowIso;
        refundedBids += 1;
      }

      listing.bids = bids;
      listing.auctionClosedAt = nowIso;
      listings[i] = listing;
      closedListingIds.push(listing.id);
    }

    return {
      scanned: listings.length,
      closed: closedListingIds.length,
      closedListingIds,
      refundedBids,
    };
  });
}

export function startAuctionCloser(options?: { intervalMs?: number }) {
  const intervalMs = Math.max(
    5_000,
    Number(options?.intervalMs ?? process.env.AUCTION_CLOSE_INTERVAL_MS ?? 60_000),
  );

  const run = () => {
    void closeExpiredAuctions()
      .then((result) => {
        if (result.closed > 0 || result.refundedBids > 0) {
          console.log(
            `[auction-closer] closed ${result.closed} auction(s), refunded ${result.refundedBids} bid credit(s)`,
          );
        }
      })
      .catch((error) => {
        console.error('[auction-closer] failed', error);
      });
  };

  run();
  const timer = setInterval(run, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  auctionCloserTimer = timer;
  return timer;
}

let auctionCloserTimer: ReturnType<typeof setInterval> | null = null;

export function stopAuctionCloser() {
  if (auctionCloserTimer) {
    clearInterval(auctionCloserTimer);
    auctionCloserTimer = null;
  }
}
