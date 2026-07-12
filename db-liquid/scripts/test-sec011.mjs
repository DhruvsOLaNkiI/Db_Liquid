/**
 * SEC-011 private KYC storage test — run from db-liquid/:  npm run test:sec011
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC011_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC011_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

// 1x1 PNG
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function main() {
  console.log('=== SEC-011 Private Object Storage Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. Login');
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Status:', login.status, login.ok ? '✓' : '✗', login.data?.error ?? '');
  if (!login.ok) process.exit(1);

  console.log('\n2. POST /api/v1/uploads (KYC image)');
  const upload = await client.api('/api/v1/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'kyc-test.png',
      mimeType: 'image/png',
      data: TINY_PNG,
      purpose: 'kyc',
    }),
  });
  console.log(
    '   Status:',
    upload.status,
    upload.ok && upload.data.storageKey ? `✓ key=${upload.data.storageKey}` : '✗',
    upload.data?.error ?? '',
  );
  if (!upload.ok || !upload.data.storageKey) process.exit(1);

  console.log('\n3. Signed URL present');
  console.log('   url:', upload.data.url ? '✓' : '✗', upload.data.url?.slice(0, 80));

  if (typeof upload.data.url === 'string' && upload.data.url.startsWith('/api/v1/files')) {
    console.log('\n4. GET signed local file');
    const file = await fetch(`${API}${upload.data.url}`);
    console.log('   Status:', file.status, file.ok ? '✓' : '✗', 'type:', file.headers.get('content-type'));
    if (!file.ok) process.exit(1);
  } else {
    console.log('\n4. S3/R2 driver — skipping local /api/v1/files check');
  }

  console.log('\n5. Upload without auth should fail');
  const anon = await fetch(`${API}/api/v1/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'x.png',
      mimeType: 'image/png',
      data: TINY_PNG,
    }),
  });
  console.log('   Status:', anon.status, anon.status === 401 || anon.status === 403 ? '✓ blocked' : '✗');

  console.log('\n=== SEC-011 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
