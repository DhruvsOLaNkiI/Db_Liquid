/**
 * AUTH-005 login rate limit + lockout — run from db-liquid/:  npm run test:auth005
 *
 * Uses a dedicated email so it does not lock your real account during normal testing.
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const LOCK_EMAIL = process.env.AUTH005_TEST_EMAIL ?? `lockout-test-${Date.now()}@example.com`;

async function loginAttempt(client, email, password) {
  return client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

async function main() {
  console.log('=== AUTH-005 Login Rate Limit + Lockout Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  // Reset in-memory counters via a small internal endpoint is not available —
  // use a unique email so prior runs do not interfere.
  const client = createApiClient(API);
  await client.ensureCsrf();

  console.log(`1. Fail login 5 times for ${LOCK_EMAIL}`);
  let lastStatus = 0;
  for (let i = 1; i <= 5; i++) {
    const res = await loginAttempt(client, LOCK_EMAIL, 'wrong-password');
    lastStatus = res.status;
    console.log(`   Attempt ${i}:`, res.status, res.data?.error ?? '');
    if (res.status !== 401) {
      console.log('   ✗ Expected 401 for failed login before lockout');
      process.exit(1);
    }
  }

  console.log('\n2. Sixth attempt should be locked (429)');
  const locked = await loginAttempt(client, LOCK_EMAIL, 'wrong-password');
  console.log(
    '   Status:',
    locked.status,
    locked.status === 429 ? '✓' : '✗',
    locked.data?.error ?? '',
  );
  if (locked.status !== 429) process.exit(1);
  if (!locked.data?.retryAfterSec) {
    console.log('   ✗ Missing retryAfterSec');
    process.exit(1);
  }
  console.log('   retryAfterSec:', locked.data.retryAfterSec);

  console.log('\n3. Valid account still works (different email)');
  const realEmail = process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
  const realPassword = process.env.SEC001_TEST_PASSWORD ?? 'x';
  const okLogin = await loginAttempt(client, realEmail, realPassword);
  console.log(
    '   Status:',
    okLogin.status,
    okLogin.ok ? '✓' : '✗',
    okLogin.data?.error ?? '',
  );
  if (!okLogin.ok) {
    console.log('   (Set SEC001_TEST_EMAIL / SEC001_TEST_PASSWORD if this fails)');
    process.exit(1);
  }

  console.log('\n=== AUTH-005 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
