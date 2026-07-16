/**
 * MON-001 Sentry wiring smoke test — npm run test:mon001
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== MON-001 Sentry Wiring Test ===\n');

console.log('1. Packages declared');
const pkg = JSON.parse(read('package.json'));
assert.ok(pkg.dependencies['@sentry/react']);
assert.ok(pkg.dependencies['@sentry/node']);
console.log('   ✓');

console.log('\n2. Frontend init + ErrorBoundary');
const main = read('src/main.tsx');
assert.match(main, /initBrowserSentry/);
assert.match(main, /Sentry\.ErrorBoundary/);
assert.match(read('src/sentry.ts'), /VITE_SENTRY_DSN/);
console.log('   ✓');

console.log('\n3. Backend init + Express error handler');
const index = read('server/index.ts');
assert.match(index, /initServerSentry/);
assert.match(index, /setupSentryErrorHandler/);
assert.match(read('server/sentry.ts'), /SENTRY_DSN/);
console.log('   ✓');

console.log('\n4. Env example documents DSNs');
const env = read('.env.example');
assert.match(env, /VITE_SENTRY_DSN/);
assert.match(env, /SENTRY_DSN/);
console.log('   ✓');

console.log('\n=== MON-001 passed ===');
console.log('Add your DSNs to .env, restart, then open Sentry Issues.');
