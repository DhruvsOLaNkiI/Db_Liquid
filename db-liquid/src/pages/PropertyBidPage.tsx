import { useState, useEffect, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { BidHistoryTimeline } from '../components/property-bid/BidHistoryTimeline';
import { PropertyMoreDetails } from '../components/property-bid/PropertyMoreDetails';
import { PricingCards } from '../components/property-bid/PricingCards';
import { PropertyHeroCard } from '../components/property-bid/PropertyHeroCard';
import { StickyBidSidebar } from '../components/property-bid/StickyBidSidebar';
import { MobileBidBar } from '../components/property-bid/MobileBidBar';
import { SellerDealSidebar } from '../components/property-bid/SellerDealSidebar';
import { VerificationBadges } from '../components/property-bid/VerificationBadges';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import { setBuyerName, setBuyerPhone } from '../utils/buyer';
import { getBuyerCredits } from '../utils/buyerCredits';
import { resolveSellerId } from '../utils/seller';
import { getCurrentHighestBidTotal } from '../utils/listingDisplay';
import {
  getListingStatus,
  getRecommendedBidTotal,
  isValidBidTotal,
  sortBidsByAmount,
  isAcceptedBuyerForListing,
  isBiddingOpen,
  isBuyerTokenDue,
  isChatEnabled,
  wasBuyerDeclinedBySeller,
} from '../types/listing';

export function PropertyBidPage() {
  const { id } = useParams<{ id: string }>();
  const { getListingById, placeBid, completeToken, recordListingView } = useListings();
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

  useEffect(() => {
    if (!id || isListingOwner) return;
    void recordListingView(id, user?.id);
  }, [id, isListingOwner, user?.id, recordListingView]);

  if (!listing) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Listing not found</h1>
          <Link to="/browse-property" className="text-[#FF7A00] font-medium hover:underline">
            ← Back to listings
          </Link>
        </main>
      </div>
    );
  }

  const recommendedBidTotal = getRecommendedBidTotal(listing);
  const open = isBiddingOpen(listing);
  const status = getListingStatus(listing);
  const sortedBids = sortBidsByAmount(listing.bids, listing.areaSqFt);
  const isWinningBuyer = Boolean(user && isAcceptedBuyerForListing(listing, user));
  const chatEnabled = isChatEnabled(listing);
  const showBuyerTokenStep = Boolean(isWinningBuyer && isBuyerTokenDue(listing));
  const wasDeclined = Boolean(user && wasBuyerDeclinedBySeller(listing, user.id));

  const resolveBidTotal = (total?: number) => {
    if (total && total > 0) return total;
    if (bidAmount && Number(bidAmount) > 0) return Number(bidAmount);
    return 0;
  };

  const submitBid = async (bidTotal?: number) => {
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

    const total = resolveBidTotal(bidTotal);
    if (!isValidBidTotal(total)) {
      setError('Enter a bid amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeBid(listing.id, user.name, user.phone, total, user.id);
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
    setBidAmount(String(recommendedBidTotal));
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
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900 property-bid-page">
      <Header />
      <main className="pt-20 pb-28 lg:pt-24 lg:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-5">
            <Link
              to={isListingOwner ? '/seller/dashboard' : '/browse-property'}
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              {isListingOwner ? 'Back to my listings' : 'Back to listings'}
            </Link>
          </div>

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
            <div className="order-1 lg:col-start-1 min-w-0">
              <PropertyHeroCard listing={listing} />
            </div>

            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2">
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
                  recommendedBidTotal={recommendedBidTotal}
                  isWinningBuyer={isWinningBuyer}
                  isChatEnabled={chatEnabled}
                  showBuyerTokenStep={showBuyerTokenStep}
                  wasDeclinedBySeller={wasDeclined}
                  tokenMessage={tokenMessage || undefined}
                  onPayToken={() => handleBuyerToken('pay')}
                  onSkipToken={() => handleBuyerToken('skip')}
                  onBidChange={setBidAmount}
                  onSubmit={handleSubmit}
                  onFastBid={() => void submitBid(recommendedBidTotal)}
                  onSelectRecommended={handleSelectRecommended}
                />
              )}
            </div>

            <div className="order-3 lg:col-start-1 space-y-5 min-w-0">
              <section className="glass-card rounded-[18px] p-5 lg:p-6">
                <h2 className="text-lg lg:text-xl font-bold text-white mb-4">Verification</h2>
                <VerificationBadges listing={listing} />
              </section>

              <section
                className={`glass-card rounded-[18px] p-5 lg:p-6 ${!isListingOwner ? 'hidden lg:block' : ''}`}
              >
                <h2 className="text-lg lg:text-xl font-bold text-white mb-4">Pricing</h2>
                <PricingCards listing={listing} />
              </section>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {!isListingOwner && (
              <BidHistoryTimeline listing={listing} sortedBids={sortedBids} />
            )}
            <PropertyMoreDetails listing={listing} />
          </div>
        </div>
      </main>

      {!isListingOwner && (
        <MobileBidBar
          listingId={listing.id}
          open={open}
          loggedInBuyer={Boolean(loggedInBuyer)}
          isSubmitting={isSubmitting}
          buyerCredits={buyerCredits}
          currentBidTotal={getCurrentHighestBidTotal(listing)}
          onPlaceBid={() => {
            document.getElementById('bid-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}
