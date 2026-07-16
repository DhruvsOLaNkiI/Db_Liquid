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
  recommendedBidTotal: number;
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
  recommendedBidTotal,
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
    <aside id="bid-panel" className="scroll-mt-24 lg:sticky lg:top-24 space-y-4">
      <div className="glass-card rounded-[18px] p-5 sm:p-6">
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
          <span className="text-xs text-white/70 flex items-center gap-1">
            <Clock size={14} />
            {status === 'accepted' ? 'On Hold' : getTimeRemainingDetailed(listing)}
          </span>
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <p className="text-[15px] font-medium text-white/75 mb-1">Ask Bid</p>
            <p className="text-2xl font-bold text-white">{formatPrice(listedTotal)}</p>
            <p className="text-xs text-white/65 mt-1">{formatPriceShort(listedTotal)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/75 mb-0.5">Current Bid</p>
            {listing.bids.length > 0 ? (
              <>
                <p className="text-lg font-semibold text-white">{formatPrice(currentBidTotal)}</p>
                <p className="text-xs text-white/65 mt-0.5">{formatPriceShort(currentBidTotal)}</p>
              </>
            ) : (
              <p className="text-lg font-semibold text-white/65">No bids yet</p>
            )}
          </div>
        </div>

        {!loggedInBuyer && open && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-white/70">Log in to place a bid.</p>
            <div className="flex gap-2">
              <Link
                to={`/login?next=${encodeURIComponent(`/browse-property/${listing.id}`)}`}
                className="flex-1 text-center py-2.5 bg-[#FF7A00] text-white rounded-[14px] text-sm font-semibold hover:bg-[#E66E00] transition-colors"
              >
                Log in
              </Link>
              <Link
                to={`/signup?next=${encodeURIComponent(`/browse-property/${listing.id}`)}`}
                className="flex-1 text-center py-2.5 border border-white/20 text-white rounded-[14px] text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}

        {loggedInBuyer && open && (
          <form onSubmit={onSubmit} className="space-y-4">
              <BidAmountSlider
                recommendedBidTotal={recommendedBidTotal}
                bidAmount={bidAmount}
                onChange={onBidChange}
                onSelectRecommended={onSelectRecommended}
              />

              {error && <p className="text-sm text-red-300">{error}</p>}
              {buyerCredits < 1 && (
                <p className="text-sm text-amber-100 bg-amber-400/15 border border-amber-300/35 rounded-xl px-3 py-3">
                  You need at least 1 credit to place a bid. Click the{' '}
                  <span className="font-semibold text-white">coins icon ({buyerCredits})</span> in the header to top up.
                </p>
              )}
              {success && (
                <p className="text-sm text-green-300 flex items-center gap-1">
                  <Check size={16} />
                  Bid placed successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || buyerCredits < 1}
                className="w-full py-3.5 bg-[#FF7A00] text-white rounded-[14px] text-base font-semibold hover:bg-[#E66E00] transition-all duration-300 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                Place Bid
              </button>
              <button
                type="button"
                onClick={onFastBid}
                disabled={isSubmitting || buyerCredits < 1}
                className="w-full py-3.5 border border-white/20 text-white rounded-[14px] text-base font-semibold hover:bg-white/10 transition-all duration-300 disabled:opacity-40 inline-flex items-center justify-center gap-2"
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
          <p className="text-sm text-amber-100 bg-amber-400/15 border border-amber-300/35 rounded-xl px-3 py-3 mt-4 text-center">
            The seller declined your bid. You can place a new offer if bidding is still open.
          </p>
        )}

        {status === 'accepted' && isWinningBuyer && showBuyerTokenStep && (
          <BuyerTokenPanel onPay={onPayToken} onSkip={onSkipToken} />
        )}

        {status === 'accepted' && isWinningBuyer && !isChatEnabled && !showBuyerTokenStep && (
          <p className="text-sm text-orange-100 bg-orange-400/15 border border-orange-300/35 rounded-xl px-3 py-3 mt-4 text-center">
            Your bid was accepted! Complete the token step to start chatting with the seller.
          </p>
        )}

        {status === 'accepted' && loggedInBuyer && !isWinningBuyer && (
          <p className="text-sm text-white/80 glass-card-inner rounded-xl px-3 py-3 mt-4 text-center">
            This property has been sold. Bidding is closed.
          </p>
        )}

        {!open && status !== 'accepted' && (
          <p className="text-sm text-white/70 text-center py-4">Bidding has ended for this property.</p>
        )}
      </div>
    </aside>
  );
}
