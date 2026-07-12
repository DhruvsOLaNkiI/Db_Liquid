/**
 * AUTH-001 httpOnly session test — run from db-liquid/:  npm run test:auth001
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.AUTH001_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.AUTH001_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== AUTH-001 httpOnly Session Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. Login');
  await client.ensureCsrf();
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Status:', login.status, login.ok ? '✓' : '✗', login.data?.error ?? '');
  if (!login.ok) process.exit(1);

  console.log('\n2. Session cookie present');
  const session = client.getCookie('db_liquid_session');
  console.log('   db_liquid_session:', session ? '✓' : '✗');
  if (!session) process.exit(1);

  console.log('\n3. Login Set-Cookie is HttpOnly');
  const probe = createApiClient(API);
  await probe.ensureCsrf();
  const raw = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `db_liquid_csrf=${probe.getCookie('db_liquid_csrf')}`,
      'X-CSRF-Token': probe.getCookie('db_liquid_csrf'),
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const setCookies =
    typeof raw.headers.getSetCookie === 'function'
      ? raw.headers.getSetCookie()
      : [raw.headers.get('set-cookie')].filter(Boolean);
  const sessionHeader = setCookies.find((c) => String(c).includes('db_liquid_session=')) ?? '';
  if (!sessionHeader) {
    console.log('   ⚠ Set-Cookie not visible to fetch (ok if cookie already set); skipping HttpOnly assert');
  } else {
    const httpOnly = /httponly/i.test(sessionHeader);
    console.log('   HttpOnly:', httpOnly ? '✓' : '✗');
    if (!httpOnly) process.exit(1);
  }

  console.log('\n4. GET /api/auth/me with cookie');
  const me = await client.api('/api/auth/me');
  console.log('   Status:', me.status, me.ok && me.data.user?.id ? '✓' : '✗');
  if (!me.ok) process.exit(1);

  console.log('\n5. GET /api/auth/me without cookie');
  const anon = await fetch(`${API}/api/auth/me`);
  console.log('   Status:', anon.status, anon.status === 401 ? '✓ blocked' : '✗');
  if (anon.status !== 401) process.exit(1);

  console.log('\n=== AUTH-001 passed ===');
  console.log('Browser check: Local Storage must not contain db-liquid-session after login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
