import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  ExternalLink,
  Gavel,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Repeat,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Header } from '../components/Header';
import { SellerDeclineBuyerButton } from '../components/property-bid/SellerDeclineBuyerButton';
import { EditListingPriceForm, canEditListingPrice } from '../components/listing/EditListingPriceForm';
import { useListings } from '../context/ListingsContext';
import {
  formatPrice,
  formatPriceShort,
  getAcceptedBid,
  getBidCount,
  getBidTotal,
  getHighestBidPerSqFt,
  getListingStatus,
  getTimeRemaining,
  isBuyerTokenDue,
  isChatEnabled,
} from '../types/listing';
import {
  formatBuyerConfiguration,
  getCurrentHighestBidTotal,
  getDisplayListingId,
  getListedPriceTotal,
  getListingViewStats,
} from '../utils/listingDisplay';
import { useAuth } from '../context/AuthContext';
import { getSellerName, resolveSellerId } from '../utils/seller';
import { canEditListing } from '../utils/listingEditForm';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
];

function statusStyles(status: ReturnType<typeof getListingStatus>) {
  if (status === 'active') {
    return {
      label: 'Active',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      dot: 'bg-emerald-500',
    };
  }
  if (status === 'accepted') {
    return {
      label: 'Bid Accepted',
      badge: 'bg-amber-50 text-amber-800 ring-amber-600/10',
      dot: 'bg-amber-500',
    };
  }
  return {
    label: 'Closed',
    badge: 'bg-gray-100 text-gray-600 ring-gray-500/10',
    dot: 'bg-gray-400',
  };
}

