/**
 * SEC-003 manual test helper — run from db-liquid/:  npm run test:sec003
 */
import 'dotenv/config';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC003_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC003_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

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
  console.log('=== SEC-003 Protect PUT /api/users Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  console.log('1. Legacy PUT /api/users without login');
  const unauth = await api('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'fake', credits: 999999 }]),
  });
  console.log('   Status:', unauth.status, unauth.status === 401 ? '✓ blocked' : '✗');

  const auth = await login();
  console.log('\n2. Login:', auth.ok ? 'SUCCESS' : 'FAIL');

  console.log('\n3. Legacy PUT /api/users while logged in (non-admin)');
  const legacy = await api('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'other-user', credits: 999999 }]),
  });
  console.log('   Status:', legacy.status, legacy.status === 403 ? '✓ deprecated/blocked' : '✗');
  console.log('   use.self:', legacy.data.use?.self ?? legacy.data.error);

  console.log('\n4. PATCH /api/v1/users/me — update own name');
  const meBefore = await api('/api/auth/me');
  const patch = await api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: meBefore.data.user?.name ?? 'Test User' }),
  });
  console.log('   Status:', patch.status, patch.ok ? '✓ self update works' : '✗');

  console.log('\n5. PATCH /api/v1/users/me — reject admin role escalation');
  const escalate = await api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles: ['buyer', 'seller', 'admin'] }),
  });
  const meAfter = await api('/api/auth/me');
  const hasAdmin = meAfter.data.user?.roles?.includes('admin');
  console.log('   Escalate status:', escalate.status);
  console.log('   Admin role granted:', hasAdmin ? 'YES ✗' : 'NO ✓');

  console.log('\n6. PUT /api/v1/admin/users without admin role');
  const adminPut = await api('/api/v1/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', adminPut.status, adminPut.status === 403 ? '✓ blocked' : '✗');

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
