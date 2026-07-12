/**
 * SEC-010 CSRF protection test — run from db-liquid/:  npm run test:sec010
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC010_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC010_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== SEC-010 CSRF Protection Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. GET /api/auth/csrf');
  const csrf = await client.api('/api/auth/csrf');
  console.log(
    '   Status:',
    csrf.status,
    csrf.ok && csrf.data.csrfToken ? '✓ token issued' : '✗',
  );

  console.log('\n2. POST /api/auth/login without CSRF header');
  const noCsrf = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const noCsrfData = await noCsrf.json().catch(() => ({}));
  console.log(
    '   Status:',
    noCsrf.status,
    noCsrf.status === 403 ? '✓ blocked' : '✗',
    noCsrfData.error ? `(${noCsrfData.error})` : '',
  );

  console.log(`\n3. Login with CSRF as ${TEST_EMAIL}`);
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Login:', login.ok ? 'SUCCESS' : `FAIL (${login.data.error ?? login.status})`);

  console.log('\n4. PUT /api/v1/listings/sync with valid CSRF');
  const okSync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', okSync.status, okSync.ok ? '✓ allowed' : '✗');

  console.log('\n5. PUT /api/v1/listings/sync with wrong CSRF header');
  const badHeader = await fetch(`${API}/api/v1/listings/sync`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `db_liquid_session=${client.getCookie('db_liquid_session')}; db_liquid_csrf=${client.getCookie('db_liquid_csrf')}`,
      'X-CSRF-Token': '00000000000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    body: JSON.stringify([]),
  });
  console.log('   Status:', badHeader.status, badHeader.status === 403 ? '✓ blocked' : '✗');

  console.log('\n6. POST /api/auth/logout with CSRF');
  const logout = await client.api('/api/auth/logout', { method: 'POST' });
  console.log('   Logout:', logout.ok ? 'SUCCESS' : 'FAIL');

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
