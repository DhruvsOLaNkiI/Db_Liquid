import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, MessageCircle, TrendingUp, Users } from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import {
  formatPrice,
  getAcceptedBid,
  getBidAmount,
  getListingStatus,
  isBuyerTokenDue,
  isChatEnabled,
  sortBidsByAmount,
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
  const sortedBids = sortBidsByAmount(listing.bids, listing.areaSqFt);
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
      <div className="glass-card rounded-[18px] p-6">
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full">
            Your listing
          </span>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
              liveLabel === 'LIVE'
                ? 'bg-green-500/20 text-green-300 animate-pulse'
                : liveLabel === 'On Hold'
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'bg-white/10 text-white/60'
            }`}
          >
            {liveLabel}
          </span>
          <span className="text-xs text-white/50 flex items-center gap-1">
            <Clock size={14} />
            {status === 'accepted' ? 'Bid accepted' : getTimeRemainingDetailed(listing)}
          </span>
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <p className="text-[15px] font-medium text-white/75 mb-1">Ask Bid</p>
            <p className="text-2xl font-bold text-white">{formatPrice(listedTotal)}</p>
            <p className="text-xs text-white/65 mt-1">
              ₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/75 mb-0.5">Current Bid</p>
            <p className="text-lg font-semibold text-white">{formatPrice(currentBidTotal)}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {listing.bids.length} bid{listing.bids.length !== 1 ? 's' : ''}
            </span>
            {listing.bids.length > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                {formatPrice(currentBidTotal)}
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
          <div className="glass-card-inner-orange rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <Check className="text-orange-300 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-white text-sm">
                  Accepted: {acceptedBid.bidderName}
                </p>
                <p className="text-xs text-white/80 mt-0.5">
                  {formatPrice(getBidAmount(acceptedBid, listing.areaSqFt))}
                </p>
              </div>
            </div>

            {awaitingBuyerToken && (
              <p className="text-xs text-white/90 mt-3 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
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
              className="text-sm font-medium text-white hover:text-[#FF7A00] hover:underline"
            >
              {showBids ? 'Hide bids' : `Review ${listing.bids.length} bid${listing.bids.length !== 1 ? 's' : ''}`}
            </button>

            {showBids && (
              <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {sortedBids.map((bid, i) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl glass-card-inner text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{bid.bidderName}</p>
                      <p className="text-xs text-white/75">
                        {formatPrice(getBidAmount(bid, listing.areaSqFt))}
                        {i === 0 && (
                          <span className="ml-1 text-green-300 font-medium">· Highest</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAccept(bid.id)}
                      className="shrink-0 px-3 py-1.5 bg-[#FF7A00] text-white rounded-full text-xs font-semibold hover:bg-[#E66E00] transition-colors"
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
          <p className="text-sm text-white/75 text-center py-2 mb-4">
            No bids yet. Share your listing with buyers.
          </p>
        )}

        {!open && status !== 'accepted' && (
          <p className="text-sm text-white/75 text-center py-2">Bidding has ended.</p>
        )}

        <Link
          to="/seller/dashboard"
          className="block text-center text-sm font-medium text-white/70 hover:text-white mt-2"
        >
          Open seller dashboard →
        </Link>
      </div>
    </aside>
  );
}
