import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { TOKEN_AMOUNT, TOKEN_PLATFORM_FEE, TOKEN_TO_SELLER } from '../../types/deal';
import { formatPrice } from '../../types/listing';

type Step = 'enter' | 'processing' | 'success';

type Props = {
  open: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
};

function parseAmount(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function BuyerTokenPaymentModal({ open, onClose, onPaymentComplete }: Props) {
  const [step, setStep] = useState<Step>('enter');
  const [amountInput, setAmountInput] = useState(String(TOKEN_AMOUNT));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('enter');
      setAmountInput(String(TOKEN_AMOUNT));
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (step !== 'processing') return;
    const timer = window.setTimeout(() => setStep('success'), 900);
    return () => window.clearTimeout(timer);
  }, [step]);

  if (!open) return null;

  const handleProceed = () => {
    const amount = parseAmount(amountInput);
    if (amount !== TOKEN_AMOUNT) {
      setError(`Enter the full token amount of ${formatPrice(TOKEN_AMOUNT)}`);
      return;
    }
    setError('');
    setStep('processing');
  };

  const handleContinue = () => {
    onPaymentComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={step === 'processing' ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={step === 'processing'}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {step === 'enter' && (
          <>
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">Pay token amount</h2>
            <p className="text-sm text-gray-500 mb-5">
              Enter the amount to unlock chat with the seller.
            </p>

            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Enter amount
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value.replace(/[^\d,]/g, ''));
                  setError('');
                }}
                className="w-full pl-9 pr-4 py-3.5 border border-[#E5E7EB] rounded-[14px] text-lg font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
                placeholder={TOKEN_AMOUNT.toLocaleString('en-IN')}
              />
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="bg-[#FAFAFA] rounded-xl p-3 space-y-1.5 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">To seller</span>
                <span className="font-semibold">{formatPrice(TOKEN_TO_SELLER)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee</span>
                <span className="font-semibold">{formatPrice(TOKEN_PLATFORM_FEE)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200 font-bold">
                <span>Total due</span>
                <span>{formatPrice(TOKEN_AMOUNT)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceed}
              className="w-full py-3.5 bg-[#0F172A] text-white rounded-[14px] text-base font-semibold hover:bg-slate-800 transition-colors"
            >
              Proceed
            </button>
          </>
        )}

        {step === 'processing' && (
          <div className="py-10 flex flex-col items-center text-center">
            <Loader2 size={40} className="text-[#0F172A] animate-spin mb-4" />
            <p className="text-lg font-semibold text-[#0F172A]">Processing payment…</p>
            <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-1">Payment Successful</h2>
            <p className="text-sm text-gray-500 mb-6">
              {formatPrice(TOKEN_AMOUNT)} token paid. You can now chat with the seller.
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-3.5 bg-green-600 text-white rounded-[14px] text-base font-semibold hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
