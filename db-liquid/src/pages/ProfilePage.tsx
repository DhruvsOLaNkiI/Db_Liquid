import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Gavel,
  Lock,
  MessageCircle,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useListings } from '../context/ListingsContext';
import {
  formatPrice,
  formatPriceShort,
  getBidTotal,
} from '../types/listing';
import {
  getProfileCompletion,
  getTotalUserBids,
  getUserBidSummaries,
  getUserChatSummaries,
  getUserListings,
} from '../utils/profileStats';
import { ProfileListingCard } from '../components/profile/ProfileListingCard';
import { uploadPrivateFile } from '../utils/fileUpload';
import {
  formatAadharInput,
  isValidAadhar,
  isValidPan,
  maskAadhar,
  maskPan,
  normalizeAadhar,
  normalizePan,
} from '../utils/kyc';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-white/25 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors';

type ProfileTab = 'details' | 'security';

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white/85 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} pr-11`}
          autoComplete={id.includes('current') ? 'current-password' : 'new-password'}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

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
  const { user, isAuthenticated, sessionReady, updateProfile, changePassword } = useAuth();
  const { listings, reloadListings } = useListings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();
  const [profileImageKey, setProfileImageKey] = useState<string | undefined>();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [editingAadhar, setEditingAadhar] = useState(false);
  const [editingPan, setEditingPan] = useState(false);
  const [verifyingAadhar, setVerifyingAadhar] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [kycError, setKycError] = useState('');
  const [kycMessage, setKycMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setProfileImageUrl(user.profileImageUrl);
    setProfileImageKey(user.profileImageKey);
    setAadharNumber(user.aadharNumber ? formatAadharInput(user.aadharNumber) : '');
    setPanNumber(user.panNumber ?? '');
    setEditingAadhar(false);
    setEditingPan(false);
  }, [user]);

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/70">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login?next=/profile" replace />;
  }

  const completion = getProfileCompletion({ ...user, profileImageUrl });
  const bidSummaries = getUserBidSummaries(listings, user.id);
  const myListings = getUserListings(listings, user.id);
  const chatSummaries = getUserChatSummaries(listings, user);
  const totalBids = getTotalUserBids(listings, user.id);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingPhoto(true);
    setError('');
    try {
      const uploaded = await uploadPrivateFile(file, 'profile');
      setProfileImageUrl(uploaded.url);
      setProfileImageKey(uploaded.storageKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
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
      profileImageUrl: profileImageKey ?? profileImageUrl ?? null,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    reloadListings({ force: true });
    setMessage('Profile updated successfully.');
  };

  const resetDetailsForm = () => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setProfileImageUrl(user.profileImageUrl);
    setProfileImageKey(user.profileImageKey);
    setError('');
    setMessage('');
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('Password changed successfully.');
  };

  const handleVerifyAadhar = async () => {
    setKycError('');
    setKycMessage('');

    const normalized = normalizeAadhar(aadharNumber);
    if (!isValidAadhar(normalized)) {
      setKycError('Enter a valid 12-digit Aadhar number.');
      return;
    }

    setVerifyingAadhar(true);
    const result = await updateProfile({
      aadharNumber: normalized,
      aadharVerified: true,
    });
    setVerifyingAadhar(false);

    if (!result.ok) {
      setKycError(result.error);
      return;
    }

    setEditingAadhar(false);
    setKycMessage('Aadhar verified successfully.');
  };

  const handleVerifyPan = async () => {
    setKycError('');
    setKycMessage('');

    const normalized = normalizePan(panNumber);
    if (!isValidPan(normalized)) {
      setKycError('Enter a valid PAN (e.g. ABCDE1234F).');
      return;
    }

    setVerifyingPan(true);
    const result = await updateProfile({
      panNumber: normalized,
      panVerified: true,
    });
    setVerifyingPan(false);

    if (!result.ok) {
      setKycError(result.error);
      return;
    }

    setEditingPan(false);
    setKycMessage('PAN verified successfully.');
  };

  const hasDetailsChanges =
    user &&
    (name !== user.name ||
      email !== user.email ||
      phone !== user.phone ||
      (profileImageKey ?? undefined) !== (user.profileImageKey ?? undefined) ||
      (!profileImageKey && (profileImageUrl ?? undefined) !== (user.profileImageUrl ?? undefined)));

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">My profile</h1>
            <p className="text-white/70">Your bids, listings, chats, and account details in one place.</p>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8 lg:gap-12 items-start">
            <aside className="space-y-6">
              <div className="p-1">
                <div className="flex flex-col items-center text-center mb-6">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="relative group mb-4 disabled:opacity-60"
                    aria-label="Change profile photo"
                  >
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-white/10 border-4 border-white/20 shadow-md flex items-center justify-center">
                      {uploadingPhoto ? (
                        <span className="text-xs text-white/70">Uploading…</span>
                      ) : profileImageUrl ? (
                        <img src={profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={40} className="text-white/50" />
                      )}
                    </div>
                    <span className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md group-hover:bg-blue-950 transition-colors">
                      <Camera size={16} />
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void handleImageChange(e)}
                  />
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  <p className="text-sm text-white/65 mt-1">{user.email}</p>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-white/80">Profile completion</span>
                    <span className="font-bold text-accent">{completion.percent}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {completion.checks.map((check) => (
                    <li
                      key={check.key}
                      className={`flex items-center gap-2 text-sm ${
                        check.done ? 'text-green-300' : 'text-white/55'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          check.done ? 'bg-green-500/25' : 'bg-white/10'
                        }`}
                      >
                        {check.done && <Check size={12} />}
                      </span>
                      {check.label}
                    </li>
                  ))}
                </ul>

                <div className="flex rounded-xl bg-white/10 p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'details'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Personal details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'security'
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Password
                  </button>
                </div>

                {activeTab === 'details' ? (
                <form onSubmit={handleSubmit} className="space-y-4 border-t border-white/15 pt-6">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium text-white/85 mb-1.5">
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
                    <label htmlFor="profile-email" className="block text-sm font-medium text-white/85 mb-1.5">
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
                    <label htmlFor="profile-phone" className="block text-sm font-medium text-white/85 mb-1.5">
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

                  <div className="border-t border-white/15 pt-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={18} className="text-accent" />
                      <h3 className="text-sm font-semibold text-white">Identity verification</h3>
                    </div>
                    <p className="text-xs text-white/60">
                      Verify your Aadhar and PAN to build trust with buyers and sellers on DB Liquid.
                    </p>

                    <div
                      className={`rounded-xl border p-4 ${
                        user.aadharVerified && !editingAadhar
                          ? 'border-green-400/40 bg-green-500/10'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Aadhar</p>
                          <p className="text-xs text-white/55 mt-0.5">12-digit Aadhar number</p>
                        </div>
                        {user.aadharVerified && !editingAadhar ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold shrink-0">
                            <CheckCircle2 size={14} />
                            Verified
                          </span>
                        ) : null}
                      </div>

                      {user.aadharVerified && !editingAadhar ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white/90 tracking-wide">
                            {maskAadhar(user.aadharNumber ?? '')}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAadhar(true);
                              setAadharNumber(user.aadharNumber ? formatAadharInput(user.aadharNumber) : '');
                              setKycError('');
                              setKycMessage('');
                            }}
                            className="text-xs font-medium text-accent hover:underline shrink-0"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            id="profile-aadhar"
                            type="text"
                            inputMode="numeric"
                            value={aadharNumber}
                            onChange={(e) => setAadharNumber(formatAadharInput(e.target.value))}
                            placeholder="XXXX XXXX XXXX"
                            className={inputClass}
                            maxLength={14}
                          />
                          <div className="flex gap-2">
                            {editingAadhar && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAadhar(false);
                                  setAadharNumber(user.aadharNumber ? formatAadharInput(user.aadharNumber) : '');
                                  setKycError('');
                                }}
                                className="flex-1 py-2.5 border border-white/25 text-white/90 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleVerifyAadhar()}
                              disabled={verifyingAadhar || !aadharNumber.trim()}
                              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-950 transition-colors disabled:opacity-50"
                            >
                              {verifyingAadhar ? 'Verifying…' : 'Verify Aadhar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`rounded-xl border p-4 ${
                        user.panVerified && !editingPan
                          ? 'border-green-400/40 bg-green-500/10'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-white">PAN</p>
                          <p className="text-xs text-white/55 mt-0.5">Permanent Account Number</p>
                        </div>
                        {user.panVerified && !editingPan ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold shrink-0">
                            <CheckCircle2 size={14} />
                            Verified
                          </span>
                        ) : null}
                      </div>

                      {user.panVerified && !editingPan ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white/90 tracking-wide uppercase">
                            {maskPan(user.panNumber ?? '')}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPan(true);
                              setPanNumber(user.panNumber ?? '');
                              setKycError('');
                              setKycMessage('');
                            }}
                            className="text-xs font-medium text-accent hover:underline shrink-0"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            id="profile-pan"
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                            placeholder="ABCDE1234F"
                            className={`${inputClass} uppercase`}
                            maxLength={10}
                          />
                          <div className="flex gap-2">
                            {editingPan && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPan(false);
                                  setPanNumber(user.panNumber ?? '');
                                  setKycError('');
                                }}
                                className="flex-1 py-2.5 border border-white/25 text-white/90 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleVerifyPan()}
                              disabled={verifyingPan || !panNumber.trim()}
                              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-950 transition-colors disabled:opacity-50"
                            >
                              {verifyingPan ? 'Verifying…' : 'Verify PAN'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {kycError && <p className="text-sm text-red-300">{kycError}</p>}
                    {kycMessage && <p className="text-sm text-green-300">{kycMessage}</p>}
                  </div>

                  {error && <p className="text-sm text-red-300">{error}</p>}
                  {message && <p className="text-sm text-green-300">{message}</p>}

                  <div className="flex gap-2">
                    {hasDetailsChanges && (
                      <button
                        type="button"
                        onClick={resetDetailsForm}
                        className="flex-1 py-3 border border-white/25 text-white/90 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving || !hasDetailsChanges}
                      className={`py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-950 transition-colors disabled:opacity-50 ${
                        hasDetailsChanges ? 'flex-1' : 'w-full'
                      }`}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
                ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t border-white/15 pt-6">
                  <div className="flex items-start gap-3 rounded-xl bg-white/10 border border-white/15 px-4 py-3 mb-1">
                    <Lock size={18} className="text-white/60 shrink-0 mt-0.5" />
                    <p className="text-sm text-white/75">
                      Use a strong password with at least 6 characters. You will stay logged in after changing it.
                    </p>
                  </div>

                  <PasswordField
                    id="current-password"
                    label="Current password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="Enter current password"
                  />
                  <PasswordField
                    id="new-password"
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="At least 6 characters"
                  />
                  <PasswordField
                    id="confirm-password"
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Re-enter new password"
                  />

                  {passwordError && <p className="text-sm text-red-300">{passwordError}</p>}
                  {passwordMessage && <p className="text-sm text-green-300">{passwordMessage}</p>}

                  <button
                    type="submit"
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-blue-950 transition-colors disabled:opacity-50"
                  >
                    {savingPassword ? 'Updating…' : 'Change password'}
                  </button>
                </form>
                )}
              </div>
            </aside>

            <div className="space-y-10">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-2">
                  <div className="flex items-center gap-2 text-white/65 text-sm mb-2">
                    <Gavel size={16} />
                    Total bids
                  </div>
                  <p className="text-3xl font-bold text-white">{totalBids}</p>
                  <p className="text-xs text-white/50 mt-1">{bidSummaries.length} properties</p>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 text-white/65 text-sm mb-2">
                    <Building2 size={16} />
                    My listings
                  </div>
                  <p className="text-3xl font-bold text-white">{myListings.length}</p>
                  <Link to="/seller/dashboard" className="text-xs text-accent font-medium mt-1 inline-block hover:underline">
                    Manage listings
                  </Link>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 text-white/65 text-sm mb-2">
                    <MessageCircle size={16} />
                    Chat threads
                  </div>
                  <p className="text-3xl font-bold text-white">{chatSummaries.length}</p>
                  <p className="text-xs text-white/50 mt-1">Active deal chats</p>
                </div>
              </div>

              <section>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white">Where you bid</h3>
                  <p className="text-sm text-white/60">Properties you have placed bids on</p>
                </div>
                {bidSummaries.length === 0 ? (
                  <p className="py-6 text-sm text-white/60 text-center">
                    No bids yet.{' '}
                    <Link to="/" className="text-accent font-medium hover:underline">
                      Browse properties
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {bidSummaries.map((summary) => {
                      const latestTotal = getBidTotal(summary.latestBid.amountPerSqFt, summary.areaSqFt);
                      const highestTotal = getBidTotal(summary.highestUserBidPerSqFt, summary.areaSqFt);
                      return (
                        <li key={summary.listingId}>
                          <Link
                            to={`/browse-property/${summary.listingId}`}
                            className="flex items-center justify-between gap-4 py-4 hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{summary.location}</p>
                              <p className="text-sm text-white/60">{summary.propertyType}</p>
                              <p className="text-xs text-white/45 mt-1">
                                {summary.bidCount} bid{summary.bidCount === 1 ? '' : 's'} · Latest{' '}
                                {formatDateTime(summary.latestBid.createdAt)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-white">{formatPriceShort(highestTotal)}</p>
                              <p className="text-xs text-white/55">{formatPrice(highestTotal)}</p>
                              <p className="text-xs text-white/45 mt-1">Last {formatPriceShort(latestTotal)}</p>
                            </div>
                            <ChevronRight size={18} className="text-white/35 shrink-0" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">My listings</h3>
                    <p className="text-sm text-white/60">
                      {myListings.length === 0
                        ? 'Properties you have published'
                        : `${myListings.length} published · track bids and manage deals`}
                    </p>
                  </div>
                  {myListings.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/seller/dashboard"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-white/25 text-white/90 hover:bg-white/10 transition-colors"
                      >
                        Seller dashboard
                      </Link>
                      <Link
                        to="/list-your-property"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-accent text-white hover:bg-orange-600 transition-colors"
                      >
                        List new
                      </Link>
                    </div>
                  )}
                </div>
                {myListings.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Building2 size={24} className="text-white/50" />
                    </div>
                    <p className="text-white/90 font-medium mb-1">No listings yet</p>
                    <p className="text-sm text-white/60 mb-6 max-w-sm mx-auto">
                      Publish your first property to start receiving bids from verified buyers.
                    </p>
                    <Link
                      to="/list-your-property"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
                    >
                      List a property
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myListings.map((listing) => (
                      <ProfileListingCard key={listing.id} listing={listing} sellerId={user.id} />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white">Chat history</h3>
                  <p className="text-sm text-white/60">Deal conversations you are part of</p>
                </div>
                {chatSummaries.length === 0 ? (
                  <p className="py-6 text-sm text-white/60 text-center">
                    No chats yet. Chats open after a bid is accepted and the token step is complete.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {chatSummaries.map((chat) => (
                      <li key={chat.listingId}>
                        <Link
                          to={chat.chatPath}
                          className="flex items-center justify-between gap-4 py-4 hover:bg-white/5 transition-colors rounded-xl px-2 -mx-2"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{chat.location}</p>
                            <p className="text-sm text-white/60 capitalize">
                              {chat.role} · {chat.propertyType}
                            </p>
                            <p className="text-sm text-white/55 mt-1 truncate">{chat.lastMessageText}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-white/55">
                              {chat.messageCount} message{chat.messageCount === 1 ? '' : 's'}
                            </p>
                            <p className="text-xs text-white/45 mt-1">{formatDateTime(chat.lastMessageAt)}</p>
                          </div>
                          <ChevronRight size={18} className="text-white/35 shrink-0" />
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
