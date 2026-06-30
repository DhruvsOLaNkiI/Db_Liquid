import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, MessageCircle, TrendingUp, Users } from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import {
  formatPrice,
  getAcceptedBid,
  getBidTotal,
  getHighestBidPerSqFt,
  getListingStatus,
  isBuyerTokenDue,
  isChatEnabled,
} from '../../types/listing';
import { useListings } from '../../context/ListingsContext';
import { SellerDeclineBuyerButton } from './SellerDeclineBuyerButton';
import { getCurrentHighestBidTotal, getListedPriceTotal, getTimeRemainingDetailed } from '../../utils/listingDisplay';

type Props = {
  listing: PropertyListing;
  sellerId: string;
};

export function SellerDealSidebar({ listing, sellerId }: Props) {
  const { acceptBid } = useListings();
  const [message, setMessage] = useState('');
  const [showBids, setShowBids] = useState(false);

  const status = getListingStatus(listing);
  const open = status === 'active';
  const acceptedBid = getAcceptedBid(listing);
  const listedTotal = getListedPriceTotal(listing);
  const currentBidTotal = getCurrentHighestBidTotal(listing);
  const highestBid = getHighestBidPerSqFt(listing);
  const sortedBids = [...listing.bids].sort((a, b) => b.amountPerSqFt - a.amountPerSqFt);
  const liveLabel = status === 'accepted' ? 'On Hold' : open ? 'LIVE' : 'CLOSED';
  const chatEnabled = isChatEnabled(listing);
  const awaitingBuyerToken = isBuyerTokenDue(listing);

  const handleAccept = (bidId: string) => {
    const result = acceptBid(listing.id, bidId, sellerId);
    setMessage(
      result.ok
        ? 'Bid accepted! The buyer will pay the token amount to unlock chat.'
        : result.error,
    );
  };

  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full">
            Your listing
          </span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
              liveLabel === 'LIVE'
                ? 'bg-green-100 text-green-700 animate-pulse'
                : liveLabel === 'On Hold'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {liveLabel}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={14} />
            {status === 'accepted' ? 'Bid accepted' : getTimeRemainingDetailed(listing)}
          </span>
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-[#E5E7EB]">
          <div>
            <p className="text-[15px] font-medium text-gray-500 mb-1">Ask Bid</p>
            <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(listedTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">
              ₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Current Bid</p>
            <p className="text-lg font-semibold text-gray-600">{formatPrice(currentBidTotal)}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {listing.bids.length} bid{listing.bids.length !== 1 ? 's' : ''}
            </span>
            {listing.bids.length > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                ₹{highestBid.toLocaleString('en-IN')}/sq.ft
              </span>
            )}
          </div>
        </div>

        {message && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-4">
            {message}
          </p>
        )}

        {acceptedBid && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Check className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-blue-900 text-sm">
                  Accepted: {acceptedBid.bidderName}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {formatPrice(getBidTotal(acceptedBid.amountPerSqFt, listing.areaSqFt))} · ₹
                  {acceptedBid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft
                </p>
              </div>
            </div>

            {awaitingBuyerToken && (
              <p className="text-xs text-blue-800 mt-3 bg-white/70 rounded-lg px-3 py-2">
                Waiting for {acceptedBid.bidderName} to pay the token. Chat opens after payment.
              </p>
            )}

            {chatEnabled && (
              <Link
                to={`/seller/chat/${listing.id}`}
                className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 bg-green-600 text-white rounded-[14px] text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={16} />
                Chat with {acceptedBid.bidderName}
              </Link>
            )}

            <SellerDeclineBuyerButton
              listingId={listing.id}
              sellerId={sellerId}
              buyerName={acceptedBid.bidderName}
              className="mt-3"
            />
          </div>
        )}

        {open && listing.bids.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowBids((v) => !v)}
              className="text-sm font-medium text-[#0F172A] hover:underline"
            >
              {showBids ? 'Hide bids' : `Review ${listing.bids.length} bid${listing.bids.length !== 1 ? 's' : ''}`}
            </button>

            {showBids && (
              <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {sortedBids.map((bid, i) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{bid.bidderName}</p>
                      <p className="text-xs text-gray-500">
                        ₹{bid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft
                        {i === 0 && (
                          <span className="ml-1 text-green-700 font-medium">· Highest</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAccept(bid.id)}
                      className="shrink-0 px-3 py-1.5 bg-[#0F172A] text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {open && listing.bids.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2 mb-4">
            No bids yet. Share your listing with buyers.
          </p>
        )}

        {!open && status !== 'accepted' && (
          <p className="text-sm text-gray-500 text-center py-2">Bidding has ended.</p>
        )}

        <Link
          to="/seller/dashboard"
          className="block text-center text-sm font-medium text-gray-500 hover:text-[#0F172A] mt-2"
        >
          Open seller dashboard →
        </Link>
      </div>
    </aside>
  );
}
