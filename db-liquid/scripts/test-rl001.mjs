/**
 * RL-001 API rate limit test — run from db-liquid/:
 * API_RATE_LIMIT_MAX=5 API_URL=http://localhost:3021 npm run test:rl001
 *
 * Start API with a low max for this test, e.g.:
 * API_PORT=3021 API_RATE_LIMIT_MAX=5 API_RATE_LIMIT_WINDOW_MS=60000 node --import tsx server/index.ts
 */
import 'dotenv/config';

const API = process.env.API_URL ?? 'http://localhost:3001';
const MAX = Number(process.env.API_RATE_LIMIT_MAX ?? 5);

async function main() {
  console.log('=== RL-001 API Rate Limit Test ===\n');
  console.log(`Target: ${API} (expect trip after ~${MAX} /api calls)\n`);

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with a low API_RATE_LIMIT_MAX for this test');
    process.exit(1);
  }

  console.log('1. /api/health should remain unlimited');
  for (let i = 0; i < MAX + 3; i += 1) {
    const res = await fetch(`${API}/api/health`);
    if (res.status !== 200) {
      console.log('   ✗ health blocked at', i + 1, res.status);
      process.exit(1);
    }
  }
  console.log('   ✓ health still 200');

  console.log('\n2. Burn the /api budget via /api/auth/csrf');
  let hit429 = false;
  let lastStatus = 0;
  for (let i = 0; i < MAX + 5; i += 1) {
    const res = await fetch(`${API}/api/auth/csrf`);
    lastStatus = res.status;
    if (res.status === 429) {
      hit429 = true;
      const data = await res.json().catch(() => ({}));
      const retryAfter = res.headers.get('retry-after');
      console.log('   Hit 429 at request', i + 1, '✓');
      console.log('   Retry-After:', retryAfter ?? '(missing)');
      console.log('   Body:', data.error ?? data);
      if (!retryAfter && data.retryAfterSec == null) {
        console.log('   ✗ Missing retry hint');
        process.exit(1);
      }
      break;
    }
  }

  if (!hit429) {
    console.log('   ✗ Never got 429 (last status', lastStatus, ')');
    console.log('   Tip: restart API with API_RATE_LIMIT_MAX=5');
    process.exit(1);
  }

  console.log('\n=== RL-001 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
