import { CheckCircle2, Clock3 } from 'lucide-react';
import type { PropertyListing } from '../../types/listing';
import { getActiveVerificationBadges, getVerificationReviewLabel } from '../../utils/listingDisplay';

export function VerificationBadges({ listing }: { listing: PropertyListing }) {
  const badges = getActiveVerificationBadges(listing);
  const reviewLabel = getVerificationReviewLabel(listing.verificationReviewStatus);

  if (listing.verificationReviewStatus === 'pending') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-900 text-sm font-medium border border-amber-200">
        <Clock3 size={16} className="shrink-0" />
        {reviewLabel ?? 'Documents under review'}
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <p className="text-sm text-white/80 glass-card-inner rounded-xl px-4 py-3">
        Verification badges will appear after document review.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reviewLabel && listing.verificationReviewStatus !== 'none' && (
        <p className="text-xs font-medium text-green-700">{reviewLabel}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {badges.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-500/15 text-green-300 text-sm font-medium border border-green-400/25"
          >
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
