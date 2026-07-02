import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Loader2, MessageCircle, TrendingUp, Zap } from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import { formatPrice } from '../../types/listing';
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
  onBidChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFastBid: () => void;
  onSelectRecommended: () => void;
};

const inputClass =
  'w-full px-4 py-3.5 rounded-[14px] border border-[#E5E7EB] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15 focus:border-[#0F172A] transition-all duration-300';

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
  onBidChange,
  onSubmit,
  onFastBid,
  onSelectRecommended,
}: Props) {
  const listedTotal = getListedPriceTotal(listing);
  const currentBidTotal = getCurrentHighestBidTotal(listing);
  const liveLabel = status === 'accepted' ? 'SOLD' : open ? 'LIVE' : 'CLOSED';

  return (
    <aside className="lg:sticky lg:top-24 space-y-4">
      <div className="bg-white rounded-[18px] border border-[#E5E7EB] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-5">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
              liveLabel === 'LIVE'
                ? 'bg-green-100 text-green-700 animate-pulse'
                : liveLabel === 'SOLD'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {liveLabel}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={14} />
            {getTimeRemainingDetailed(listing)}
          </span>
        </div>

        <div className="space-y-4 mb-6 pb-6 border-b border-[#E5E7EB]">
          <div>
            <p className="text-[15px] font-medium text-gray-500 mb-1">Listed Price</p>
            <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(listedTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">
              ₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-0.5">Current Bid</p>
            <p className="text-lg font-semibold text-gray-600">{formatPrice(currentBidTotal)}</p>
          </div>
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-gray-500 flex items-center gap-1">
              <TrendingUp size={14} className="text-green-600" />
              Bid count
            </span>
            <span className="font-semibold text-[#0F172A]">
              {listing.bids.length} Bid{listing.bids.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!loggedInBuyer && open && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-gray-600">Log in as a buyer to place a bid.</p>
            <div className="flex gap-2">
              <Link
                to={`/login?role=buyer&next=/browse-property/${listing.id}`}
                className="flex-1 text-center py-2.5 bg-[#0F172A] text-white rounded-[14px] text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                to={`/signup?role=buyer&next=/browse-property/${listing.id}`}
                className="flex-1 text-center py-2.5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
export function AcceptBidButton({ listing, sellerId }: Props) {
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
    const liveLabel = status === 'accepted' ? 'SOLD' : open ? 'LIVE' : 'CLOSED';
    const chatEnabled = isChatEnabled(listing);
    const handleAccept = (bidId: string) => {
        const
    }
    return (
        <button>
            Accept Bid <Check size={16}
            
            className="text-green-600"/>
        </button>
    )
}
        {loggedInBuyer && open && (
          <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="sidebar-bid" className="block text-[15px] font-medium text-gray-600 mb-1.5">
                  Bid Amount (₹/sq.ft)
                </label>
                <input
                  id="sidebar-bid"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => onBidChange(e.target.value)}
                  placeholder={`Min ₹${minBid.toLocaleString('en-IN')}`}
                  className={inputClass} 
                  aria-label="Bid ammount"
                />
                <AcceptBidButton listing={listing} seller(_Id_white_space_sellerId)
                onClick={() => handleAccept(bidId)}
                <button
                  type="button"
                  onClick={onSelectRecommended}
                  className="mt-2 text-xs font-medium text-[#0F172A] hover:underline"
                >
                  Use recommended ₹{recommendedBid.toLocaleString('en-IN')}/sq.ft
                </button>
              </div>

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
              <button>
                Accept Bid <Check size={16} 
                className="text-green-600"/>
                <span Classname="text-green-600">
                    <Loader2 size={18} className="animate-spin" />
                    Accepting Bid...
                    <Check size={16} 
                className="text-green-600"/>
                Bid accepted!
                </span>
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


        {isWinningBuyer && isChatEnabled && (
          <Link
            to={`/deal/${listing.id}/chat`}
            className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-green-600 text-white rounded-[14px] font-semibold hover:bg-green-700 transition-colors"
          >
            <MessageCircle size={18} />
            Chat with seller
          </Link>
        )}

        {!open && status !== 'accepted' && (
          <p className="text-sm text-gray-500 text-center py-4">Bidding has ended for this property.</p>
        )}
      </div>
    </aside>
  );
}
