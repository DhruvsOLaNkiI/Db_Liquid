/**
 * SEC-008 manual test helper — run from db-liquid/:  npm run test:sec008
 */
import 'dotenv/config';

const API = process.env.API_URL ?? 'http://localhost:3001';

function hasHeader(headers, name) {
  const key = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

async function main() {
  console.log('=== SEC-008 Security Headers Test ===\n');

  let res;
  try {
    res = await fetch(`${API}/api/health`);
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const headers = Object.fromEntries(res.headers.entries());

  const checks = [
    ['x-content-type-options', 'nosniff'],
    ['x-frame-options', 'DENY'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['content-security-policy', null],
    ['cross-origin-opener-policy', null],
  ];

  console.log('Response:', res.status, res.status === 200 ? 'OK' : 'FAIL');
  console.log('');

  for (const [name, expectedValue] of checks) {
    const value = hasHeader(headers, name);
    const present = Boolean(value);
    let ok = present;
    if (present && expectedValue && !String(value).toLowerCase().includes(expectedValue.toLowerCase())) {
      ok = false;
    }
    console.log(
      `${ok ? '✓' : '✗'} ${name}:`,
      present ? (value.length > 80 ? `${value.slice(0, 77)}...` : value) : 'missing',
    );
  }

  const hsts = hasHeader(headers, 'strict-transport-security');
  console.log(
    `${hsts ? '✓' : '○'} strict-transport-security:`,
    hsts ?? '(off in dev — enabled when NODE_ENV=production)',
  );

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
