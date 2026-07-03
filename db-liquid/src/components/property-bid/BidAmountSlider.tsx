import { useEffect, useRef, useState } from 'react';
import { formatPrice, formatPriceShort } from '../../types/listing';

type Props = {
  recommendedBidTotal: number;
  bidAmount: string;
  onChange: (value: string) => void;
  onSelectRecommended: () => void;
};

export function BidAmountSlider({
  recommendedBidTotal,
  bidAmount,
  onChange,
  onSelectRecommended,
}: Props) {
  const initialized = useRef(false);
  const isEditing = useRef(false);

  const parsed = Number(bidAmount);
  const [totalInput, setTotalInput] = useState(
    bidAmount && parsed > 0 ? bidAmount : '',
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!bidAmount) {
      setTotalInput('');
    }
  }, [bidAmount]);

  useEffect(() => {
    if (isEditing.current) return;
    if (bidAmount && parsed > 0) {
      setTotalInput(bidAmount);
    }
  }, [bidAmount, parsed]);

  function applyTotal(raw: string) {
    isEditing.current = true;
    const cleaned = raw.replace(/,/g, '').replace(/[^\d]/g, '');
    setTotalInput(cleaned);

    if (!cleaned) {
      onChange('');
      return;
    }

    const total = Number(cleaned);
    if (!Number.isFinite(total) || total <= 0) return;

    onChange(String(total));
  }

  function finishEditing() {
    isEditing.current = false;
    const cleaned = totalInput.replace(/,/g, '').trim();
    const total = Number(cleaned);
    if (Number.isFinite(total) && total > 0) {
      setTotalInput(String(total));
    }
  }

  const typedTotal = Number(totalInput.replace(/,/g, ''));
  const hasTypedAmount = totalInput.length > 0 && Number.isFinite(typedTotal) && typedTotal > 0;
  const previewTotal = hasTypedAmount ? typedTotal : recommendedBidTotal;
  const isValid = hasTypedAmount && typedTotal > 0;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <label htmlFor="sidebar-bid-total" className="text-[15px] font-medium text-white/80">
          Your offer (total)
        </label>
        <button
          type="button"
          onClick={() => {
            isEditing.current = false;
            onSelectRecommended();
            setTotalInput(String(recommendedBidTotal));
          }}
          className="text-xs font-medium text-[#FF7A00] hover:underline"
        >
          Use recommended
        </button>
      </div>

      <div className="relative mb-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-white/50">
          ₹
        </span>
        <input
          id="sidebar-bid-total"
          type="text"
          inputMode="numeric"
          value={totalInput}
          onChange={(e) => applyTotal(e.target.value)}
          onBlur={finishEditing}
          placeholder={String(recommendedBidTotal)}
          className="w-full pl-10 pr-4 py-3.5 text-xl font-bold rounded-[14px] border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30 focus:border-[#FF7A00] transition-all duration-300"
          aria-label="Total bid amount in rupees"
        />
      </div>

      <p
        className={`text-sm font-semibold ${isValid || !hasTypedAmount ? 'text-white' : 'text-amber-300'}`}
        title={formatPrice(previewTotal)}
      >
        {formatPriceShort(previewTotal)}
      </p>
      <p className="text-xs text-white/70 mt-1">
        {hasTypedAmount && !isValid ? (
          <>Enter an amount greater than ₹0</>
        ) : (
          <>Any amount greater than ₹0 is accepted</>
        )}
      </p>
    </div>
  );
}
