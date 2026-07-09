/**
 * SEC-004 / SEC-005 / SEC-007 manual test helper — run from db-liquid/:  npm run test:sec004
 */
import 'dotenv/config';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC004_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC004_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

let sessionCookie = '';

async function api(path, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  if (sessionCookie) headers.Cookie = sessionCookie;

  const res = await fetch(`${API}${path}`, { ...init, headers });
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);

  for (const raw of setCookies) {
    if (typeof raw === 'string' && raw.startsWith('db_liquid_session=')) {
      sessionCookie = raw.split(';')[0];
    }
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function login() {
  sessionCookie = '';
  return api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
}

async function main() {
  console.log('=== SEC-004 / SEC-005 / SEC-007 Tests ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  console.log('SEC-004 — Protect listings writes');
  console.log('1. Legacy PUT /api/listings without login');
  const unauth = await api('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', unauth.status, unauth.status === 401 ? '✓ blocked' : '✗');

  const auth = await login();
  console.log('\n2. Login:', auth.ok ? 'SUCCESS' : 'FAIL');

  console.log('\n3. Legacy PUT /api/listings while logged in');
  const legacy = await api('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'fake-listing', sellerId: 'other', bids: [] }]),
  });
  console.log('   Status:', legacy.status, legacy.status === 403 ? '✓ deprecated/blocked' : '✗');
  console.log('   use.sync:', legacy.data.use?.sync ?? legacy.data.error);

  console.log('\n4. PUT /api/v1/listings/sync — reject other seller listing');
  const badSync = await api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'hack-listing', sellerId: 'not-me', bids: [] }]),
  });
  console.log('   Status:', badSync.status, badSync.status === 403 ? '✓ blocked' : '✗');

  console.log('\n5. PUT /api/v1/listings/sync — empty array allowed');
  const okSync = await api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', okSync.status, okSync.ok ? '✓ allowed' : '✗');

  console.log('\nSEC-005 — Admin APIs');
  console.log('6. GET /api/admin/users without login');
  sessionCookie = '';
  const unauthAdmin = await api('/api/admin/users');
  console.log('   Status:', unauthAdmin.status, unauthAdmin.status === 401 ? '✓ blocked' : '✗');

  await login();
  console.log('\n7. GET /api/admin/users as non-admin');
  const nonAdmin = await api('/api/admin/users');
  console.log('   Status:', nonAdmin.status, nonAdmin.status === 403 ? '✓ blocked' : '✗');

  console.log('\nSEC-007 — Viewer id from session only');
  console.log('8. GET /api/listings with spoofed X-Viewer-User-Id (no cookie)');
  sessionCookie = '';
  const spoof = await fetch(`${API}/api/listings`, {
    headers: { 'X-Viewer-User-Id': 'fake-user-id-12345' },
  });
  const spoofData = await spoof.json().catch(() => []);
  const firstListing = Array.isArray(spoofData) ? spoofData[0] : null;
  const spoofWorked =
    firstListing?.bids?.some?.((bid) => bid.bidderUserId === 'fake-user-id-12345') ?? false;
  console.log('   Spoofed viewer used:', spoofWorked ? 'YES ✗' : 'NO ✓ (anonymous sanitize)');

  console.log('\n=== Browser test (SEC-006) ===');
  console.log('   • Log out → open /admin/verification → should redirect to /login');
  console.log('   • Log in as non-admin → /admin/verification → should redirect to /login');
  console.log('   • Log in as admin → /admin/verification → should load dashboard');
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
