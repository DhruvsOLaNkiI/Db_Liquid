/**
 * AUTH-006 RBAC test — run from db-liquid/:  npm run test:auth006
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.AUTH006_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.AUTH006_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

async function main() {
  console.log('=== AUTH-006 RBAC Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. Admin route without login');
  const unauth = await client.api('/api/admin/users');
  console.log('   Status:', unauth.status, unauth.status === 401 ? '✓' : '✗');
  if (unauth.status !== 401) process.exit(1);

  console.log('\n2. Login as member');
  await client.ensureCsrf();
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Status:', login.status, login.ok ? '✓' : '✗', login.data?.error ?? '');
  if (!login.ok) process.exit(1);

  const roles = login.data.user?.roles ?? [];
  const isAdmin = roles.includes('admin');
  console.log('   Roles:', roles.join(', ') || '(none)');

  console.log('\n3. Member cannot self-grant admin via PATCH /api/v1/users/me');
  const escalate = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles: ['buyer', 'seller', 'admin'] }),
  });
  console.log(
    '   Status:',
    escalate.status,
    escalate.status === 400 || escalate.status === 403 ? '✓ blocked' : '✗',
    escalate.data?.error ?? '',
  );
  if (escalate.status !== 400 && escalate.status !== 403) process.exit(1);

  console.log('\n4. Admin APIs');
  const adminUsers = await client.api('/api/admin/users');
  if (isAdmin) {
    console.log('   Status:', adminUsers.status, adminUsers.ok ? '✓ admin allowed' : '✗');
    if (!adminUsers.ok) process.exit(1);
  } else {
    console.log(
      '   Status:',
      adminUsers.status,
      adminUsers.status === 403 ? '✓ member blocked' : '✗',
    );
    if (adminUsers.status !== 403) process.exit(1);
  }

  console.log('\n=== AUTH-006 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
