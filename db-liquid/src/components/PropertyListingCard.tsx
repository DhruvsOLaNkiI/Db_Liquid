import { Link } from 'react-router-dom';
import { MapPin, TrendingUp } from 'lucide-react';
import type { PropertyListing } from '../types/listing';
import {
  formatPrice,
  formatPriceShort,
  getBidCount,
  getListingStatus,
  getTimeRemaining,
} from '../types/listing';
import { formatBuyerConfiguration, getCurrentHighestBidTotal, getListedPriceTotal } from '../utils/listingDisplay';
import { OptimizedImage } from './OptimizedImage';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
];

export function PropertyListingCard({ listing }: { listing: PropertyListing }) {
  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const status = getListingStatus(listing);
  const bidCount = getBidCount(listing);
  const askTotal = getListedPriceTotal(listing);
  const highestTotal = getCurrentHighestBidTotal(listing);
  const hasBids = bidCount > 0;

  const statusLabel =
    status === 'accepted' ? 'On Hold' : status === 'active' ? 'Active' : 'Closed';

  return (
    <Link to={`/browse-property/${listing.id}`} className="block group h-full">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow h-full">
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
          <OptimizedImage
            src={listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex]}
            alt={listing.propertyType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-primary">
            {statusLabel}
          </div>
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-[#0F172A]/85 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold text-white flex items-center gap-0.5 sm:gap-1">
            <TrendingUp size={10} />
            {bidCount}
            <span className="hidden sm:inline"> bid{bidCount === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="p-2 sm:p-3.5">
          <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5 truncate">
            {listing.propertyType}
          </p>
          <h3 className="font-bold text-xs sm:text-sm text-gray-900 mb-0.5 flex items-center gap-1">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 truncate">{formatBuyerConfiguration(listing)}</p>
          <div className="flex items-start justify-between pt-2 sm:pt-3 border-t border-gray-100 gap-1.5 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Ask Bid</p>
              <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{formatPrice(askTotal)}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{formatPriceShort(askTotal)}</p>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">Highest</p>
              {hasBids ? (
                <>
                  <p className="text-sm sm:text-lg font-bold text-green-700 truncate">{formatPrice(highestTotal)}</p>
                  <p className="text-[10px] sm:text-[11px] text-green-700/80 truncate">{formatPriceShort(highestTotal)}</p>
                </>
              ) : (
                <p className="text-[11px] sm:text-sm font-semibold text-gray-400">No bids</p>
              )}
              <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 mt-0.5 sm:mt-1">{getTimeRemaining(listing)}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
