import { ArrowDownCircle, ArrowUpCircle, Coins, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { formatCreditPrice } from '../types/credits';
import { getCreditsAdded, getCreditsSpent } from '../utils/creditTransactions';
import { TopUpCreditsFlow } from './TopUpCreditsFlow';

type Props = {
  onClose: () => void;
};

type Tab = 'buy' | 'added' | 'spent';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CreditWalletPanel({ onClose }: Props) {
  const { id: listingId } = useParams();
  const { getListingById } = useListings();
  const { buyerCredits, creditHistory, syncCreditWallet } = useAuth();
  const [tab, setTab] = useState<Tab>('buy');
  const added = getCreditsAdded(creditHistory);
  const spent = getCreditsSpent(creditHistory);
  const listing = listingId ? getListingById(listingId) : undefined;
  const bidCount = listing ? listing.bids.length : spent.length;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'buy', label: 'Buy' },
    { id: 'added', label: 'Added', count: added.length },
    { id: 'spent', label: 'Spent', count: spent.length },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden w-[340px]">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <Coins size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm font-semibold text-gray-900 truncate">Credit wallet</p>
          <span className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            {buyerCredits}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close credit wallet"
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between text-sm bg-white">
        <span className="text-gray-500 flex items-center gap-1">
          <TrendingUp size={14} className="text-green-600" />
          Bid count
        </span>
        <span className="font-semibold text-[#0F172A]">
          {bidCount} Bid{bidCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              tab === id
                ? 'text-[#0F172A] border-b-2 border-[#0F172A] bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="ml-1 text-[10px] font-medium text-gray-400">({count})</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === 'buy' && (
          <TopUpCreditsFlow mini onSuccess={() => syncCreditWallet()} />
        )}

        {tab === 'added' && (
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-2 flex items-center gap-1">
              <ArrowUpCircle size={12} />
              Credits added
            </h3>
            {added.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                No top-ups yet.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {added.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-green-100 bg-green-50/60 px-2.5 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-green-900">+{tx.credits}</p>
                      <p className="text-[10px] text-green-800/80 truncate">{tx.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {tx.amountInr !== undefined && (
                        <p className="font-medium text-green-900">{formatCreditPrice(tx.amountInr)}</p>
                      )}
                      <p className="text-[10px] text-green-700/70">{formatWhen(tx.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'spent' && (
          <section>
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 mb-2 flex items-center gap-1">
              <ArrowDownCircle size={12} />
              Credits spent
            </h3>
            {spent.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                No bids yet. 1 credit per bid.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {spent.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-2.5 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-amber-900">−{tx.credits}</p>
                      <p className="text-[10px] text-amber-800/80 truncate">{tx.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-amber-700/70">{formatWhen(tx.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
