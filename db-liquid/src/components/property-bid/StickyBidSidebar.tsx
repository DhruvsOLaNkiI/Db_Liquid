import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Loader2, MessageCircle, Zap } from 'lucide-react';
import { BidAmountSlider } from './BidAmountSlider';
import { BuyerTokenPanel } from './BuyerTokenPanel';
import type { PropertyListing } from '../../types/listing';
import { formatPrice, formatPriceShort } from '../../types/listing';
import { getCurrentHighestBidTotal, getListedPriceTotal, getTimeRemainingDetailed } from '../../utils/listingDisplay';

type Props = {
  listing: PropertyListing;
  open: boolean;
  status: 'active' | 'accepted' | 'closed';
  buyerCredits: number;
  loggedInBuyer: boolean;
  bidAmount: string;
  error: string;
  success: boolean;
  isSubmitting: boolean;
  minBid: number;
  recommendedBid: number;
  isWinningBuyer: boolean;
  isChatEnabled: boolean;
  showBuyerTokenStep: boolean;
  wasDeclinedBySeller?: boolean;
  tokenMessage?: string;
  onPayToken: () => void;
  onSkipToken?: () => void;
  onBidChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFastBid: () => void;
  onSelectRecommended: () => void;
};

export function StickyBidSidebar({
  listing,
  open,
  status,
  buyerCredits,
  loggedInBuyer,
  bidAmount,
  error,
  success,
  isSubmitting,
  minBid,
  recommendedBid,
  isWinningBuyer,
  isChatEnabled,
  showBuyerTokenStep,
  wasDeclinedBySeller,
  tokenMessage,
  onPayToken,
  onSkipToken,
  onBidChange,
  onSubmit,
  onFastBid,
  onSelectRecommended,
}: Props) {
  const listedTotal = getListedPriceTotal(listing);
  const currentBidTotal = getCurrentHighestBidTotal(listing);
  const liveLabel = status === 'accepted' ? 'On Hold' : open ? 'LIVE' : 'CLOSED';

  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
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
            {status === 'accepted' ? 'On Hold' : getTimeRemainingDetailed(listing)}
          </span>
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-[#E5E7EB]">
          <div>
            <p className="text-[15px] font-medium text-gray-500 mb-1">Ask Bid</p>
            <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(listedTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">{formatPriceShort(listedTotal)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Current Bid</p>
            <p className="text-lg font-semibold text-gray-600">{formatPrice(currentBidTotal)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatPriceShort(currentBidTotal)}</p>
          </div>
        </div>

        {!loggedInBuyer && open && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">Log in to place a bid.</p>
            <div className="flex gap-2">
              <Link
                to={`/login?next=${encodeURIComponent(`/browse-property/${listing.id}`)}`}
                className="flex-1 text-center py-2.5 bg-[#0F172A] text-white rounded-[14px] text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                to={`/signup?next=${encodeURIComponent(`/browse-property/${listing.id}`)}`}
                className="flex-1 text-center py-2.5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}

        {loggedInBuyer && open && (
          <form onSubmit={onSubmit} className="space-y-4">
              <BidAmountSlider
                minBid={minBid}
                recommendedBid={recommendedBid}
                bidAmount={bidAmount}
                areaSqFt={listing.areaSqFt}
                onChange={onBidChange}
                onSelectRecommended={onSelectRecommended}
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check size={16} />
                  Bid placed successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || buyerCredits < 1}
                className="w-full py-3.5 bg-[#0F172A] text-white rounded-[14px] text-base font-semibold hover:bg-slate-800 transition-all duration-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                Place Bid
              </button>
              <button
                type="button"
                onClick={onFastBid}
                disabled={isSubmitting || buyerCredits < 1}
                className="w-full py-3.5 border border-[#E5E7EB] text-[#0F172A] rounded-[14px] text-base font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                Fast Bid
              </button>
            </form>
        )}

        {tokenMessage && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-3 mt-4">
            {tokenMessage}
          </p>
        )}

        {isWinningBuyer && isChatEnabled && (
          <Link
            to={`/deal/${listing.id}/chat`}
            className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-green-600 text-white rounded-[14px] font-semibold hover:bg-green-700 transition-colors"
          >
            <MessageCircle size={18} />
            Chat with seller
          </Link>
        )}

        {wasDeclinedBySeller && open && loggedInBuyer && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mt-4 text-center">
            The seller declined your bid. You can place a new offer if bidding is still open.
          </p>
        )}

        {status === 'accepted' && isWinningBuyer && showBuyerTokenStep && (
          <BuyerTokenPanel onPay={onPayToken} onSkip={onSkipToken} />
        )}

        {status === 'accepted' && isWinningBuyer && !isChatEnabled && !showBuyerTokenStep && (
          <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3 mt-4 text-center">
            Your bid was accepted! Complete the token step to start chatting with the seller.
          </p>
        )}

        {status === 'accepted' && loggedInBuyer && !isWinningBuyer && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 mt-4 text-center">
            This property has been sold. Bidding is closed.
          </p>
        )}

        {!open && status !== 'accepted' && (
          <p className="text-sm text-gray-500 text-center py-4">Bidding has ended for this property.</p>
        )}
      </div>
    </aside>
  );
}
