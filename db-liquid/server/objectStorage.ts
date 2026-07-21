import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_UPLOAD_DIR = path.join(__dirname, '../data/private-uploads');

const SIGNED_URL_TTL_SEC = 60 * 15; // 15 minutes

export type StoredObjectMeta = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  driver: 'local' | 's3';
};

function getSigningSecret() {
  return process.env.JWT_SECRET || process.env.FILE_SIGNING_SECRET || 'dev-file-signing-secret';
}

function useS3() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT; // R2: https://<accountid>.r2.cloudflarestorage.com
  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

function ensureLocalDir() {
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

function extensionFor(mimeType: string, fileName: string) {
  const fromName = path.extname(fileName);
  if (fromName) return fromName.toLowerCase();
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'application/pdf') return '.pdf';
  if (mimeType === 'application/msword') return '.doc';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return '.docx';
  }
  if (mimeType === 'video/mp4') return '.mp4';
  if (mimeType === 'video/webm') return '.webm';
  if (mimeType === 'video/quicktime') return '.mov';
  return '.jpg';
}

export async function putPrivateObject(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  purpose?: string;
  /** Deterministic key (e.g. content hash) to dedupe repeated uploads. */
  key?: string;
}): Promise<StoredObjectMeta> {
  const safePurpose = (input.purpose || 'kyc').replace(/[^a-z0-9_-]/gi, '');
  const id = randomUUID();
  const ext = extensionFor(input.mimeType, input.fileName);
  const storageKey = input.key ?? `${safePurpose}/${id}${ext}`;

  if (useS3()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );
    return {
      storageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.buffer.length,
      driver: 's3',
    };
  }

  ensureLocalDir();
  const diskName = storageKey.replace(/\//g, '__');
  writeFileSync(path.join(LOCAL_UPLOAD_DIR, diskName), input.buffer);
  return {
    storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.buffer.length,
    driver: 'local',
  };
}

function signLocal(storageKey: string, expiresAt: number) {
  return createHmac('sha256', getSigningSecret())
    .update(`${storageKey}:${expiresAt}`)
    .digest('hex');
}

export function createSignedFileUrl(storageKey: string, ttlSec = SIGNED_URL_TTL_SEC): string {
  if (useS3()) {
    // Async S3 signing is handled by createSignedFileUrlAsync
    throw new Error('Use createSignedFileUrlAsync for S3');
  }
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = signLocal(storageKey, expiresAt);
  const params = new URLSearchParams({
    key: storageKey,
    expires: String(expiresAt),
    sig,
  });
  return `/api/v1/files?${params.toString()}`;
}

export async function createSignedFileUrlAsync(
  storageKey: string,
  ttlSec = SIGNED_URL_TTL_SEC,
): Promise<string> {
  if (!useS3()) {
    return createSignedFileUrl(storageKey, ttlSec);
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: storageKey,
  });
  return getS3SignedUrl(client, command, { expiresIn: ttlSec });
}

export function verifyLocalSignedRequest(storageKey: string, expires: string, sig: string) {
  const expiresAt = Number(expires);
  if (!storageKey || !Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) {
    return false;
  }
  const expected = signLocal(storageKey, expiresAt);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function openLocalObjectStream(storageKey: string, options?: { start?: number; end?: number }) {
  ensureLocalDir();
  const diskName = storageKey.replace(/\//g, '__');
  const fullPath = path.join(LOCAL_UPLOAD_DIR, diskName);
  if (!existsSync(fullPath)) return null;
  return createReadStream(fullPath, options);
}

export function getLocalObjectStat(storageKey: string) {
  ensureLocalDir();
  const diskName = storageKey.replace(/\//g, '__');
  const fullPath = path.join(LOCAL_UPLOAD_DIR, diskName);
  if (!existsSync(fullPath)) return null;
  return statSync(fullPath);
}

export async function readLocalObject(storageKey: string) {
  ensureLocalDir();
  const diskName = storageKey.replace(/\//g, '__');
  const fullPath = path.join(LOCAL_UPLOAD_DIR, diskName);
  if (!existsSync(fullPath)) return null;
  return readFile(fullPath);
}

export function getStorageDriver(): 'local' | 's3' {
  return useS3() ? 's3' : 'local';
}

export function parseDataUrlOrBase64(raw: string): { buffer: Buffer; mimeType?: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(raw);
  if (match) {
    return { buffer: Buffer.from(match[2], 'base64'), mimeType: match[1] };
  }
  return { buffer: Buffer.from(raw, 'base64') };
}
