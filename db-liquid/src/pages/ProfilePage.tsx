import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  Check,
  ChevronRight,
  Gavel,
  MessageCircle,
  User as UserIcon,
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import {
  formatPrice,
  formatPriceShort,
  getBidTotal,
  getListingStatus,
} from '../types/listing';
import {
  getProfileCompletion,
  getTotalUserBids,
  getUserBidSummaries,
  getUserChatSummaries,
  getUserListings,
} from '../utils/profileStats';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ProfilePage() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { listings, reloadListings } = useListings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    reloadListings();
  }, [reloadListings]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setProfileImageUrl(user.profileImageUrl);
  }, [user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login?next=/profile" replace />;
  }

  const completion = getProfileCompletion({ ...user, profileImageUrl });
  const bidSummaries = getUserBidSummaries(listings, user.id);
  const myListings = getUserListings(listings, user.id);
  const chatSummaries = getUserChatSummaries(listings, user);
  const totalBids = getTotalUserBids(listings, user.id);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImageUrl(typeof reader.result === 'string' ? reader.result : undefined);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const result = await updateProfile({
      name,
      email,
      phone,
      profileImageUrl: profileImageUrl ?? null,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    reloadListings();
    setMessage('Profile updated successfully.');
  };

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">My profile</h1>
            <p className="text-gray-600">Your bids, listings, chats, and account details in one place.</p>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
            <aside className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col items-center text-center mb-6">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group mb-4"
                    aria-label="Change profile photo"
                  >
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md flex items-center justify-center">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={40} className="text-gray-400" />
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md group-hover:bg-gray-800 transition-colors">
                      <Camera size={16} />
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Profile completion</span>
                    <span className="font-bold text-primary">{completion.percent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {completion.checks.map((check) => (
                    <li
                      key={check.key}
                      className={`flex items-center gap-2 text-sm ${
                        check.done ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          check.done ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {check.done && <Check size={12} />}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-6">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {message && <p className="text-sm text-green-600">{message}</p>}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </div>
            </aside>

            <div className="space-y-8">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Gavel size={16} />
                    Total bids
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{totalBids}</p>
                  <p className="text-xs text-gray-400 mt-1">{bidSummaries.length} properties</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Building2 size={16} />
                    My listings
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{myListings.length}</p>
                  <Link to="/seller/dashboard" className="text-xs text-primary font-medium mt-1 inline-block hover:underline">
                    Manage listings
                  </Link>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <MessageCircle size={16} />
                    Chat threads
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{chatSummaries.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Active deal chats</p>
                </div>
              </div>

              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Where you bid</h3>
                  <p className="text-sm text-gray-500">Properties you have placed bids on</p>
                </div>
                {bidSummaries.length === 0 ? (
                  <p className="px-6 py-10 text-sm text-gray-500 text-center">
                    No bids yet.{' '}
                    <Link to="/" className="text-primary font-medium hover:underline">
                      Browse properties
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {bidSummaries.map((summary) => {
                      const latestTotal = getBidTotal(summary.latestBid.amountPerSqFt, summary.areaSqFt);
                      const highestTotal = getBidTotal(summary.highestUserBidPerSqFt, summary.areaSqFt);
                      return (
                        <li key={summary.listingId}>
                          <Link
                            to={`/browse-property/${summary.listingId}`}
                            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{summary.location}</p>
                              <p className="text-sm text-gray-500">{summary.propertyType}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {summary.bidCount} bid{summary.bidCount === 1 ? '' : 's'} · Latest{' '}
                                {formatDateTime(summary.latestBid.createdAt)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-gray-900">{formatPriceShort(highestTotal)}</p>
                              <p className="text-xs text-gray-500">{formatPrice(highestTotal)}</p>
                              <p className="text-xs text-gray-400 mt-1">Last {formatPriceShort(latestTotal)}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">My listings</h3>
                  <p className="text-sm text-gray-500">Properties you have published</p>
                </div>
                {myListings.length === 0 ? (
                  <p className="px-6 py-10 text-sm text-gray-500 text-center">
                    No listings yet.{' '}
                    <Link to="/list-your-property" className="text-primary font-medium hover:underline">
                      List a property
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {myListings.map((listing) => {
                      const status = getListingStatus(listing);
                      const statusLabel =
                        status === 'accepted' ? 'On Hold' : status === 'active' ? 'Active' : 'Closed';
                      return (
                        <li key={listing.id}>
                          <Link
                            to={`/browse-property/${listing.id}`}
                            className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{listing.location}</p>
                              <p className="text-sm text-gray-500">{listing.propertyType}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {listing.bids.length} bid{listing.bids.length === 1 ? '' : 's'} · {statusLabel}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-gray-900">{formatPriceShort(listing.totalPrice)}</p>
                              <p className="text-xs text-gray-500">{formatPrice(listing.totalPrice)}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Chat history</h3>
                  <p className="text-sm text-gray-500">Deal conversations you are part of</p>
                </div>
                {chatSummaries.length === 0 ? (
                  <p className="px-6 py-10 text-sm text-gray-500 text-center">
                    No chats yet. Chats open after a bid is accepted and the token step is complete.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {chatSummaries.map((chat) => (
                      <li key={chat.listingId}>
                        <Link
                          to={chat.chatPath}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{chat.location}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {chat.role} · {chat.propertyType}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 truncate">{chat.lastMessageText}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-gray-500">
                              {chat.messageCount} message{chat.messageCount === 1 ? '' : 's'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(chat.lastMessageAt)}</p>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 shrink-0" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
