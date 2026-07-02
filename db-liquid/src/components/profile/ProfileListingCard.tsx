import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock,
  ExternalLink,
  Gavel,
  MapPin,
  MessageCircle,
  Pencil,
  TrendingUp,
} from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import {
  formatPrice,
  formatPriceShort,
  getAcceptedBid,
  getBidCount,
  getBidTotal,
  getListingStatus,
  getTimeRemaining,
  isBuyerTokenDue,
  isChatEnabled,
} from '../../types/listing';
import {
  formatBuyerConfiguration,
  getCurrentHighestBidTotal,
  getDisplayListingId,
  getListedPriceTotal,
} from '../../utils/listingDisplay';
import { EditListingPriceForm, canEditListingPrice } from '../listing/EditListingPriceForm';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

function statusStyles(status: ReturnType<typeof getListingStatus>) {
  if (status === 'active') {
    return {
      label: 'Active',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      dot: 'bg-emerald-500',
    };
  }
  if (status === 'accepted') {
    return {
      label: 'On Hold',
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/10',
      dot: 'bg-amber-500',
    };
  }
  return {
    label: 'Closed',
    badge: 'bg-gray-100 text-gray-600 ring-gray-500/10',
    dot: 'bg-gray-400',
  };
}

export function ProfileListingCard({
  listing,
  sellerId,
}: {
  listing: PropertyListing;
  sellerId: string;
}) {
  const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
  const status = getListingStatus(listing);
  const statusMeta = statusStyles(status);
  const bidCount = getBidCount(listing);
  const askTotal = getListedPriceTotal(listing);
  const highestTotal = getCurrentHighestBidTotal(listing);
  const hasBids = bidCount > 0;
  const acceptedBid = getAcceptedBid(listing);
  const chatEnabled = isChatEnabled(listing);
  const tokenDue = isBuyerTokenDue(listing);
  const publishedLabel = new Date(listing.publishedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const [editingPrice, setEditingPrice] = useState(false);
  const canEditPrice = canEditListingPrice(listing, sellerId);

  return (
    <article className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex flex-col sm:flex-row">
        <Link
          to={`/browse-property/${listing.id}`}
          className="relative sm:w-44 md:w-52 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[168px] bg-gray-100 overflow-hidden"
        >
          <img
            src={listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex]}
            alt={listing.propertyType}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/5" />
          <span
            className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset ${statusMeta.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-[#0F172A]/85 text-white backdrop-blur-sm">
            <TrendingUp size={11} />
            {bidCount} bid{bidCount === 1 ? '' : 's'}
          </span>
        </Link>

        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                {listing.propertyType}
              </p>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg flex items-start gap-1.5 leading-snug">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{listing.location}</span>
              </h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {formatBuyerConfiguration(listing)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                {getDisplayListingId(listing.id)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Listed {publishedLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="rounded-xl bg-gray-50 px-3 py-2.5 border border-gray-100">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Ask bid</p>
                {canEditPrice && !editingPrice && (
                  <button
                    type="button"
                    onClick={() => setEditingPrice(true)}
                    className="text-[11px] font-medium text-primary hover:text-gray-800 transition-colors"
                  >
                    Edit price
                  </button>
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {formatPriceShort(askTotal)}
              </p>
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">{formatPrice(askTotal)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 flex items-center gap-1">
                <Gavel size={10} />
                Highest
              </p>
              {hasBids ? (
                <>
                  <p className="text-sm sm:text-base font-bold text-emerald-700 truncate">
                    {formatPriceShort(highestTotal)}
                  </p>
                  <p className="text-[10px] text-emerald-700/80 truncate hidden sm:block">
                    {formatPrice(highestTotal)}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-gray-400">No bids</p>
              )}
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5 border border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5 flex items-center gap-1">
                <Clock size={10} />
                Time left
              </p>
              <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {getTimeRemaining(listing)}
              </p>
              <p className="text-[10px] text-gray-500 truncate hidden sm:block">
                {status === 'closed' ? 'Bidding ended' : 'Until close'}
              </p>
            </div>
          </div>

          {editingPrice && (
            <EditListingPriceForm
              listing={listing}
              sellerId={sellerId}
              onSaved={() => setEditingPrice(false)}
              onCancel={() => setEditingPrice(false)}
            />
          )}

          {acceptedBid && (
            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-2.5 text-sm">
              <p className="font-medium text-amber-900">
                Accepted bid from {acceptedBid.bidderName}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {formatPrice(getBidTotal(acceptedBid.amountPerSqFt, listing.areaSqFt))}
                {tokenDue ? ' · Waiting for buyer token payment' : chatEnabled ? ' · Chat is open' : ''}
              </p>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <Link
              to={`/browse-property/${listing.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-gray-800 transition-colors"
            >
              View listing
              <ExternalLink size={14} />
            </Link>
            {canEditPrice && (
              <Link
                to={`/seller/listing/${listing.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={14} />
                Edit listing
              </Link>
            )}
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Manage bids
              <ArrowUpRight size={14} />
            </Link>
            {chatEnabled && acceptedBid && (
              <Link
                to={`/seller/chat/${listing.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle size={14} />
                Chat with buyer
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
