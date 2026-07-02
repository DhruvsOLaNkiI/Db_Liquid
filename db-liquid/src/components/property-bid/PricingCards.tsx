import type { PropertyListing } from '../../types/listing';
import { formatPrice, formatPriceShort } from '../../types/listing';
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

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      <div className="w-full rounded-[18px] border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <p className="text-[15px] font-medium text-gray-600 mb-2">Listed Price</p>
        <p className="text-[36px] font-bold text-[#0F172A] leading-none" title={formatPrice(listed)}>
          {formatPriceShort(listed)}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {formatPrice(listed)} · {listing.areaSqFt.toLocaleString('en-IN')} sq.ft
        </p>
      </div>

      {forBuyer ? (
        <div className="w-full rounded-[18px] border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-[0_10px_30px_rgba(22,163,74,0.12)]">
          <p className="text-[15px] font-medium text-green-800 mb-2">Highest Bid</p>
          <p
            className="text-[36px] font-bold text-green-700 leading-none"
            title={hasBids ? formatPrice(highestBidTotal) : undefined}
          >
            {hasBids ? formatPriceShort(highestBidTotal) : '—'}
          </p>
          <p className="text-sm text-green-700/80 mt-2">
            {hasBids
              ? `${formatPrice(highestBidTotal)} · ${listing.bids.length} bid${listing.bids.length === 1 ? '' : 's'}`
              : 'No bids yet'}
          </p>
        </div>
      ) : (
        <div className="w-full rounded-[18px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-[0_10px_30px_rgba(245,158,11,0.12)]">
          <p className="text-[15px] font-medium text-amber-800 mb-2">Market Ask Value</p>
          <p className="text-[36px] font-bold text-[#F59E0B] leading-none" title={formatPrice(marketAsk)}>
            {formatPriceShort(marketAsk)}
          </p>
          <p className="text-sm text-amber-700/80 mt-2">{formatPrice(marketAsk)} · Seller expected value</p>
        </div>
      )}
    </section>
  );
}
