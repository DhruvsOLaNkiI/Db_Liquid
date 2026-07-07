import { useState } from 'react';
import { Check } from 'lucide-react';
import { TOKEN_AMOUNT, TOKEN_PLATFORM_FEE, TOKEN_TO_SELLER } from '../../types/deal';
import { formatPrice } from '../../types/listing';
import { BuyerTokenPaymentModal } from './BuyerTokenPaymentModal';

type Props = {
  message?: string;
  onPay: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
};

export function BuyerTokenPanel({ message, onPay, onSkip, showSkip = true }: Props) {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <>
      <div className="glass-card-inner-orange rounded-xl p-4 mt-4">
        <div className="flex items-start gap-2 mb-3">
          <Check className="text-orange-300 shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-semibold text-white">
            {message ?? 'Your bid was accepted! Pay the token to unlock chat with the seller.'}
          </p>
        </div>

        <p className="text-xs font-semibold text-white/80 mb-2">Token amount</p>
        <div className="bg-white/10 border border-white/15 rounded-lg p-3 space-y-1.5 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-white/65">To seller</span>
            <span className="font-semibold text-white">{formatPrice(TOKEN_TO_SELLER)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/65">Platform fee</span>
            <span className="font-semibold text-white">{formatPrice(TOKEN_PLATFORM_FEE)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-white/15 font-bold text-white">
            <span>Total</span>
            <span>{formatPrice(TOKEN_AMOUNT)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 py-2.5 bg-[#FF7A00] text-white rounded-[14px] text-sm font-semibold hover:bg-[#E66E00] transition-colors"
          >
            Proceed to pay
          </button>
          {showSkip && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2.5 border border-white/25 text-white rounded-[14px] text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>

      <BuyerTokenPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentComplete={onPay}
      />
    </>
  );
}
