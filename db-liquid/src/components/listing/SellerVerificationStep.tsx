import { CheckCircle2, FileUp, Loader2, ShieldCheck, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ListingVerifications, VerificationDocType } from '../../types/listing';
import { VERIFICATION_FIELDS } from '../../utils/listingDisplay';
import { uploadPrivateFile } from '../../utils/fileUpload';

export type PendingVerificationUpload = {
  fileName: string;
  mimeType: string;
  /** Short-lived preview URL (signed); not persisted to MongoDB */
  dataUrl: string;
  storageKey: string;
};

type Props = {
  verifications: ListingVerifications;
  uploads: Partial<Record<VerificationDocType, PendingVerificationUpload>>;
  onVerificationsChange: (value: ListingVerifications) => void;
  onUploadChange: (type: VerificationDocType, upload: PendingVerificationUpload | null) => void;
  /** When false, documents stay local until the user logs in at publish. */
  canUploadToServer?: boolean;
};

export function SellerVerificationStep({
  verifications,
  uploads,
  onVerificationsChange,
  onUploadChange,
  canUploadToServer = true,
}: Props) {
  const [error, setError] = useState('');
  const [uploadingType, setUploadingType] = useState<VerificationDocType | null>(null);
  const inputRefs = useRef<Partial<Record<VerificationDocType, HTMLInputElement | null>>>({});

  const selectedKeys = VERIFICATION_FIELDS.filter(({ key }) => verifications[key]).map(({ key }) => key);

  function toggleVerification(key: VerificationDocType) {
    const next = { ...verifications, [key]: !verifications[key] };
    if (!next[key]) {
      onUploadChange(key, null);
    }
    onVerificationsChange(next);
    setError('');
  }

  async function handleFile(type: VerificationDocType, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setUploadingType(type);

    try {
      if (!canUploadToServer) {
        const { stashGuestFile, readFileAsObjectUrl } = await import('../../utils/guestMedia');
        const localKey = `guest-verify-${type}`;
        stashGuestFile(localKey, file);
        onUploadChange(type, {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: readFileAsObjectUrl(file),
          storageKey: localKey,
        });
        return;
      }

      const uploaded = await uploadPrivateFile(file, 'kyc');
      onUploadChange(type, {
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        dataUrl: uploaded.url,
        storageKey: uploaded.storageKey,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingType(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <ShieldCheck className="text-primary mb-4" size={28} />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Verify your listing</h1>
        <p className="text-gray-600">
          Select what applies, upload proof for each claim, and we will review your documents before badges go live.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Badges appear on your listing only after our team verifies the uploaded documents.
      </div>

      <div className="space-y-4">
        {VERIFICATION_FIELDS.map(({ key, label, hint, documentLabel, uploadHint }) => {
          const active = verifications[key];
          const upload = uploads[key];

          return (
            <div
              key={key}
              className={`rounded-2xl border p-4 transition-colors ${
                active ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleVerification(key)}
                className="w-full flex items-start gap-3 text-left"
              >
                <CheckCircle2
                  size={20}
                  className={`shrink-0 mt-0.5 ${active ? 'text-green-600' : 'text-gray-300'}`}
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>
                </span>
              </button>

              {active && (
                <div className="mt-4 pl-8 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{documentLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{uploadHint}</p>
                  </div>

                  <input
                    ref={(node) => {
                      inputRefs.current[key] = node;
                    }}
                    type="file"
                    accept="image/*,application/pdf,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      void handleFile(key, e.target.files);
                      e.target.value = '';
                    }}
                  />

          {upload ? (
                    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-white p-3">
                      {upload.mimeType.startsWith('image/') ? (
                        <img
                          src={upload.dataUrl}
                          alt={upload.fileName}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-[10px] font-semibold text-gray-500 uppercase">
                          {upload.mimeType.includes('pdf')
                            ? 'PDF'
                            : upload.fileName.split('.').pop() || 'DOC'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{upload.fileName}</p>
                        <p className="text-xs text-green-700 mt-0.5">Uploaded to secure storage</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUploadChange(key, null)}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Remove document"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRefs.current[key]?.click()}
                      disabled={uploadingType === key}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-60"
                    >
                      {uploadingType === key ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                      {uploadingType === key ? 'Uploading…' : 'Upload document'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedKeys.length === 0 && (
        <p className="text-sm text-gray-500">
          Optional — skip this step if you do not want verification badges yet.
        </p>
      )}
    </div>
  );
}

export function verificationStepIsValid(
  verifications: ListingVerifications,
  uploads: Partial<Record<VerificationDocType, PendingVerificationUpload>>,
) {
  const selected = VERIFICATION_FIELDS.filter(({ key }) => verifications[key]);
  if (selected.length === 0) return true;
  return selected.every(({ key }) => Boolean(uploads[key]?.storageKey));
}
