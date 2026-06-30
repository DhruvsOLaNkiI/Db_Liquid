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
import { formatBuyerConfiguration, getListedPriceTotal } from '../utils/listingDisplay';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

export function PropertyListingCard({ listing }: { listing: PropertyListing }) {
  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const status = getListingStatus(listing);
  const bidCount = getBidCount(listing);
  const askTotal = getListedPriceTotal(listing);

  const statusLabel =
    status === 'accepted' ? 'On Hold' : status === 'active' ? 'Active Bid' : 'Closed';

  return (
    <Link to={`/browse-property/${listing.id}`} className="block group h-full">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow h-full">
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
          <img
            src={listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex]}
            alt={listing.propertyType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-primary">
            {statusLabel}
          </div>
          <div className="absolute top-2 right-2 bg-[#0F172A]/85 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-white flex items-center gap-1">
            <TrendingUp size={10} />
            {bidCount} bid{bidCount === 1 ? '' : 's'}
          </div>
        </div>
        <div className="p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5 truncate">
            {listing.propertyType}
          </p>
          <h3 className="font-bold text-sm text-gray-900 mb-0.5 flex items-center gap-1">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </h3>
          <p className="text-xs text-gray-500 mb-3 truncate">{formatBuyerConfiguration(listing)}</p>
          <div className="flex items-end justify-between pt-3 border-t border-gray-100 gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 mb-0.5">Ask Bid</p>
              <p className="text-lg font-bold text-gray-900 truncate">{formatPrice(askTotal)}</p>
              <p className="text-[11px] text-gray-500 truncate">{formatPriceShort(askTotal)}</p>
            </div>
            <span className="text-[10px] font-medium text-gray-400 shrink-0 text-right leading-tight">
              {getTimeRemaining(listing)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
