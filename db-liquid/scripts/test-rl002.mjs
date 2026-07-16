/**
 * RL-002 per-route rate limit test — run from db-liquid/:
 * Start API with lowered login limit, e.g.:
 * API_PORT=3022 LOGIN_RATE_LIMIT_MAX=2 API_RATE_LIMIT_MAX=200 node --import tsx server/index.ts
 * API_URL=http://localhost:3022 LOGIN_RATE_LIMIT_MAX=2 npm run test:rl002
 */
import 'dotenv/config';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const LOGIN_MAX = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 2);

async function main() {
  console.log('=== RL-002 Per-Route Rate Limit Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with LOGIN_RATE_LIMIT_MAX=2 for this test');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log(`1. POST /api/auth/login should 429 after ${LOGIN_MAX} attempts`);
  let hit429 = false;
  for (let i = 0; i < LOGIN_MAX + 3; i += 1) {
    const res = await client.api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rl002-spam@example.com', password: 'wrong-password' }),
    });
    if (res.status === 429) {
      hit429 = true;
      console.log('   Hit 429 at attempt', i + 1, '✓', res.data?.error ?? '');
      if (!String(res.data?.error ?? '').toLowerCase().includes('login')) {
        console.log('   ✗ Expected login-specific error message');
        process.exit(1);
      }
      break;
    }
  }
  if (!hit429) {
    console.log('   ✗ Never hit login rate limit');
    console.log('   Tip: restart API with LOGIN_RATE_LIMIT_MAX=2 API_RATE_LIMIT_MAX=200');
    process.exit(1);
  }

  console.log('\n2. Signup limiter middleware is mounted (smoke)');
  // Create up to SIGNUP_RATE_LIMIT_MAX+1 with a tiny window overridden in dedicated env — here we only
  // verify the route still accepts a valid unique signup once login limiter tripped (different bucket).
  const stamp = Date.now();
  const other = createApiClient(API);
  const signup = await other.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `rl002-ok-${stamp}@example.com`,
      password: 'Rl002Test1!',
      name: 'RL002 User',
      phone: '9999990022',
    }),
  });
  console.log('   Signup status:', signup.status, signup.ok || signup.status === 409 ? '✓' : '✗', signup.data?.error ?? '');
  if (!signup.ok && signup.status !== 409) process.exit(1);

  console.log('\n=== RL-002 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
