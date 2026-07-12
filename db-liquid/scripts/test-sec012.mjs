/**
 * SEC-012 health response test — run from db-liquid/:  npm run test:sec012
 */
import 'dotenv/config';

const API = process.env.API_URL ?? 'http://localhost:3001';

async function main() {
  console.log('=== SEC-012 Sanitize /api/health Test ===\n');

  let res;
  try {
    res = await fetch(`${API}/api/health`);
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const body = await res.json().catch(() => ({}));
  console.log('1. GET /api/health');
  console.log('   Status:', res.status, res.ok ? '✓' : '✗');
  console.log('   Body:', JSON.stringify(body));

  const forbiddenKeys = ['uri', 'db', 'storage', 'error', 'mongodb', 'host', 'connection'];
  const leaked = Object.keys(body).filter((key) =>
    forbiddenKeys.some((f) => key.toLowerCase().includes(f)),
  );

  if (leaked.length > 0) {
    console.log('   ✗ Leaked keys:', leaked.join(', '));
    process.exit(1);
  }

  if (body.ok !== true && body.ok !== false) {
    console.log('   ✗ Expected { ok: boolean } only');
    process.exit(1);
  }

  const bodyStr = JSON.stringify(body).toLowerCase();
  if (bodyStr.includes('mongodb') || bodyStr.includes('mongodb+srv') || bodyStr.includes('@')) {
    console.log('   ✗ Response still contains DB connection details');
    process.exit(1);
  }

  console.log('   ✓ No DB URI/details exposed');
  console.log('\n=== SEC-012 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
