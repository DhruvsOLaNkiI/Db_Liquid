import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../authMiddleware';
import {
  createSignedFileUrlAsync,
  getStorageDriver,
  openLocalObjectStream,
  parseDataUrlOrBase64,
  putPrivateObject,
  verifyLocalSignedRequest,
} from '../../objectStorage';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function uploadPrivateFile(req: AuthenticatedRequest, res: Response) {
  const fileName = typeof req.body?.fileName === 'string' ? req.body.fileName.trim() : '';
  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType.trim().toLowerCase() : '';
  const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : 'kyc';
  const data = typeof req.body?.data === 'string' ? req.body.data : '';

  if (!fileName || !mimeType || !data) {
    res.status(400).json({ error: 'fileName, mimeType, and data are required.' });
    return;
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    res.status(400).json({ error: 'Only JPG, PNG, WEBP, PDF, or Word documents are allowed.' });
    return;
  }

  try {
    const parsed = parseDataUrlOrBase64(data);
    const buffer = parsed.buffer;
    if (!buffer.length) {
      res.status(400).json({ error: 'Empty file.' });
      return;
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: 'File must be 2 MB or smaller.' });
      return;
    }

    const stored = await putPrivateObject({
      buffer,
      fileName,
      mimeType: parsed.mimeType || mimeType,
      purpose,
    });

    const url = await createSignedFileUrlAsync(stored.storageKey);
    res.status(201).json({
      ok: true,
      storageKey: stored.storageKey,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      size: stored.size,
      driver: stored.driver,
      url,
    });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
}

/** Public signed access for local driver; S3 uses external presigned URLs. */
export async function serveSignedFile(req: AuthenticatedRequest, res: Response) {
  const storageKey = typeof req.query.key === 'string' ? req.query.key : '';
  const expires = typeof req.query.expires === 'string' ? req.query.expires : '';
  const sig = typeof req.query.sig === 'string' ? req.query.sig : '';

  if (!storageKey || !expires || !sig) {
    res.status(400).json({ error: 'Missing signed URL parameters.' });
    return;
  }

  if (getStorageDriver() === 's3') {
    res.status(400).json({ error: 'S3 files are served via external signed URLs.' });
    return;
  }

  if (!verifyLocalSignedRequest(storageKey, expires, sig)) {
    res.status(403).json({ error: 'Invalid or expired file link.' });
    return;
  }

  const stream = openLocalObjectStream(storageKey);
  if (!stream) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  const lower = storageKey.toLowerCase();
  const contentType = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
      ? 'image/webp'
      : lower.endsWith('.pdf')
        ? 'application/pdf'
        : lower.endsWith('.doc')
          ? 'application/msword'
          : lower.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'image/jpeg';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'private, max-age=60');
  stream.pipe(res);
}

export async function attachSignedUrlsToDocs<
  T extends { storageKey?: string; dataUrl?: string; mimeType?: string },
>(docs: T[] | undefined): Promise<T[]> {
  if (!docs?.length) return docs ?? [];

  return Promise.all(
    docs.map(async (doc) => {
      if (doc.storageKey) {
        const url = await createSignedFileUrlAsync(doc.storageKey);
        return { ...doc, dataUrl: url, url };
      }
      return doc;
    }),
  );
}

/** Sign property photos for all viewers; drop storageKey for non-sellers. */
export async function attachSignedUrlsToListingMedia<
  T extends {
    sellerId?: string;
    verificationDocuments?: { storageKey?: string; dataUrl?: string }[];
    propertyPhotos?: { storageKey?: string; dataUrl?: string }[];
  },
>(listing: T, viewerId?: string): Promise<T> {
  const isSeller = Boolean(viewerId && listing.sellerId === viewerId);
  let next = { ...listing };

  if (next.propertyPhotos?.length) {
    const photos = await attachSignedUrlsToDocs(next.propertyPhotos);
    next = {
      ...next,
      propertyPhotos: isSeller
        ? photos
        : photos.map(({ storageKey: _key, ...rest }) => rest as (typeof photos)[number]),
    };
  }

  if (isSeller && next.verificationDocuments?.length) {
    next = {
      ...next,
      verificationDocuments: await attachSignedUrlsToDocs(next.verificationDocuments),
    };
  }

  return next;
}

export function isObjectStorageKey(value?: string | null) {
  if (!value) return false;
  return (
    !value.startsWith('data:') &&
    !value.startsWith('http://') &&
    !value.startsWith('https://') &&
    !value.startsWith('blob:')
  );
}

export async function resolveStoredImageUrl(value?: string | null) {
  if (!value) return undefined;
  if (!isObjectStorageKey(value)) return value;
  return createSignedFileUrlAsync(value);
}

/** Present user to client: signed profile image URL + stable profileImageKey for re-save. */
export async function presentUser<T extends { id: string; profileImageUrl?: string }>(
  user: T,
  sanitized: Record<string, unknown>,
) {
  const raw = user.profileImageUrl;
  if (!raw || !isObjectStorageKey(raw)) {
    return sanitized;
  }
  return {
    ...sanitized,
    profileImageKey: raw,
    profileImageUrl: await resolveStoredImageUrl(raw),
  };
}
