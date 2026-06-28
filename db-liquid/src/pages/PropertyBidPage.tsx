import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { BidHistoryTimeline } from '../components/property-bid/BidHistoryTimeline';
import { PricingCards } from '../components/property-bid/PricingCards';
import { PropertyHeroCard } from '../components/property-bid/PropertyHeroCard';
import { StickyBidSidebar } from '../components/property-bid/StickyBidSidebar';
import { SellerDealSidebar } from '../components/property-bid/SellerDealSidebar';
import { VerificationBadges } from '../components/property-bid/VerificationBadges';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { setBuyerName, setBuyerPhone } from '../utils/buyer';
import { getBuyerCredits } from '../utils/buyerCredits';
import { resolveSellerId } from '../utils/seller';
import {
  formatPrice,
  getBidTotal,
  getListingStatus,
  getMinNextBid,
  getRecommendedBid,
  isAcceptedBuyerForListing,
  isBiddingOpen,
  isBuyerTokenDue,
  isChatEnabled,
  wasBuyerDeclinedBySeller,
} from '../types/listing';

export function PropertyBidPage() {
  const { id } = useParams<{ id: string }>();
  const { getListingById, placeBid, completeToken } = useListings();
  const { user, isAuthenticated, hasRole, syncCreditWallet, buyerCredits } = useAuth();
  const listing = id ? getListingById(id) : undefined;

  const sellerId = hasRole('seller') && user ? resolveSellerId(user.id) : '';
  const isListingOwner = Boolean(listing && sellerId && listing.sellerId === sellerId);
  const loggedInBuyer = isAuthenticated && hasRole('buyer') && user && !isListingOwner;
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <main className="pt-24 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Link to="/" className="text-[#0F172A] font-medium hover:underline">
            ← Back to listings
          </Link>
        </main>
      </div>
    );
  }

  const minBid = getMinNextBid(listing);
  const recommendedBid = getRecommendedBid(listing);
  const open = isBiddingOpen(listing);
  const status = getListingStatus(listing);
  const sortedBids = [...listing.bids].sort((a, b) => b.amountPerSqFt - a.amountPerSqFt);
  const isWinningBuyer = Boolean(user && isAcceptedBuyerForListing(listing, user));
  const chatEnabled = isChatEnabled(listing);
  const showBuyerTokenStep = Boolean(isWinningBuyer && isBuyerTokenDue(listing));
  const wasDeclined = Boolean(user && wasBuyerDeclinedBySeller(listing, user.id));

  const resolveBidPerSqFt = (amount?: number) => {
    if (amount && amount >= minBid) return amount;
    if (bidAmount && Number(bidAmount) >= minBid) return Number(bidAmount);
    return 0;
  };

  const submitBid = async (amountPerSqFt?: number) => {
    if (isSubmitting) return;

    setError('');
    setSuccess(false);

    if (!loggedInBuyer) {
      setError('Log in as a buyer and top up credits to place a bid.');
      return;
    }

    const liveCredits = getBuyerCredits(user.id);
    if (liveCredits < 1) {
      setError('Not enough credits. Top up to add more credits — each bid uses 1 credit.');
      syncCreditWallet();
      return;
    }

    const amount = resolveBidPerSqFt(amountPerSqFt);
    if (!amount || amount < minBid) {
      setError(`Enter at least ${formatPrice(getBidTotal(minBid, listing.areaSqFt))} (₹${minBid.toLocaleString('en-IN')}/sq.ft)`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeBid(listing.id, user.name, user.phone, amount, user.id);
      if (!result.ok) {
        setError(result.error);
        syncCreditWallet();
        return;
      }

      setBuyerName(user.name);
      setBuyerPhone(user.phone);
      syncCreditWallet();
      setSuccess(true);
      setBidAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitBid();
  };

  const handleSelectRecommended = () => {
    setBidAmount(String(recommendedBid));
    setError('');
  };

  const handleBuyerToken = (action: 'pay' | 'skip') => {
    if (!user) return;
    setTokenMessage('');
    const result = completeToken(listing.id, user.id, user.name, user.phone, action);
    setTokenMessage(
      result.ok
        ? action === 'pay'
          ? 'Payment successful! You can now chat with the seller.'
          : 'Skipped for now. You can chat with the seller.'
        : result.error,
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-5">
            <Link
              to={isListingOwner ? '/seller/dashboard' : '/'}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0F172A] transition-colors"
            >
              <ArrowLeft size={16} />
              {isListingOwner ? 'Back to my listings' : 'Back to listings'}
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-8">
            {/* Left column ~70% */}
            <div className="space-y-8 min-w-0">
              <PropertyHeroCard listing={listing} />

              <section>
                <h2 className="text-[22px] font-bold text-[#0F172A] mb-4">Verification</h2>
                <VerificationBadges listing={listing} />
              </section>

              <section>
                <h2 className="text-[22px] font-bold text-[#0F172A] mb-4">Pricing</h2>
                <PricingCards listing={listing} forBuyer={!isListingOwner} />
              </section>
            </div>

            {/* Right sticky sidebar ~30% */}
            {isListingOwner ? (
              <SellerDealSidebar listing={listing} sellerId={sellerId} />
            ) : (
              <StickyBidSidebar
                listing={listing}
                open={open}
                status={status}
                buyerCredits={buyerCredits}
                loggedInBuyer={Boolean(loggedInBuyer)}
                bidAmount={bidAmount}
                error={error}
                success={success}
                isSubmitting={isSubmitting}
                minBid={minBid}
                recommendedBid={recommendedBid}
                isWinningBuyer={isWinningBuyer}
                isChatEnabled={chatEnabled}
                showBuyerTokenStep={showBuyerTokenStep}
                wasDeclinedBySeller={wasDeclined}
                tokenMessage={tokenMessage || undefined}
                onPayToken={() => handleBuyerToken('pay')}
                onSkipToken={() => handleBuyerToken('skip')}
                onBidChange={setBidAmount}
                onSubmit={handleSubmit}
                onFastBid={() => void submitBid(recommendedBid)}
                onSelectRecommended={handleSelectRecommended}
              />
            )}
          </div>

          <div className="mt-8">
            <BidHistoryTimeline listing={listing} sortedBids={sortedBids} />
          </div>
        </div>
      </main>
    </div>
  );
}
