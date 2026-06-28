import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, MapPin, MessageCircle, Plus, TrendingUp, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { SellerDeclineBuyerButton } from '../components/property-bid/SellerDeclineBuyerButton';
import { useListings } from '../context/ListingsContext';
import {
  formatPrice,
  getAcceptedBid,
  getBidTotal,
  getHighestBidPerSqFt,
  getListingStatus,
  getTimeRemaining,
  isBuyerTokenDue,
  isChatEnabled,
} from '../types/listing';
import { useAuth } from '../context/AuthContext';
import { getSellerName, resolveSellerId } from '../utils/seller';

export function SellerDashboardPage() {
  const { user, hasRole } = useAuth();
  const sellerId = resolveSellerId(hasRole('seller') ? user?.id : null);
  const sellerName = hasRole('seller') && user ? user.name : getSellerName();
  const { getSellerListings, acceptBid, reloadListings } = useListings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    reloadListings();
  }, [reloadListings]);

  const myListings = getSellerListings(sellerId);

  const handleAccept = (listingId: string, bidId: string) => {
    const result = acceptBid(listingId, bidId, sellerId);
    if (result.ok) {
      setMessage('Bid accepted! Waiting for the buyer to pay the token.');
      setExpandedId(listingId);
    } else {
      setMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Seller dashboard</h1>
              <p className="text-gray-600">Welcome, {sellerName}. Manage your listings and bids.</p>
            </div>
            <Link
              to="/list-your-property"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={18} />
              New listing
            </Link>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-medium">
              {message}
            </div>
          )}

          {myListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <p className="text-gray-500 mb-6">You have no listings yet.</p>
              <Link
                to="/list-your-property"
                className="inline-block px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                List your first property
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {myListings.map((listing) => {
                const status = getListingStatus(listing);
                const highestBid = getHighestBidPerSqFt(listing);
                const acceptedBid = getAcceptedBid(listing);
                const sortedBids = [...listing.bids].sort((a, b) => b.amountPerSqFt - a.amountPerSqFt);
                const isExpanded = expandedId === listing.id;

                return (
                  <div key={listing.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                            {listing.propertyType}
                          </p>
                          <h2 className="text-xl font-bold flex items-center gap-2">
                            <MapPin size={18} className="text-gray-400" />
                            {listing.location}
                          </h2>
                          <p className="text-sm text-gray-500 mt-1">{listing.detailsSummary}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : status === 'accepted'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {status === 'active' ? 'Active' : status === 'accepted' ? 'Bid accepted' : 'Closed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Users size={12} /> Total bids
                          </p>
                          <p className="text-2xl font-bold">{listing.bids.length}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <TrendingUp size={12} /> Highest bid
                          </p>
                          <p className="text-lg font-bold">₹{highestBid.toLocaleString('en-IN')}/sq.ft</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1">Listed at</p>
                          <p className="text-lg font-bold">₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Clock size={12} /> Time left
                          </p>
                          <p className="text-lg font-bold">{getTimeRemaining(listing)}</p>
                        </div>
                      </div>

                      {acceptedBid && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Check className="text-blue-600 shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                              <p className="font-semibold text-blue-900">
                                Accepted: {acceptedBid.bidderName} — ₹{acceptedBid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft
                              </p>
                              <p className="text-sm text-blue-700">
                                Total: {formatPrice(getBidTotal(acceptedBid.amountPerSqFt, listing.areaSqFt))}
                              </p>
                            </div>
                          </div>

                          {isBuyerTokenDue(listing) && (
                            <p className="text-sm text-blue-800 mt-4 bg-white/70 rounded-xl px-4 py-3">
                              Waiting for {acceptedBid.bidderName} to pay the token. Chat opens after payment.
                            </p>
                          )}

                          {isChatEnabled(listing) && (
                            <Link
                              to={`/seller/chat/${listing.id}`}
                              className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
                            >
                              <MessageCircle size={18} />
                              Chat with {acceptedBid.bidderName}
                            </Link>
                          )}

                          <SellerDeclineBuyerButton
                            listingId={listing.id}
                            sellerId={sellerId}
                            buyerName={acceptedBid.bidderName}
                            className="mt-3 rounded-full"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {isExpanded ? 'Hide bids' : `View all ${listing.bids.length} bid${listing.bids.length !== 1 ? 's' : ''}`}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-6">
                        {sortedBids.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">No bids yet. Share your listing with buyers.</p>
                        ) : (
                          <div className="space-y-3">
                            {sortedBids.map((bid, i) => {
                              const isAccepted = listing.acceptedBidId === bid.id;
                              const canAccept = status === 'active' && !listing.acceptedBidId;

                              return (
                                <div
                                  key={bid.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl ${
                                    isAccepted ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-gray-900">{bid.bidderName}</p>
                                      {i === 0 && status === 'active' && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                          Highest
                                        </span>
                                      )}
                                      {isAccepted && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                          Accepted
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {new Date(bid.createdAt).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="font-bold">₹{bid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft</p>
                                      <p className="text-xs text-gray-500">
                                        {formatPrice(getBidTotal(bid.amountPerSqFt, listing.areaSqFt))}
                                      </p>
                                    </div>
                                    {canAccept && (
                                      <button
                                        type="button"
                                        onClick={() => handleAccept(listing.id, bid.id)}
                                        className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                                      >
                                        Accept bid
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <Link
                          to={`/browse-property/${listing.id}`}
                          className="block text-center text-sm text-gray-500 hover:text-primary mt-4"
                        >
                          View public listing →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