export function SellerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const sellerId = resolveSellerId(isAuthenticated ? user?.id : null);
  const sellerName = isAuthenticated && user ? user.name : getSellerName();
  const { getSellerListings, acceptBid } = useListings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const myListings = getSellerListings(sellerId);

  const handleAccept = (listingId: string, bidId: string) => {
    void (async () => {
      const result = await acceptBid(listingId, bidId, sellerId);
      if (result.ok) {
        setMessage('Bid accepted! Waiting for the buyer to pay the token.');
        setExpandedId(listingId);
      } else {
        setMessage(result.error);
      }
    })();
  };

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">Seller dashboard</h1>
              <p className="text-white/70">Welcome, {sellerName}. Manage your listings and bids.</p>
            </div>
            <Link
              to="/list-your-property"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-blue-950 transition-colors"
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
                className="inline-block px-8 py-4 bg-primary text-white rounded-full font-medium hover:bg-blue-950 transition-colors"
              >
                List your first property
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {myListings.map((listing) => {
                const imageIndex = listing.id.charCodeAt(0) % PLACEHOLDER_IMAGES.length;
                const status = getListingStatus(listing);
                const statusMeta = statusStyles(status);
                const bidCount = getBidCount(listing);
                const askTotal = getListedPriceTotal(listing);
                const highestTotal = getCurrentHighestBidTotal(listing);
                const hasBids = bidCount > 0;
                const acceptedBid = getAcceptedBid(listing);
                const sortedBids = [...listing.bids].sort((a, b) => b.amountPerSqFt - a.amountPerSqFt);
                const isExpanded = expandedId === listing.id;
                const editingPrice = editingPriceId === listing.id;
                const canEditPrice = canEditListingPrice(listing, sellerId);
                const tokenDue = isBuyerTokenDue(listing);
                const chatEnabled = isChatEnabled(listing);
                const publishedLabel = new Date(listing.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const viewStats = getListingViewStats(listing);

                return (
                  <div key={listing.id} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex flex-col sm:flex-row">
                      <Link
                        to={`/browse-property/${listing.id}`}
                        className="relative sm:w-56 md:w-64 shrink-0 aspect-[4/3] sm:aspect-[4/3] bg-gray-100 overflow-hidden"
                      >
                        <img
                          src={listing.propertyPhotos?.[0]?.dataUrl ?? PLACEHOLDER_IMAGES[imageIndex]}
                          alt={listing.propertyType}
                          className="absolute inset-0 w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/5" />
                        <span
                          className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ring-inset ${statusMeta.badge} backdrop-blur-sm bg-white/90`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                        <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0F172A]/85 text-white backdrop-blur-sm">
                          <TrendingUp size={12} />
                          {bidCount} bid{bidCount === 1 ? '' : 's'}
                        </span>
                      </Link>

                      <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                              {listing.propertyType}
                            </p>
                            <h2 className="text-lg sm:text-xl font-bold flex items-start gap-1.5 leading-snug text-gray-900 mb-1">
                              <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{listing.location}</span>
                            </h2>
                            <p className="text-sm text-gray-500 line-clamp-1">{formatBuyerConfiguration(listing)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                              {getDisplayListingId(listing.id)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Listed {publishedLabel}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          <div className="rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-100">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Ask bid</p>
                              {canEditPrice && !editingPrice && (
                                <button
                                  type="button"
                                  onClick={() => setEditingPriceId(listing.id)}
                                  className="text-[11px] font-medium text-primary hover:text-blue-950 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            <p className="text-base font-bold text-gray-900 truncate">
                              {formatPriceShort(askTotal)}
                            </p>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">₹{listing.pricePerSqFt.toLocaleString('en-IN')}/sq.ft</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-100">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1 flex items-center gap-1">
                              <Gavel size={12} />
                              Highest
                            </p>
                            {hasBids ? (
                              <>
                                <p className="text-base font-bold text-emerald-700 truncate">
                                  {formatPriceShort(highestTotal)}
                                </p>
                                <p className="text-xs text-emerald-700/80 truncate hidden sm:block">
                                  ₹{getHighestBidPerSqFt(listing).toLocaleString('en-IN')}/sq.ft
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-gray-400 mt-1">No bids</p>
                            )}
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-100">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1 flex items-center gap-1">
                              <Users size={12} />
                              Total bids
                            </p>
                            <p className="text-base font-bold text-gray-900 truncate">
                              {bidCount}
                            </p>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">Bidders</p>
                          </div>
                          <div className="rounded-xl bg-gray-50 px-3.5 py-3 border border-gray-100">
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1 flex items-center gap-1">
                              <Clock size={12} />
                              Time left
                            </p>
                            <p className="text-base font-bold text-gray-900 truncate">
                              {getTimeRemaining(listing)}
                            </p>
                            <p className="text-xs text-gray-500 truncate hidden sm:block">
                              {status === 'closed' ? 'Bidding ended' : 'Until close'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="rounded-xl bg-sky-50 px-3.5 py-3 border border-sky-100">
                            <p className="text-[11px] uppercase tracking-wider text-sky-700/80 font-medium mb-1 flex items-center gap-1">
                              <Eye size={12} />
                              Views
                            </p>
                            <p className="text-base font-bold text-sky-900">{viewStats.viewCount}</p>
                            <p className="text-xs text-sky-700/70 truncate hidden sm:block">Page opens</p>
                          </div>
                          <div className="rounded-xl bg-sky-50 px-3.5 py-3 border border-sky-100">
                            <p className="text-[11px] uppercase tracking-wider text-sky-700/80 font-medium mb-1 flex items-center gap-1">
                              <Users size={12} />
                              Visitors
                            </p>
                            <p className="text-base font-bold text-sky-900">{viewStats.uniqueVisitorCount}</p>
                            <p className="text-xs text-sky-700/70 truncate hidden sm:block">Unique people</p>
                          </div>
                          <div className="rounded-xl bg-violet-50 px-3.5 py-3 border border-violet-100">
                            <p className="text-[11px] uppercase tracking-wider text-violet-700/80 font-medium mb-1 flex items-center gap-1">
                              <Repeat size={12} />
                              Return
                            </p>
                            <p className="text-base font-bold text-violet-900">{viewStats.returnVisitorCount}</p>
                            <p className="text-xs text-violet-700/70 truncate hidden sm:block">Came back</p>
                          </div>
                        </div>

                        {editingPrice && (
                          <div className="mb-5">
                            <EditListingPriceForm
                              listing={listing}
                              sellerId={sellerId}
                              onSaved={() => setEditingPriceId(null)}
                              onCancel={() => setEditingPriceId(null)}
                            />
                          </div>
                        )}

                        {acceptedBid && (
                          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                            <div className="flex items-start gap-3">
                              <Check className="text-amber-600 shrink-0 mt-0.5" size={20} />
                              <div className="flex-1">
                                <p className="font-semibold text-amber-900">
                                  Accepted: {acceptedBid.bidderName} — ₹{acceptedBid.amountPerSqFt.toLocaleString('en-IN')}/sq.ft
                                </p>
                                <p className="text-sm text-amber-800 mt-0.5">
                                  Total: {formatPrice(getBidTotal(acceptedBid.amountPerSqFt, listing.areaSqFt))}
                                </p>
                              </div>
                            </div>

                            {tokenDue && (
                              <p className="text-sm text-amber-800 mt-3 bg-white/60 rounded-xl px-4 py-2.5 font-medium">
                                Waiting for {acceptedBid.bidderName} to pay the token. Chat opens after payment.
                              </p>
                            )}

                            {chatEnabled && (
                              <Link
                                to={`/seller/chat/${listing.id}`}
                                className="flex items-center justify-center gap-2 w-full mt-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-sm"
                              >
                                <MessageCircle size={18} />
                                Chat with {acceptedBid.bidderName}
                              </Link>
                            )}

                            <SellerDeclineBuyerButton
                              listingId={listing.id}
                              sellerId={sellerId}
                              buyerName={acceptedBid.bidderName}
                              className="mt-3 rounded-xl bg-white/50"
                            />
                          </div>
                        )}

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex flex-wrap gap-2">
                            {canEditListing(listing, sellerId) && (
                              <Link
                                to={`/seller/listing/${listing.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil size={14} />
                                Edit details
                              </Link>
                            )}
                            <Link
                              to={`/browse-property/${listing.id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink size={14} />
                              View public
                            </Link>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                              isExpanded 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                : 'bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm'
                            }`}
                          >
                            {isExpanded ? 'Hide bids' : `Manage bids (${bidCount})`}
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6">
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
                                    isAccepted ? 'bg-orange-50 border border-orange-100' : 'bg-white border border-gray-100'
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
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
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
                                        className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-blue-950 transition-colors whitespace-nowrap"
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
