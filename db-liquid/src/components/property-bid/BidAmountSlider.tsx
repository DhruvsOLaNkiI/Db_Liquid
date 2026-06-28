import { useEffect, useRef, type CSSProperties } from 'react';
import { formatPrice, getBidTotal, MIN_BID_INCREMENT } from '../../types/listing';

type Props = {
  minBid: number;
  recommendedBid: number;
  bidAmount: string;
  areaSqFt: number;
  onChange: (value: string) => void;
  onSelectRecommended: () => void;
};

function getSliderMax(minBid: number) {
  return minBid + Math.max(10_000, Math.round(minBid * 0.15));
}

export function BidAmountSlider({
  minBid,
  recommendedBid,
  bidAmount,
  areaSqFt,
  onChange,
  onSelectRecommended,
}: Props) {
  const initialized = useRef(false);
  const sliderMax = getSliderMax(minBid);
  const parsed = Number(bidAmount);
  const currentValue =
    bidAmount && parsed >= minBid && parsed <= sliderMax
      ? parsed
      : bidAmount && parsed > sliderMax
        ? sliderMax
        : minBid;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!bidAmount || parsed < minBid) {
      onChange(String(recommendedBid));
    }
  }, [bidAmount, minBid, parsed, recommendedBid, onChange]);

  const total = getBidTotal(currentValue, areaSqFt);
  const progress = ((currentValue - minBid) / (sliderMax - minBid)) * 100;

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <label htmlFor="sidebar-bid-slider" className="text-[15px] font-medium text-gray-600">
          Bid Amount (₹/sq.ft)
        </label>
        <button
          type="button"
          onClick={onSelectRecommended}
          className="text-xs font-medium text-[#0F172A] hover:underline"
        >
          Use recommended
        </button>
      </div>

      <div className="rounded-[14px] border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 mb-4">
        <p className="text-2xl font-bold text-[#0F172A]">{formatPrice(total)}</p>
        <p className="text-xs text-gray-500 mt-1">
          ₹{currentValue.toLocaleString('en-IN')}/sq.ft
        </p>
      </div>

      <input
        id="sidebar-bid-slider"
        type="range"
        min={minBid}
        max={sliderMax}
        step={MIN_BID_INCREMENT}
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        style={{ '--slider-progress': `${progress}%` } as CSSProperties}
        className="bid-slider w-full"
        aria-valuemin={minBid}
        aria-valuemax={sliderMax}
        aria-valuenow={currentValue}
        aria-label="Bid amount per square foot"
      />

      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 px-0.5">
        <span>₹{minBid.toLocaleString('en-IN')}</span>
        <span>₹{sliderMax.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
