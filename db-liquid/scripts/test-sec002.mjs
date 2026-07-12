/**
 * SEC-002 manual test helper — run from db-liquid/:  npm run test:sec002
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC002_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC002_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== SEC-002 Server Auth Middleware Test ===\n');

  const client = createApiClient(API);

  try {
    const health = await fetch(`${API}/api/health`).then((r) => r.json());
    console.log('1. API health:', health.ok ? 'OK' : 'FAIL');
  } catch {
    console.log('1. API health: FAIL — run: npm run dev');
    process.exit(1);
  }

  console.log('\n2. PUT /api/users without login');
  client.clearAll();
  const unauthPut = await client.api('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'fake', email: 'hack@test.com', credits: 999999 }]),
  });
  console.log('   Status:', unauthPut.status, unauthPut.status === 401 ? '✓ blocked' : '✗ should be 401');

  console.log('\n3. GET /api/admin/users without login');
  const unauthAdmin = await client.api('/api/admin/users');
  console.log('   Status:', unauthAdmin.status, unauthAdmin.status === 401 ? '✓ blocked' : '✗ should be 401');

  console.log(`\n4. Login as ${TEST_EMAIL}`);
  client.clearAll();
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Login:', login.ok ? 'SUCCESS' : `FAIL (${login.data.error ?? login.status})`);
  console.log('   Session cookie set:', client.getCookie('db_liquid_session') ? 'YES ✓' : 'NO ✗');

  console.log('\n5. GET /api/auth/me with cookie');
  const me = await client.api('/api/auth/me');
  console.log('   /me:', me.ok ? `SUCCESS (${me.data.user?.email})` : `FAIL (${me.status})`);

  console.log('\n6. PUT /api/listings with cookie (legacy endpoint blocked)');
  const authListingsPut = await client.api('/api/listings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log(
    '   Status:',
    authListingsPut.status,
    authListingsPut.status === 403 ? '✓ deprecated/blocked' : '✗ should be 403',
  );

  console.log('\n7. GET /api/admin/users with non-admin cookie');
  const nonAdmin = await client.api('/api/admin/users');
  console.log('   Status:', nonAdmin.status, nonAdmin.status === 403 ? '✓ blocked (403)' : `got ${nonAdmin.status}`);

  console.log('\n8. POST /api/auth/logout');
  const logout = await client.api('/api/auth/logout', { method: 'POST' });
  console.log('   Logout:', logout.ok ? 'SUCCESS' : 'FAIL');

  console.log('\n9. GET /api/auth/me after logout');
  const meAfter = await client.api('/api/auth/me');
  console.log('   /me:', meAfter.status === 401 ? '✓ blocked' : '✗ should be 401');

  console.log('\n=== Browser test ===');
  console.log('   DevTools → Application → Cookies → localhost');
  console.log('   After login you should see httpOnly db_liquid_session cookie');
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
