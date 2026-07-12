/**
 * SEC-003 manual test helper — run from db-liquid/:  npm run test:sec003
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.SEC003_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.SEC003_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== SEC-003 Protect PUT /api/users Test ===\n');

  const client = createApiClient(API);

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  console.log('1. Legacy PUT /api/users without login');
  client.clearAll();
  const unauth = await client.api('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'fake', credits: 999999 }]),
  });
  console.log('   Status:', unauth.status, unauth.status === 401 ? '✓ blocked' : '✗');

  const auth = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('\n2. Login:', auth.ok ? 'SUCCESS' : 'FAIL');

  console.log('\n3. Legacy PUT /api/users while logged in (non-admin)');
  const legacy = await client.api('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id: 'other-user', credits: 999999 }]),
  });
  console.log('   Status:', legacy.status, legacy.status === 403 ? '✓ deprecated/blocked' : '✗');
  console.log('   use.self:', legacy.data.use?.self ?? legacy.data.error);

  console.log('\n4. PATCH /api/v1/users/me — update own name');
  const meBefore = await client.api('/api/auth/me');
  const patch = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: meBefore.data.user?.name ?? 'Test User' }),
  });
  console.log('   Status:', patch.status, patch.ok ? '✓ self update works' : '✗');

  console.log('\n5. PATCH /api/v1/users/me — reject admin role escalation');
  await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles: ['buyer', 'seller', 'admin'] }),
  });
  const meAfter = await client.api('/api/auth/me');
  const hasAdmin = meAfter.data.user?.roles?.includes('admin');
  console.log('   Admin role granted:', hasAdmin ? 'YES ✗' : 'NO ✓');

  console.log('\n6. PUT /api/v1/admin/users without admin role');
  const adminPut = await client.api('/api/v1/admin/users', {
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
