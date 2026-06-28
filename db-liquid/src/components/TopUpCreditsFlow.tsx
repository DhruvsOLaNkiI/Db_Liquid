import { useState } from 'react';
import { Check, Coins, Loader2, Minus, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_TOP_UP_CREDITS,
  formatCreditPrice,
  getTopUpPrice,
  MAX_TOP_UP_CREDITS,
  MIN_TOP_UP_CREDITS,
  PRICE_PER_CREDIT_INR,
  TOP_UP_CREDIT_STEP,
} from '../types/credits';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  compact?: boolean;
  /** Extra-small layout for header dropdown */
  mini?: boolean;
};

export function TopUpCreditsFlow({ onClose, onSuccess, compact, mini }: Props) {
  const { topUpCredits } = useAuth();
  const [creditCount, setCreditCount] = useState(DEFAULT_TOP_UP_CREDITS);
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  const totalPrice = getTopUpPrice(creditCount);

  function decrease() {
    setCreditCount((n) => Math.max(MIN_TOP_UP_CREDITS, n - TOP_UP_CREDIT_STEP));
    setPaid(false);
    setError('');
  }

  function increase() {
    setCreditCount((n) => Math.min(MAX_TOP_UP_CREDITS, n + TOP_UP_CREDIT_STEP));
    setPaid(false);
    setError('');
  }

  async function handleProceedToPay() {
    setError('');
    setIsPaying(true);
    try {
      // Prototype: simulate payment delay, then add credits to account.
      await new Promise((resolve) => setTimeout(resolve, 800));
      const result = await topUpCredits(creditCount);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPaid(true);
      onSuccess?.();
      if (onClose) {
        window.setTimeout(() => {
          onClose();
        }, 1200);
      }
    } finally {
      setIsPaying(false);
    }
  }

  if (paid) {
    return (
      <div
        className={`rounded-xl border border-green-200 bg-green-50 ${
          mini ? 'p-2.5' : compact ? 'p-4' : 'p-4 mt-4'
        }`}
      >
        <p className={`font-semibold text-green-800 flex items-center gap-2 ${mini ? 'text-xs' : 'text-sm'}`}>
          <Check size={mini ? 14 : 18} />
          {creditCount} credit{creditCount !== 1 ? 's' : ''} added!
        </p>
      </div>
    );
  }

  if (mini) {
    return (
      <div className="space-y-2.5">
        <p className="text-[10px] text-gray-500">
          {formatCreditPrice(PRICE_PER_CREDIT_INR)}/credit · 1 credit per bid
        </p>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={decrease}
            disabled={creditCount <= MIN_TOP_UP_CREDITS || isPaying}
            aria-label="Decrease credits"
            className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            <Minus size={14} />
          </button>

          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
              <Coins size={16} className="text-amber-600" />
              {creditCount}
            </p>
            <p className="text-[10px] text-gray-500">credits · {formatCreditPrice(totalPrice)}</p>
          </div>

          <button
            type="button"
            onClick={increase}
            disabled={creditCount >= MAX_TOP_UP_CREDITS || isPaying}
            aria-label="Increase credits"
            className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={() => void handleProceedToPay()}
          disabled={isPaying}
          className="w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
        >
          {isPaying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing…
            </>
          ) : (
            <>Proceed to pay · {formatCreditPrice(totalPrice)}</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-amber-300 bg-white p-4 shadow-sm ${compact ? '' : 'mt-4'}`}>
      <p className="text-sm font-semibold text-gray-900 mb-1">Select credits to purchase</p>
      <p className="text-xs text-gray-500 mb-4">
        {formatCreditPrice(PRICE_PER_CREDIT_INR)} per credit · each bid uses 1 credit
      </p>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          type="button"
          onClick={decrease}
          disabled={creditCount <= MIN_TOP_UP_CREDITS || isPaying}
          aria-label="Decrease credits"
          className="w-11 h-11 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Minus size={18} />
        </button>

        <div className="text-center min-w-[120px]">
          <p className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-1.5">
            <Coins size={22} className="text-amber-600" />
            {creditCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            credit{creditCount !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={increase}
          disabled={creditCount >= MAX_TOP_UP_CREDITS || isPaying}
          aria-label="Increase credits"
          className="w-11 h-11 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Credits selected</span>
          <span className="font-medium text-gray-900">{creditCount}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Rate</span>
          <span>{formatCreditPrice(PRICE_PER_CREDIT_INR)}/credit</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-gray-900">
          <span>Total</span>
          <span>{formatCreditPrice(totalPrice)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        type="button"
        onClick={() => void handleProceedToPay()}
        disabled={isPaying}
        className="w-full py-3.5 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {isPaying ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Processing payment…
          </>
        ) : (
          <>Proceed to pay · {formatCreditPrice(totalPrice)}</>
        )}
      </button>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={isPaying}
          className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
