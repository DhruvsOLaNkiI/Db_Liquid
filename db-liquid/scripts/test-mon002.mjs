/**
 * MON-002–006 monitoring wiring smoke test — npm run test:mon002
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

console.log('=== MON-002–006 Monitoring Wiring Test ===\n');

console.log('1. Packages declared');
const pkg = JSON.parse(read('package.json'));
assert.ok(pkg.dependencies.pino);
assert.ok(pkg.dependencies['pino-http']);
assert.ok(pkg.devDependencies['pino-pretty'] || pkg.dependencies['pino-pretty']);
console.log('   ✓');

console.log('\n2. Logger + request IDs (MON-002)');
const logger = read('server/logger.ts');
assert.match(logger, /pino-http/);
assert.match(logger, /X-Request-Id/);
assert.match(logger, /LOG_LEVEL/);
const index = read('server/index.ts');
assert.match(index, /requestLoggingMiddleware/);
assert.match(index, /exposeRequestId/);
console.log('   ✓');

console.log('\n3. Health probe + DB-down alert (MON-003 / MON-004)');
assert.match(index, /health\.check_failed/);
assert.match(index, /\/api\/health/);
assert.match(read('docs/completed/MON-002-006-monitoring.md'), /UptimeRobot/);
console.log('   ✓');

console.log('\n4. Bid failure alerts (MON-004)');
assert.match(index, /reportBidFailure/);
assert.match(index, /bid\.rejected|bid\.failed/);
assert.match(read('docs/completed/MON-002-006-monitoring.md'), /Deferred/);
console.log('   ✓');

console.log('\n5. Product funnel (MON-005)');
const events = read('server/productEvents.ts');
assert.match(events, /signup/);
assert.match(events, /top_up/);
assert.match(events, /place_bid/);
assert.match(events, /accept_bid/);
assert.match(index, /trackProductEvent/);
assert.match(index, /\/api\/admin\/product-events/);
assert.match(read('server/routes/v1/users.ts'), /top_up/);
console.log('   ✓');

console.log('\n6. Admin audit log (MON-006)');
const audit = read('server/adminAudit.ts');
assert.match(audit, /admin_audit_log/);
assert.match(audit, /kyc_aadhar_verify/);
assert.match(audit, /listing_doc_approve/);
assert.match(index, /appendAdminAudit/);
assert.match(index, /\/api\/admin\/audit/);
console.log('   ✓');

console.log('\n7. Env example documents LOG_LEVEL');
assert.match(read('.env.example'), /LOG_LEVEL/);
console.log('   ✓');

console.log('\n=== MON-002–006 passed ===');
