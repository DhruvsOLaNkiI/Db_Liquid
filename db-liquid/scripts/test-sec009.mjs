/**
 * SEC-009 manual test helper — run from db-liquid/:  npm run test:sec009
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC009_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC009_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== SEC-009 Input Validation (Zod) Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. POST /api/auth/login — missing password');
  const badLogin = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.com' }),
  });
  console.log(
    '   Status:',
    badLogin.status,
    badLogin.status === 400 ? '✓ rejected' : '✗',
    badLogin.data.error ? `(${badLogin.data.error})` : '',
  );

  console.log('\n2. POST /api/auth/register — invalid email');
  const badReg = await client.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: 'abcdef', name: 'A', phone: '1' }),
  });
  console.log(
    '   Status:',
    badReg.status,
    badReg.status === 400 ? '✓ rejected' : '✗',
    badReg.data.error ? `(${badReg.data.error})` : '',
  );

  console.log('\n3. POST /api/listings/:id/record-view — missing visitorId');
  const badView = await client.api('/api/listings/any-id/record-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log(
    '   Status:',
    badView.status,
    badView.status === 400 ? '✓ rejected' : '✗',
    badView.data.error ? `(${badView.data.error})` : '',
  );

  console.log(`\n4. Login as ${TEST_EMAIL}`);
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Login:', login.ok ? 'SUCCESS' : `FAIL (${login.data.error ?? login.status})`);

  console.log('\n5. PUT /api/v1/listings/sync — not an array');
  const badSync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'x' }),
  });
  console.log(
    '   Status:',
    badSync.status,
    badSync.status === 400 ? '✓ rejected' : '✗',
    badSync.data.error ? `(${badSync.data.error})` : '',
  );

  console.log('\n6. PUT /api/v1/listings/sync — empty array (valid)');
  const okSync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  console.log('   Status:', okSync.status, okSync.ok ? '✓ allowed' : '✗');

  console.log('\n7. PATCH /api/v1/users/me — unknown field rejected (strict)');
  const badPatch = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'hacked' }),
  });
  console.log(
    '   Status:',
    badPatch.status,
    badPatch.status === 400 ? '✓ rejected' : '✗',
    badPatch.data.error ? `(${badPatch.data.error})` : '',
  );

  console.log('\n8. POST /api/admin/users/review-kyc — invalid field (auth may 401/403 first)');
  client.clearAll();
  const badKyc = await client.api('/api/admin/users/review-kyc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'x', field: 'ssn', verified: true }),
  });
  console.log(
    '   Status:',
    badKyc.status,
    [400, 401, 403].includes(badKyc.status) ? '✓ blocked' : '✗',
  );

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
