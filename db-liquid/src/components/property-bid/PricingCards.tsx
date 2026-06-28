import type { PropertyListing } from '../../types/listing';
import { formatPrice, getHighestBidPerSqFt } from '../../types/listing';
import { getCurrentHighestBidTotal, getListedPriceTotal, getMarketAskTotal } from '../../utils/listingDisplay';

type Props = {
  listing: PropertyListing;
  forBuyer?: boolean;
};

export function PricingCards({ listing, forBuyer = false }: Props) {
  const listed = getListedPriceTotal(listing);
  const marketAsk = getMarketAskTotal(listing);
  const hasBids = listing.bids.length > 0;
  const highestBidTotal = getCurrentHighestBidTotal(listing);
  const highestBidPerSqFt = getHighestBidPerSqFt(listing);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5">
        <p className="text-[15px] font-medium text-gray-600 mb-2">Listed Price</p>
        <p className="text-[36px] font-bold text-[#0F172A] leading-none">{formatPrice(listed)}</p>
        <p className="text-sm text-gray-500 mt-2">
          ₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft · {listing.areaSqFt.toLocaleString('en-IN')} sq.ft
        </p>
      </div>

      {forBuyer ? (
        <div className="bg-gradient-to-br from-green-50 to-white rounded-[18px] border border-green-200 p-6 shadow-[0_10px_30px_rgba(22,163,74,0.12)] transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[15px] font-medium text-green-800 mb-2">Highest Bid</p>
          <p className="text-[36px] font-bold text-green-700 leading-none">
            {hasBids ? formatPrice(highestBidTotal) : '—'}
          </p>
          <p className="text-sm text-green-700/80 mt-2">
            {hasBids
              ? `₹${highestBidPerSqFt.toLocaleString('en-IN')}/sq.ft · ${listing.bids.length} bid${listing.bids.length === 1 ? '' : 's'}`
              : 'No bids yet'}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-[18px] border border-amber-200 p-6 shadow-[0_10px_30px_rgba(245,158,11,0.12)] transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-[15px] font-medium text-amber-800 mb-2">Market Ask Value</p>
          <p className="text-[36px] font-bold text-[#F59E0B] leading-none">{formatPrice(marketAsk)}</p>
          <p className="text-sm text-amber-700/80 mt-2">Seller expected value</p>
        </div>
      )}
    </section>
  );
}
