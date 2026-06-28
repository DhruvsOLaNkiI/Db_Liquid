import { UserX } from 'lucide-react';
import { useState } from 'react';
import { useListings } from '../../context/ListingsContext';

type Props = {
  listingId: string;
  sellerId: string;
  buyerName: string;
  onDeclined?: () => void;
  className?: string;
};

export function SellerDeclineBuyerButton({
  listingId,
  sellerId,
  buyerName,
  onDeclined,
  className = '',
}: Props) {
  const { declineAcceptedBuyer } = useListings();
  const [busy, setBusy] = useState(false);

  function handleDecline() {
    const confirmed = window.confirm(
      `Decline ${buyerName} and remove this deal? Bidding will reopen and their bid will be removed.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const result = declineAcceptedBuyer(listingId, sellerId);
    setBusy(false);

    if (result.ok) {
      onDeclined?.();
    } else {
      window.alert(result.error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDecline}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 w-full py-2.5 border border-red-200 text-red-700 rounded-[14px] text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 ${className}`}
    >
      <UserX size={16} />
      {busy ? 'Removing…' : 'Decline buyer'}
    </button>
  );
}
