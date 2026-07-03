import type { PropertyListing } from '../../types/listing';
import { formatPrice, formatPriceShort } from '../../types/listing';
import { getCurrentHighestBidTotal, getListedPriceTotal } from '../../utils/listingDisplay';

type Props = {
  listing: PropertyListing;
};

export function PricingCards({ listing }: Props) {
  const listed = getListedPriceTotal(listing);
  const hasBids = listing.bids.length > 0;
  const highestBidTotal = getCurrentHighestBidTotal(listing);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <div className="glass-card-inner rounded-xl px-4 py-4">
        <p className="text-xs font-semibold text-white/75 uppercase tracking-wide mb-1">Listed Price</p>
        <p className="text-2xl font-bold text-white leading-tight" title={formatPrice(listed)}>
          {formatPriceShort(listed)}
        </p>
        <p className="text-xs text-white/75 mt-1">
          {formatPrice(listed)} · {listing.areaSqFt.toLocaleString('en-IN')} sq.ft
        </p>
      </div>

      <div className="glass-card-inner-green rounded-xl px-4 py-4">
        <p className="text-xs font-semibold text-green-300 uppercase tracking-wide mb-1">Highest Bid</p>
        <p
          className="text-2xl font-bold text-green-300 leading-tight"
          title={hasBids ? formatPrice(highestBidTotal) : undefined}
        >
          {hasBids ? formatPriceShort(highestBidTotal) : '—'}
        </p>
        <p className="text-xs text-green-400/80 mt-1">
          {hasBids
            ? `${formatPrice(highestBidTotal)} · ${listing.bids.length} bid${listing.bids.length === 1 ? '' : 's'}`
            : 'No bids yet'}
        </p>
      </div>
    </div>
  );
}
