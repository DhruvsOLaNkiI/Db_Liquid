import { useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TopUpCreditsFlow } from './TopUpCreditsFlow';
import { CREDIT_COST_PER_BID, DEFAULT_TOP_UP_CREDITS } from '../types/credits';
import { countUserBidsOnListing } from '../utils/buyerCredits';
import type { PropertyListing } from '../types/listing';

type Props = {
  listing?: PropertyListing;
  compact?: boolean;
};

export function BuyerCreditsPanel({ listing, compact }: Props) {
  const { user, hasRole, buyerCredits } = useAuth();
  const [showTopUp, setShowTopUp] = useState(false);

  if (!user || !hasRole('buyer')) return null;

  const bidsOnThisProperty = listing && user ? countUserBidsOnListing(listing.bids, user.id) : 0;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-full">
            <Coins size={14} />
            {buyerCredits} credit{buyerCredits !== 1 ? 's' : ''}
          </span>
          {!showTopUp && (
            <button
              type="button"
              onClick={() => setShowTopUp(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Top up
            </button>
          )}
        </div>
        {showTopUp && (
          <TopUpCreditsFlow compact onClose={() => setShowTopUp(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-amber-900 flex items-center gap-2">
            <Coins size={18} />
            Your bid credits: {buyerCredits}
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Each bid costs <strong>{CREDIT_COST_PER_BID} credit</strong>. Top up to add more credits
            (default pack: {DEFAULT_TOP_UP_CREDITS}).
          </p>
          {listing && bidsOnThisProperty > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              You have placed {bidsOnThisProperty} bid{bidsOnThisProperty !== 1 ? 's' : ''} on this
              property ({bidsOnThisProperty} credit{bidsOnThisProperty !== 1 ? 's' : ''} used).
            </p>
          )}
        </div>
        {!showTopUp && (
          <button
            type="button"
            onClick={() => setShowTopUp(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Top up
          </button>
        )}
      </div>

      {showTopUp && <TopUpCreditsFlow onClose={() => setShowTopUp(false)} />}

      {buyerCredits < CREDIT_COST_PER_BID && !showTopUp && (
        <p className="text-sm text-red-700 mt-3 font-medium">
          You need at least 1 credit to place a bid. Top up first.
        </p>
      )}
    </div>
  );
}
