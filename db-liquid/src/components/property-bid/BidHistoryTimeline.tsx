import type { PropertyListing } from '../../types/listing';
import { formatPrice, getAcceptedBid, getBidTotal, getListingStatus } from '../../types/listing';

type Props = {
  listing: PropertyListing;
  sortedBids: PropertyListing['bids'];
};

export function BidHistoryTimeline({ listing, sortedBids }: Props) {
  const status = getListingStatus(listing);
  const acceptedBid = getAcceptedBid(listing);
  const displayBid = acceptedBid ?? sortedBids[0];
  const isOnHold = status === 'accepted';

  return (
    <section className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.05)] animate-in fade-in duration-300">
      <h2 className="text-[22px] font-bold text-[#0F172A] mb-6">
        {isOnHold ? 'Winning Bid' : 'Highest Bid'}
      </h2>

      {!displayBid ? (
        <p className="text-gray-500 text-sm">No bids yet. Be the first to place an offer.</p>
      ) : (
        <div
          className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-[14px] border shadow-[0_8px_24px_rgba(22,163,74,0.1)] transition-all duration-300 ${
            isOnHold ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <span
            className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isOnHold ? 'text-blue-700 bg-blue-100' : 'text-green-700 bg-green-100'
            }`}
          >
            {isOnHold ? 'On Hold' : 'Highest'}
          </span>
          <div>
            <p className="font-semibold text-[#0F172A]">
              {new Date(displayBid.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="sm:text-right">
            <p className={`text-xl font-bold ${isOnHold ? 'text-blue-700' : 'text-green-700'}`}>
              {formatPrice(getBidTotal(displayBid.amountPerSqFt, listing.areaSqFt))}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              ₹{displayBid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
