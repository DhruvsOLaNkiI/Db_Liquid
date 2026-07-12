import { apiFetch } from './api';

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const DOC_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPG, PNG, or WEBP).');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be 2 MB or smaller.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}

export type UploadedPrivateFile = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  url: string;
  size: number;
};

export type UploadPurpose = 'kyc' | 'photo' | 'profile' | 'doc';

/** Upload file to private object storage (R2/S3/local). Returns storage key + short-lived URL. */
export async function uploadPrivateFile(
  file: File,
  purpose: UploadPurpose = 'kyc',
): Promise<UploadedPrivateFile> {
  const mime = file.type || 'application/octet-stream';
  const allowDocs = purpose === 'kyc' || purpose === 'doc';
  const allowImages = purpose === 'kyc' || purpose === 'doc' || purpose === 'photo' || purpose === 'profile';

  if (allowImages && IMAGE_MIME.has(mime)) {
    // ok
  } else if (allowDocs && (DOC_MIME.has(mime) || IMAGE_MIME.has(mime))) {
    // ok
  } else if (purpose === 'photo' || purpose === 'profile') {
    throw new Error('Please upload an image (JPG, PNG, or WEBP).');
  } else {
    throw new Error('Please upload an image (JPG, PNG, WEBP), PDF, or Word document.');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File must be 2 MB or smaller.');
  }

  const dataUrl = await readFileAsDataUrl(file);

  const res = await apiFetch('/api/v1/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: mime,
      data: dataUrl,
      purpose,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? 'Upload failed.');
  }

  return {
    storageKey: body.storageKey,
    fileName: body.fileName,
    mimeType: body.mimeType,
    url: body.url,
    size: body.size,
  };
}
