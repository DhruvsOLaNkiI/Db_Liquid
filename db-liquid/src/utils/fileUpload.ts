import { apiFetch } from './api';
import { optimizeImageForUpload } from './optimizeImage';

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

  const optimized = await optimizeImageForUpload(file);
  if (optimized.size > MAX_FILE_BYTES) {
    throw new Error('Image must be 2 MB or smaller after optimization.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(optimized);
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

export type UploadPurpose = 'kyc' | 'photo' | 'profile' | 'doc' | 'video';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

/** Upload property video as raw binary to object storage (R2/S3/local). Max 50 MB. */
export async function uploadPrivateVideo(file: File): Promise<UploadedPrivateFile> {
  const mime = (file.type || '').toLowerCase();
  if (!VIDEO_MIME.has(mime)) {
    throw new Error('Please upload a video (MP4, WEBM, or MOV).');
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Video must be 50 MB or smaller.');
  }

  const res = await apiFetch('/api/v1/uploads/binary', {
    method: 'POST',
    headers: {
      'Content-Type': mime,
      'X-File-Name': file.name || 'property-video.mp4',
      'X-Upload-Purpose': 'video',
    },
    body: file,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? 'Video upload failed.');
  }

  return {
    storageKey: body.storageKey,
    fileName: body.fileName,
    mimeType: body.mimeType,
    url: body.url,
    size: body.size,
  };
}

/** Upload file to private object storage (R2/S3/local). Returns storage key + short-lived URL. */
export async function uploadPrivateFile(
  file: File,
  purpose: UploadPurpose = 'kyc',
): Promise<UploadedPrivateFile> {
  let uploadFile = file;
  const mime = file.type || 'application/octet-stream';
  const allowDocs = purpose === 'kyc' || purpose === 'doc';
  const allowImages = purpose === 'kyc' || purpose === 'doc' || purpose === 'photo' || purpose === 'profile';

  if (allowImages && IMAGE_MIME.has(mime)) {
    // Property / profile photos → WebP + max edge resize (PERF-008)
    if (purpose === 'photo' || purpose === 'profile') {
      uploadFile = await optimizeImageForUpload(file);
    }
  } else if (allowDocs && (DOC_MIME.has(mime) || IMAGE_MIME.has(mime))) {
    // ok
  } else if (purpose === 'photo' || purpose === 'profile') {
    throw new Error('Please upload an image (JPG, PNG, or WEBP).');
  } else {
    throw new Error('Please upload an image (JPG, PNG, WEBP), PDF, or Word document.');
  }

  if (uploadFile.size > MAX_FILE_BYTES) {
    throw new Error('File must be 2 MB or smaller.');
  }

  const dataUrl = await readFileAsDataUrl(uploadFile);
  const uploadMime = uploadFile.type || mime;

  const res = await apiFetch('/api/v1/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: uploadFile.name,
      mimeType: uploadMime,
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
