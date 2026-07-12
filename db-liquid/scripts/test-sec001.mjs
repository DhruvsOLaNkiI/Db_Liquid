/**
 * SEC-001 manual test helper — run from db-liquid/:  npm run test:sec001
 *
 * Safe output: only shows email + password storage type (plaintext | bcrypt | missing).
 * Does NOT print password values or hash strings.
 */
import 'dotenv/config';
import { getUsers } from '../server/mongoStore.ts';
import { isPasswordHashed } from '../server/password.ts';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';

function passwordKind(password) {
  if (!password) return 'missing';
  return isPasswordHashed(password) ? 'bcrypt' : 'plaintext';
}

async function main() {
  console.log('=== SEC-001 Password Hashing Test ===\n');

  const client = createApiClient(API);

  try {
    const health = await fetch(`${API}/api/health`).then((r) => r.json());
    console.log('1. API health:', health.ok ? 'OK' : 'FAIL', `(${health.storage})`);
  } catch {
    console.log('1. API health: FAIL — start server with: npm run dev');
    process.exit(1);
  }

  const usersBefore = await getUsers();
  console.log('\n2. Users in MongoDB:', usersBefore.length);
  for (const u of usersBefore) {
    console.log(`   - ${u.email} → password: ${passwordKind(u.password)}`);
  }

  const testEmail = process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
  const testPassword = process.env.SEC001_TEST_PASSWORD ?? 'x';

  console.log(`\n3. Login test: ${testEmail}`);
  const login1 = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  console.log('   First login:', login1.ok ? 'SUCCESS' : `FAIL (${login1.data.error ?? login1.status})`);

  const usersAfterLogin = await getUsers();
  const testUser = usersAfterLogin.find((u) => u.email?.toLowerCase() === testEmail.toLowerCase());
  const kindAfter = passwordKind(testUser?.password);
  console.log('   Password in DB after login:', kindAfter);
  if (kindAfter === 'bcrypt') {
    console.log('   ✓ Migration worked — legacy plaintext upgraded to bcrypt');
  } else if (kindAfter === 'plaintext') {
    console.log('   ⚠ Still plaintext — login may have failed or user was re-imported as plain');
  }

  const login2 = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  console.log(
    '\n4. Second login (bcrypt verify):',
    login2.ok ? 'SUCCESS' : `FAIL (${login2.data.error ?? login2.status})`,
  );

  const bad = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'wrong-password-xyz' }),
  });
  console.log('\n5. Wrong password rejected:', !bad.ok ? 'YES ✓' : 'NO ✗ (should fail)');

  console.log('\n=== Browser tests (manual) ===');
  console.log('   • Open http://localhost:3000/login');
  console.log(`   • Log in as ${testEmail}`);
  console.log('   • Profile → Change password → log in with new password');
  console.log('   • Signup page → create new account → run this script again to see bcrypt on new user');
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
