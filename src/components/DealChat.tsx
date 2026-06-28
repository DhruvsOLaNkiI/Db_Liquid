import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Send } from 'lucide-react';
import { Header } from './Header';
import { SellerDeclineBuyerButton } from './property-bid/SellerDeclineBuyerButton';
import { useListings } from '../context/ListingsContext';
import { getOrCreateSellerId } from '../utils/seller';
import { isBuyerIdentity } from '../utils/buyer';

type DealChatProps = {
  listingId: string;
  backTo: string;
  backLabel: string;
};

export function DealChat({ listingId, backTo, backLabel }: DealChatProps) {
  const navigate = useNavigate();
  const { getListingById, sendChatMessage } = useListings();
  const listing = getListingById(listingId);
  const sellerId = getOrCreateSellerId();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!listing) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20 px-4 text-center">
          <p className="text-gray-600 mb-4">Deal not found.</p>
          <Link to={backTo} className="text-primary font-medium hover:underline">
            {backLabel}
          </Link>
        </main>
      </div>
    );
  }

  if (!listing.acceptedBidId) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20 px-4 text-center max-w-md mx-auto">
          <p className="text-gray-600 mb-4">
            This deal is no longer active. The seller may have declined the accepted bid.
          </p>
          <Link to={backTo} className="text-primary font-medium hover:underline">
            {backLabel}
          </Link>
        </main>
      </div>
    );
  }

  const chatOpen = listing.tokenStatus === 'paid' || listing.tokenStatus === 'skipped';
  const isSeller = listing.sellerId === sellerId;
  const isBuyer =
    listing.chatBuyerName &&
    listing.chatBuyerPhone &&
    isBuyerIdentity(listing.chatBuyerName, listing.chatBuyerPhone);

  if (!chatOpen) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20 px-4 text-center max-w-md mx-auto">
          <p className="text-gray-600 mb-4">Chat is not available yet. Complete the token step first.</p>
          <Link to={backTo} className="text-primary font-medium hover:underline">
            {backLabel}
          </Link>
        </main>
      </div>
    );
  }

  if (!isSeller && !isBuyer) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 pb-20 px-4 text-center max-w-md mx-auto">
          <p className="text-gray-600 mb-4">
            Only the seller and winning buyer can access this chat.
          </p>
          <Link to={backTo} className="text-primary font-medium hover:underline">
            {backLabel}
          </Link>
        </main>
      </div>
    );
  }

  const senderRole = isSeller ? 'seller' : 'buyer';
  const myName = isSeller ? listing.chatSellerName : listing.chatBuyerName;
  const myPhone = isSeller ? listing.chatSellerPhone : listing.chatBuyerPhone;
  const otherName = isSeller ? listing.chatBuyerName : listing.chatSellerName;
  const otherPhone = isSeller ? listing.chatBuyerPhone : listing.chatSellerPhone;

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const result = sendChatMessage(listingId, senderRole, message, sellerId);
    if (result.ok) {
      setMessage('');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Chat with</p>
              <h1 className="text-xl font-bold">{otherName}</h1>
              <p className="text-sm text-gray-500">{otherPhone}</p>
              <p className="text-xs text-gray-400 mt-1">{listing.propertyType} · {listing.location}</p>
              {isSeller && listing.acceptedBidId && (
                <div className="mt-4">
                  <SellerDeclineBuyerButton
                    listingId={listingId}
                    sellerId={sellerId}
                    buyerName={listing.chatBuyerName || 'buyer'}
                    onDeclined={() => navigate('/seller/dashboard')}
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Lock size={14} className="text-gray-400 shrink-0" />
              <div className="text-sm">
                <span className="text-gray-500">You: </span>
                <span className="font-semibold text-gray-900">{myName}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="font-medium text-gray-700">{myPhone}</span>
              </div>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                Locked
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {listing.chatMessages.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  No messages yet. Say hello to start the conversation.
                </p>
              ) : (
                listing.chatMessages.map((msg) => {
                  const isMine = msg.senderRole === senderRole;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          isMine
                            ? 'bg-primary text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
            {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
