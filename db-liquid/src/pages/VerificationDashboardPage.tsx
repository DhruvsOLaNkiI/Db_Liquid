import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { ListingVerifications, VerificationDocument } from '../types/listing';
import { formatPrice } from '../types/listing';
import { VERIFICATION_FIELDS } from '../utils/listingDisplay';
import { formatAadharInput } from '../utils/kyc';
import {
  fetchAdminUsers,
  fetchBidAudit,
  fetchVerificationQueue,
  deleteAdminListing,
  reviewUserKyc,
  reviewVerificationDocument,
  type AdminUserProfile,
  type BidAuditEntry,
  type VerificationQueueListing,
} from '../utils/verificationAdmin';
import { notifyDataRefresh } from '../utils/sharedStore';

type MainTab = 'users' | 'properties' | 'bid-audit';
type PropertyFilter = 'all' | 'pending' | 'with-docs' | 'no-docs';

const PROPERTY_VERIFICATION_LABELS: { key: keyof ListingVerifications; short: string }[] = [
  { key: 'titleVerified', short: 'Title' },
  { key: 'postedByOwner', short: 'Owner' },
  { key: 'bankApproved', short: 'Bank' },
  { key: 'freehold', short: 'Freehold' },
];

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusBadgeClass(status: VerificationDocument['status']) {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

function VerificationTick({ verified, label }: { verified: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px]" title={label}>
      {verified ? (
        <CheckCircle2 size={22} className="text-green-600" aria-label={`${label} verified`} />
      ) : (
        <XCircle size={22} className="text-gray-300" aria-label={`${label} not verified`} />
      )}
      <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function getDocLabel(type: string) {
  return VERIFICATION_FIELDS.find((field) => field.key === type)?.documentLabel ?? type;
}

function getDocHint(type: string) {
  return VERIFICATION_FIELDS.find((field) => field.key === type)?.uploadHint ?? '';
}

function DocumentPreview({ doc }: { doc: VerificationDocument }) {
  const isPdf = doc.mimeType === 'application/pdf' || doc.fileName.toLowerCase().endsWith('.pdf');
  const isOffice =
    doc.mimeType.includes('word') ||
    doc.fileName.toLowerCase().endsWith('.doc') ||
    doc.fileName.toLowerCase().endsWith('.docx');

  if (isPdf) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          <iframe src={doc.dataUrl} title={doc.fileName} className="w-full h-80 bg-white" />
        </div>
        <a
          href={doc.dataUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <FileText size={14} />
          Open PDF in new tab
          <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  if (isOffice || !doc.mimeType.startsWith('image/')) {
    return (
      <a
        href={doc.dataUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-primary hover:bg-gray-100"
      >
        <FileText size={16} />
        Download {doc.fileName}
        <ExternalLink size={12} />
      </a>
    );
  }

  return (
    <a href={doc.dataUrl} target="_blank" rel="noreferrer" className="block group">
      <img
        src={doc.dataUrl}
        alt={doc.fileName}
        className="w-full max-h-80 object-contain rounded-xl border border-gray-200 bg-gray-50 group-hover:border-primary/30 transition-colors"
      />
    </a>
  );
}

function UserProfileRow({
  user,
  listings,
  expanded,
  onToggle,
  onReviewed,
}: {
  user: AdminUserProfile;
  listings: VerificationQueueListing[];
  expanded: boolean;
  onToggle: () => void;
  onReviewed: () => void;
}) {
  const [busy, setBusy] = useState<'aadhar' | 'pan' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const listingCount = user.listingCount ?? listings.length;

  const handleKyc = async (field: 'aadhar' | 'pan', verified: boolean) => {
    setBusy(field);
    setError('');
    const result = await reviewUserKyc(user.id, field, verified);
    setBusy(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    notifyDataRefresh();
    onReviewed();
  };

  const handleDeleteListing = async (listingId: string, location: string) => {
    const ok = window.confirm(
      `Delete this property permanently?\n\n${location}\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    setDeletingId(listingId);
    setError('');
    const result = await deleteAdminListing(listingId);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    notifyDataRefresh();
    onReviewed();
  };

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50/80 align-top">
        <td className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{user.name || '—'}</p>
              <p className="text-xs text-gray-400 break-all">{user.id}</p>
              <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-sm">
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-gray-800 break-all">
              <Mail size={13} className="text-gray-400 shrink-0" />
              {user.email || '—'}
            </p>
            <p className="flex items-center gap-1.5 text-gray-800">
              <Phone size={13} className="text-gray-400 shrink-0" />
              {user.phone || '—'}
            </p>
          </div>
        </td>
        <td className="px-4 py-4 text-sm">
          <div className="flex flex-wrap gap-1">
            {(user.roles ?? []).map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize"
              >
                {role}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Building2 size={13} />
            {listingCount} propert{listingCount === 1 ? 'y' : 'ies'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <VerificationTick verified={Boolean(user.aadharVerified)} label="Aadhar" />
            <p className="text-xs font-mono text-gray-600 text-center">
              {user.aadharNumber ? formatAadharInput(user.aadharNumber) : 'Not provided'}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={busy === 'aadhar' || !user.aadharNumber}
                onClick={() => void handleKyc('aadhar', true)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
              >
                {busy === 'aadhar' ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
              </button>
              <button
                type="button"
                disabled={busy === 'aadhar'}
                onClick={() => void handleKyc('aadhar', false)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Revoke
              </button>
            </div>
            {error && <p className="text-xs text-red-600 text-center max-w-[140px]">{error}</p>}
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <VerificationTick verified={Boolean(user.panVerified)} label="PAN" />
            <p className="text-xs font-mono text-gray-600 uppercase text-center">
              {user.panNumber || 'Not provided'}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={busy === 'pan' || !user.panNumber}
                onClick={() => void handleKyc('pan', true)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
              >
                {busy === 'pan' ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
              </button>
              <button
                type="button"
                disabled={busy === 'pan'}
                onClick={() => void handleKyc('pan', false)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Revoke
              </button>
            </div>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-100 bg-slate-50/80">
          <td colSpan={5} className="px-4 py-4">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-900">
                  Properties by {user.name || 'user'} ({listings.length})
                </p>
                <p className="text-xs text-gray-500">Admin can delete any listing</p>
              </div>
              {listings.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-500 text-center">No properties listed by this user.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {listings.map((listing) => (
                    <li
                      key={listing.id}
                      className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">{listing.location}</p>
                        <p className="text-sm text-gray-500">
                          {listing.propertyType} · {formatPrice(listing.totalPrice)} · Listed{' '}
                          {formatDate(listing.publishedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/browse-property/${listing.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink size={12} />
                          View
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === listing.id}
                          onClick={() => void handleDeleteListing(listing.id, listing.location)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === listing.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ListingDetailPanel({
  listing,
  onReviewed,
}: {
  listing: VerificationQueueListing;
  onReviewed: () => void;
}) {
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const coverPhoto = listing.propertyPhotos[0];
  const seller = listing.sellerProfile;

  const handleReview = async (documentId: string, status: 'approved' | 'rejected') => {
    setBusyDocId(documentId);
    setError('');
    const result = await reviewVerificationDocument(listing.id, documentId, status);
    setBusyDocId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    notifyDataRefresh();
    onReviewed();
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/60 p-5 space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Property details</h3>
          </div>
          {coverPhoto && (
            <img
              src={coverPhoto.dataUrl}
              alt={listing.location}
              className="w-full h-36 object-cover rounded-lg border border-gray-100 mb-3"
            />
          )}
          <p className="text-lg font-bold text-gray-900">{listing.location}</p>
          <p className="text-sm text-gray-500">{listing.propertyType} · {listing.areaSqFt.toLocaleString('en-IN')} sq.ft</p>
          <p className="text-sm font-semibold text-gray-900 mt-2">{formatPrice(listing.totalPrice)}</p>
          {listing.description && (
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{listing.description}</p>
          )}
        </div>

        {seller && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Seller</h3>
            </div>
            <p className="font-semibold text-gray-900">{seller.name}</p>
            <p className="text-sm text-gray-600 mt-1">{seller.email}</p>
            <p className="text-sm text-gray-600">{seller.phone}</p>
            <div className="flex gap-4 mt-4">
              <VerificationTick verified={Boolean(seller.aadharVerified)} label="Aadhar" />
              <VerificationTick verified={Boolean(seller.panVerified)} label="PAN" />
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
          Documents ({listing.verificationDocuments.length})
        </h3>
        {listing.verificationDocuments.length === 0 ? (
          <p className="text-sm text-gray-500 rounded-xl border border-dashed border-gray-300 p-6 text-center">
            No documents uploaded for this listing.
          </p>
        ) : (
          <div className="space-y-4">
            {listing.verificationDocuments.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{getDocLabel(doc.type)}</p>
                    <p className="text-xs text-gray-500">{getDocHint(doc.type)}</p>
                  </div>
                  <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${statusBadgeClass(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
                <DocumentPreview doc={doc} />
                {doc.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => void handleReview(doc.id, 'approved')}
                      disabled={busyDocId === doc.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {busyDocId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReview(doc.id, 'rejected')}
                      disabled={busyDocId === doc.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}

function PropertyListingRow({
  listing,
  expanded,
  onToggle,
  onReviewed,
}: {
  listing: VerificationQueueListing;
  expanded: boolean;
  onToggle: () => void;
  onReviewed: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const verifiedCount = PROPERTY_VERIFICATION_LABELS.filter(
    (item) => listing.verifications[item.key],
  ).length;

  const handleDelete = async () => {
    const ok = window.confirm(
      `Delete this property permanently?\n\n${listing.location}\n\nThis cannot be undone.`,
    );
    if (!ok) return;

    setDeleting(true);
    setDeleteError('');
    const result = await deleteAdminListing(listing.id);
    setDeleting(false);

    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }

    notifyDataRefresh();
    onReviewed();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 px-4 py-4">
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-gray-900">{listing.location}</p>
          <p className="text-sm text-gray-500">
            {listing.propertyType} · {listing.sellerName} · {formatPrice(listing.totalPrice)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Listed {formatDate(listing.publishedAt)}</p>
          {deleteError && <p className="text-xs text-red-600 mt-1">{deleteError}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {PROPERTY_VERIFICATION_LABELS.map((item) => (
            <VerificationTick
              key={item.key}
              verified={listing.verifications[item.key]}
              label={item.short}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {verifiedCount}/4 verified · {listing.verificationDocuments.length} doc(s)
          </span>
          <Link
            to={`/browse-property/${listing.id}`}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="View live listing"
          >
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            title="Delete listing"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Hide' : 'Review'}
          </button>
        </div>
      </div>

      {expanded && <ListingDetailPanel listing={listing} onReviewed={onReviewed} />}
    </div>
  );
}

export function VerificationDashboardPage() {
  const [mainTab, setMainTab] = useState<MainTab>('users');
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [listings, setListings] = useState<VerificationQueueListing[]>([]);
  const [auditEntries, setAuditEntries] = useState<BidAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<PropertyFilter>('all');
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [auditListingId, setAuditListingId] = useState('');
  const [auditIp, setAuditIp] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');

    const [usersResult, listingsResult] = await Promise.all([
      fetchAdminUsers(),
      fetchVerificationQueue(),
    ]);

    setLoading(false);

    if (!usersResult.ok && !listingsResult.ok) {
      setError(usersResult.ok ? listingsResult.error : usersResult.error);
      return;
    }

    if (!usersResult.ok) {
      setError(usersResult.error);
    } else if (!listingsResult.ok) {
      setError(listingsResult.error);
    }

    if (usersResult.ok) setUsers(usersResult.users);
    if (listingsResult.ok) setListings(listingsResult.listings);
  }, []);

  const loadBidAudit = useCallback(async () => {
    setAuditLoading(true);
    setError('');
    const result = await fetchBidAudit({
      listingId: auditListingId || undefined,
      ip: auditIp || undefined,
      limit: 200,
    });
    setAuditLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAuditEntries(result.entries);
  }, [auditListingId, auditIp]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (mainTab === 'bid-audit') {
      void loadBidAudit();
    }
  }, [mainTab, loadBidAudit]);

  const filteredListings = useMemo(() => {
    if (filter === 'all') return listings;
    if (filter === 'pending') {
      return listings.filter((listing) =>
        listing.verificationDocuments.some((doc) => doc.status === 'pending'),
      );
    }
    if (filter === 'with-docs') {
      return listings.filter((listing) => listing.verificationDocuments.length > 0);
    }
    return listings.filter((listing) => listing.verificationDocuments.length === 0);
  }, [filter, listings]);

  const pendingDocCount = useMemo(
    () => listings.reduce((sum, listing) => sum + listing.verificationDocuments.filter((d) => d.status === 'pending').length, 0),
    [listings],
  );

  const verifiedUsersCount = useMemo(
    () => users.filter((user) => user.aadharVerified && user.panVerified).length,
    [users],
  );

  const fullyVerifiedListings = useMemo(
    () =>
      listings.filter((listing) =>
        PROPERTY_VERIFICATION_LABELS.every((item) => listing.verifications[item.key]),
      ).length,
    [listings],
  );

  return (
    <div className="min-h-screen">
      <header className="bg-[#0F172A] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} />
            <div>
              <p className="font-bold">DB Liquid · Admin Verification</p>
              <p className="text-xs text-white/60">KYC, listings, and bid fraud audit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void (mainTab === 'bid-audit' ? loadBidAudit() : loadAll())}
            disabled={loading || auditLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading || auditLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap rounded-xl bg-white border border-gray-200 p-1 gap-1 mb-6">
          <button
            type="button"
            onClick={() => setMainTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === 'users' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={16} />
            All users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setMainTab('properties')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === 'properties' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 size={16} />
            All properties ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setMainTab('bid-audit')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mainTab === 'bid-audit' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe size={16} />
            Bid IP audit
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {mainTab === 'users' && (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">User profiles</h1>
              <p className="text-sm text-gray-600 mt-1">
                {users.length} user{users.length === 1 ? '' : 's'} · {verifiedUsersCount} fully KYC
                verified (Aadhar + PAN) · open a user to see and delete their properties
              </p>
            </div>

            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading users…
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Users size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-700 font-medium">No users found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Roles / properties</th>
                        <th className="px-4 py-3 text-center">Aadhar verification</th>
                        <th className="px-4 py-3 text-center">PAN verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <UserProfileRow
                          key={user.id}
                          user={user}
                          listings={listings.filter((listing) => listing.sellerId === user.id)}
                          expanded={expandedUserId === user.id}
                          onToggle={() =>
                            setExpandedUserId((current) => (current === user.id ? null : user.id))
                          }
                          onReviewed={loadAll}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {mainTab === 'properties' && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property listings</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {listings.length} listing{listings.length === 1 ? '' : 's'} · {fullyVerifiedListings} fully verified ·{' '}
                  {pendingDocCount} pending document{pendingDocCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex flex-wrap rounded-xl bg-white border border-gray-200 p-1 gap-1">
                {(
                  [
                    ['all', `All (${listings.length})`],
                    ['pending', `Pending docs (${pendingDocCount})`],
                    ['with-docs', 'With documents'],
                    ['no-docs', 'No documents'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === key ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-white border border-gray-200 px-4 py-3 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Verification checks:</span>
              {PROPERTY_VERIFICATION_LABELS.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-600" /> = {item.short} verified by admin
                </span>
              ))}
            </div>

            {loading && listings.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading listings…
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Building2 size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-700 font-medium">No listings match this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <PropertyListingRow
                    key={listing.id}
                    listing={listing}
                    expanded={expandedListingId === listing.id}
                    onToggle={() =>
                      setExpandedListingId((current) => (current === listing.id ? null : listing.id))
                    }
                    onReviewed={loadAll}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {mainTab === 'bid-audit' && (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Bid IP audit</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client IPs recorded on place / accept / decline / refund for fraud investigation
              </p>
            </div>

            <form
              className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void loadBidAudit();
              }}
            >
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                Listing ID
                <input
                  value={auditListingId}
                  onChange={(e) => setAuditListingId(e.target.value)}
                  placeholder="Optional"
                  className="min-w-[200px] rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
                IP address
                <input
                  value={auditIp}
                  onChange={(e) => setAuditIp(e.target.value)}
                  placeholder="Optional"
                  className="min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-900 font-mono"
                />
              </label>
              <button
                type="submit"
                disabled={auditLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {auditLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                Search
              </button>
            </form>

            {auditLoading && auditEntries.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                <Loader2 size={20} className="animate-spin" />
                Loading bid audit…
              </div>
            ) : auditEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Globe size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-700 font-medium">No bid audit entries yet</p>
                <p className="text-sm text-gray-500 mt-1">Place a bid while logged in to generate a log row.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3">When</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">Bidder</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Listing / bid</th>
                        <th className="px-4 py-3">User agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50/80 align-top">
                          <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {formatDate(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                              {entry.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                            {entry.ip || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-gray-900">{entry.bidderName || '—'}</p>
                            <p className="text-xs text-gray-400 break-all">
                              {entry.bidderUserId || entry.actorUserId}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                            {formatPrice(entry.bidTotal)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            <p className="break-all">
                              <span className="font-semibold text-gray-600">L:</span> {entry.listingId}
                            </p>
                            <p className="break-all mt-1">
                              <span className="font-semibold text-gray-600">B:</span> {entry.bidId}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[220px] truncate" title={entry.userAgent}>
                            {entry.userAgent || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
