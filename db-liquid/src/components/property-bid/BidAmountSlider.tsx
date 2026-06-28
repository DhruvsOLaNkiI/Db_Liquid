import { useEffect, useRef, useState } from 'react';
import { formatPrice, formatPriceShort, getBidTotal } from '../../types/listing';
import { perSqFtFromTotal } from '../../utils/listingDisplay';

type Props = {
  minBid: number;
  recommendedBid: number;
  bidAmount: string;
  areaSqFt: number;
  onChange: (value: string) => void;
  onSelectRecommended: () => void;
};

export function BidAmountSlider({
  minBid,
  recommendedBid,
  bidAmount,
  areaSqFt,
  onChange,
  onSelectRecommended,
}: Props) {
  const initialized = useRef(false);
  const isEditing = useRef(false);
  const minTotal = getBidTotal(minBid, areaSqFt);
  const recommendedTotal = getBidTotal(recommendedBid, areaSqFt);

  const parsed = Number(bidAmount);
  const currentTotal = getBidTotal(
    bidAmount && parsed >= minBid ? parsed : recommendedBid,
    areaSqFt,
  );

  const [totalInput, setTotalInput] = useState(
    bidAmount && parsed >= minBid ? String(currentTotal) : String(recommendedTotal),
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!bidAmount || parsed < minBid) {
      onChange(String(recommendedBid));
      setTotalInput(String(recommendedTotal));
    }
  }, [bidAmount, minBid, parsed, recommendedBid, recommendedTotal, onChange]);

  useEffect(() => {
    if (isEditing.current) return;
    if (bidAmount && parsed >= minBid) {
      setTotalInput(String(getBidTotal(parsed, areaSqFt)));
    }
  }, [bidAmount, parsed, areaSqFt, minBid]);

  function applyTotal(raw: string) {
    isEditing.current = true;
    const cleaned = raw.replace(/,/g, '').replace(/[^\d]/g, '');
    setTotalInput(cleaned);

    if (!cleaned) return;

    const total = Number(cleaned);
    if (!Number.isFinite(total) || total <= 0) return;

    const perSqFt = perSqFtFromTotal(total, areaSqFt);
    if (perSqFt >= minBid) {
      onChange(String(perSqFt));
    }
  }

  function finishEditing() {
    isEditing.current = false;
    const cleaned = totalInput.replace(/,/g, '').trim();
    const total = Number(cleaned);
    if (Number.isFinite(total) && total >= minTotal) {
      setTotalInput(String(total));
    }
  }

  const typedTotal = Number(totalInput.replace(/,/g, ''));
  const hasTypedAmount = totalInput.length > 0 && Number.isFinite(typedTotal) && typedTotal > 0;
  const previewTotal = hasTypedAmount ? typedTotal : currentTotal;
  const isValid = hasTypedAmount && typedTotal >= minTotal;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <label htmlFor="sidebar-bid-total" className="text-[15px] font-medium text-gray-600">
          Your offer (total)
        </label>
        <button
          type="button"
          onClick={() => {
            isEditing.current = false;
            onSelectRecommended();
            setTotalInput(String(recommendedTotal));
          }}
          className="text-xs font-medium text-[#0F172A] hover:underline"
        >
          Use recommended
        </button>
      </div>

      <div className="relative mb-2">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
          ₹
        </span>
        <input
          id="sidebar-bid-total"
          type="text"
          inputMode="numeric"
          value={totalInput}
          onChange={(e) => applyTotal(e.target.value)}
          onBlur={finishEditing}
          placeholder={String(recommendedTotal)}
          className="w-full pl-10 pr-4 py-3.5 text-xl font-bold rounded-[14px] border border-[#E5E7EB] bg-[#FAFAFA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/15 focus:border-[#0F172A] transition-all duration-300"
          aria-label="Total bid amount in rupees"
        />
      </div>

      <p
        className={`text-sm font-semibold ${isValid || !hasTypedAmount ? 'text-[#0F172A]' : 'text-amber-700'}`}
        title={formatPrice(previewTotal)}
      >
        {formatPriceShort(previewTotal)}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {hasTypedAmount && !isValid ? (
          <>Below minimum · min {formatPriceShort(minTotal)}</>
        ) : (
          <>Min {formatPriceShort(minTotal)} · {formatPrice(minTotal)}</>
        )}
      </p>
    </div>
  );
}
