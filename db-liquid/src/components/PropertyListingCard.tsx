import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { PropertyListing } from '../types/listing';
import {
  formatPrice,
  getBidTotal,
  getHighestBidPerSqFt,
  getListingStatus,
  getTimeRemaining,
} from '../types/listing';
import { formatBuyerConfiguration } from '../utils/listingDisplay';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

export function PropertyListingCard({ listing }: { listing: PropertyListing }) {
  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const status = getListingStatus(listing);
  const highestBid = getHighestBidPerSqFt(listing);
  const hasBids = listing.bids.length > 0;

  const statusLabel =
    status === 'accepted' ? 'Hold' : status === 'active' ? 'Active Bid' : 'Closed';

  return (
    <Link to={`/browse-property/${listing.id}`} className="block group">
      <article className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
          <img
            src={listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex]}
            alt={listing.propertyType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
            {statusLabel}
          </div>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            {listing.propertyType}
          </p>
          <h3 className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-1.5">
            <MapPin size={16} className="text-gray-400 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">{formatBuyerConfiguration(listing)}</p>
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{hasBids ? 'Highest bid' : 'Starting at'}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(getBidTotal(highestBid, listing.areaSqFt))}
              </p>
              <p className="text-sm text-gray-500">₹{highestBid.toLocaleString('en-IN')}/sq.ft</p>
            </div>
            <span className="text-xs font-medium text-gray-400">{getTimeRemaining(listing)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
