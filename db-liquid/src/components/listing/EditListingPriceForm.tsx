import { useState, type FormEvent } from 'react';
import { IndianRupee, Pencil } from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import {
  formatPrice,
  formatPriceShort,
  getListingStatus,
  getTotalPrice,
} from '../../types/listing';
import { useListings } from '../../context/ListingsContext';
import { perSqFtFromTotal } from '../../utils/listingDisplay';

export function canEditListingPrice(listing: PropertyListing, sellerId: string) {
  return getListingStatus(listing) === 'active' && listing.sellerId === sellerId;
}

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm';

type FormProps = {
  listing: PropertyListing;
  sellerId: string;
  onSaved?: () => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function EditListingPriceForm({
  listing,
  sellerId,
  onSaved,
  onCancel,
  compact = false,
}: FormProps) {
  const { updateListingAskPrice } = useListings();
  const [pricePerSqFt, setPricePerSqFt] = useState(String(listing.pricePerSqFt || ''));
  const [totalInput, setTotalInput] = useState(String(listing.totalPrice || ''));
  const [mode, setMode] = useState<'perSqFt' | 'total'>('total');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedPerSqFt = Number(pricePerSqFt);
  const parsedTotal = Number(totalInput.replace(/,/g, ''));
  const previewTotal =
    mode === 'total' && parsedTotal > 0
      ? parsedTotal
      : getTotalPrice(pricePerSqFt, listing.areaSqFt);
  const previewPerSqFt =
    mode === 'total' && parsedTotal > 0
      ? perSqFtFromTotal(parsedTotal, listing.areaSqFt)
      : parsedPerSqFt;

  const handlePerSqFtChange = (value: string) => {
    setMode('perSqFt');
    setPricePerSqFt(value);
    const total = getTotalPrice(value, listing.areaSqFt);
    if (total > 0) setTotalInput(String(total));
  };

  const handleTotalChange = (value: string) => {
    setMode('total');
    const cleaned = value.replace(/,/g, '').replace(/[^\d]/g, '');
    setTotalInput(cleaned);
    if (cleaned) {
      const perSqFt = perSqFtFromTotal(Number(cleaned), listing.areaSqFt);
      setPricePerSqFt(String(perSqFt));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const nextPerSqFt = previewPerSqFt;
    if (!nextPerSqFt || nextPerSqFt <= 0) {
      setError('Enter a valid price.');
      return;
    }

    setSaving(true);
    const result = updateListingAskPrice(listing.id, sellerId, nextPerSqFt);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSaved?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-primary/20 bg-primary/5 ${
        compact ? 'p-3 space-y-3' : 'p-4 space-y-4'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <IndianRupee size={16} className="text-primary" />
        Update ask bid
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Total ask price</label>
          <input
            type="text"
            inputMode="numeric"
            value={totalInput}
            onChange={(e) => handleTotalChange(e.target.value)}
            placeholder="e.g. 25000000"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Per sq.ft ({listing.areaSqFt.toLocaleString('en-IN')} sq.ft)
          </label>
          <input
            type="number"
            value={pricePerSqFt}
            onChange={(e) => handlePerSqFtChange(e.target.value)}
            placeholder="₹ per sq.ft"
            className={inputClass}
            min={1}
          />
        </div>
      </div>

      {previewTotal > 0 && (
        <p className="text-sm text-gray-600">
          Preview: <span className="font-semibold text-gray-900">{formatPriceShort(previewTotal)}</span>
          <span className="text-gray-400 mx-1">·</span>
          {formatPrice(previewTotal)}
          <span className="text-gray-400 mx-1">·</span>
          ₹{previewPerSqFt.toLocaleString('en-IN')}/sq.ft
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-white transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving || previewPerSqFt <= 0}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save ask price'}
        </button>
      </div>
    </form>
  );
}

type TriggerProps = {
  listing: PropertyListing;
  sellerId: string;
  className?: string;
};

export function EditListingPriceTrigger({ listing, sellerId, className = '' }: TriggerProps) {
  const [open, setOpen] = useState(false);
  const canEdit = canEditListingPrice(listing, sellerId);

  if (!canEdit) return null;

  return (
    <div className={className}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-gray-800 transition-colors"
        >
          <Pencil size={11} />
          Edit price
        </button>
      ) : null}
      {open && (
        <div className="mt-4">
          <EditListingPriceForm
            listing={listing}
            sellerId={sellerId}
            onSaved={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
