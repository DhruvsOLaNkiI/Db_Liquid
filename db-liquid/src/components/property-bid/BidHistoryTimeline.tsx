import type { PropertyListing } from '../../types/listing';
import { formatPrice, getAcceptedBid, getBidAmount, getListingStatus } from '../../types/listing';

type Props = {
  listing: PropertyListing;
  sortedBids: PropertyListing['bids'];
};

export function BidHistoryTimeline({ listing, sortedBids }: Props) {
  const status = getListingStatus(listing);
  const acceptedBid = getAcceptedBid(listing);
  const highestBid = sortedBids[0];
  const displayBid = acceptedBid ?? highestBid;
  const isOnHold = status === 'accepted';

  return (
    <section className="w-full glass-card rounded-[18px] p-5 lg:p-6">
      <h2 className="text-lg lg:text-xl font-bold text-white mb-4">
        {isOnHold ? 'Winning Bid' : 'Highest Bid'}
      </h2>

      {!displayBid ? (
        <p className="text-white/80 text-sm py-2">No bids yet. Be the first to place an offer.</p>
      ) : (
        <div
          className={`flex items-center justify-between gap-4 px-4 py-4 sm:px-5 sm:py-5 rounded-xl ${
            isOnHold ? 'glass-card-inner-orange' : 'glass-card-inner-green'
          }`}
        >
          <div className="min-w-0">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 ${
                isOnHold ? 'status-pill-orange' : 'status-pill-green'
              }`}
            >
              {isOnHold ? 'On Hold' : 'Highest'}
            </span>
            <p className="text-sm font-medium text-white/85">
              {new Date(displayBid.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-xl sm:text-2xl font-bold leading-tight ${isOnHold ? 'text-orange-300' : 'text-green-300'}`}>
              {formatPrice(getBidAmount(displayBid, listing.areaSqFt))}
            </p>
            {listing.areaSqFt > 0 && (
              <p className="text-xs text-white/75 mt-1">
                ₹{Math.round(getBidAmount(displayBid, listing.areaSqFt) / listing.areaSqFt).toLocaleString('en-IN')}/sq.ft
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
