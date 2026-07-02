import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';
import { formatPriceShort } from '../../types/listing';

type Props = {
  listingId: string;
  open: boolean;
  loggedInBuyer: boolean;
  isSubmitting: boolean;
  buyerCredits: number;
  currentBidTotal: number;
  onPlaceBid: () => void;
};

export function MobileBidBar({
  listingId,
  open,
  loggedInBuyer,
  isSubmitting,
  buyerCredits,
  currentBidTotal,
  onPlaceBid,
}: Props) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Current bid</p>
          <p className="text-lg font-bold text-[#0F172A] truncate">{formatPriceShort(currentBidTotal)}</p>
        </div>
        {!loggedInBuyer ? (
          <Link
            to={`/login?next=${encodeURIComponent(`/browse-property/${listingId}`)}`}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-[#0F172A] text-white rounded-xl text-sm font-semibold"
          >
            <Gavel size={16} />
            Log in to bid
          </Link>
        ) : (
          <button
            type="button"
            onClick={onPlaceBid}
            disabled={isSubmitting || buyerCredits < 1}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-[#0F172A] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
          >
            <Gavel size={16} />
            Place Bid
          </button>
        )}
      </div>
    </div>
  );
}
