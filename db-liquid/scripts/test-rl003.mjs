/**
 * RL-003 Cloudflare readiness test — run from db-liquid/: npm run test:rl003
 */
import assert from 'node:assert/strict';
import { getClientIp, requireCloudflareProxy } from '../server/cloudflare.ts';

function mockReq(headers = {}, extras = {}) {
  return {
    headers,
    path: '/api/listings',
    ip: '10.0.0.1',
    socket: { remoteAddress: '10.0.0.1' },
    ...extras,
  };
}

function mockRes() {
  const state = { statusCode: 0, body: null };
  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
  };
}

async function main() {
  console.log('=== RL-003 Cloudflare Readiness Test ===\n');

  console.log('1. Prefer CF-Connecting-IP');
  assert.equal(
    getClientIp(mockReq({ 'cf-connecting-ip': '203.0.113.50', 'x-forwarded-for': '1.2.3.4' })),
    '203.0.113.50',
  );
  console.log('   ✓');

  console.log('\n2. Fall back to X-Forwarded-For when CF header missing');
  assert.equal(getClientIp(mockReq({ 'x-forwarded-for': '198.51.100.7, 10.0.0.1' })), '198.51.100.7');
  console.log('   ✓');

  console.log('\n3. REQUIRE_CLOUDFLARE off → allow without CF-Ray');
  process.env.REQUIRE_CLOUDFLARE = 'false';
  let nextCalled = false;
  requireCloudflareProxy(mockReq({}), mockRes(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  console.log('   ✓');

  console.log('\n4. REQUIRE_CLOUDFLARE on → block missing CF-Ray');
  process.env.REQUIRE_CLOUDFLARE = 'true';
  const res = mockRes();
  let blockedNext = false;
  requireCloudflareProxy(mockReq({}), res, () => {
    blockedNext = true;
  });
  assert.equal(blockedNext, false);
  assert.equal(res.state.statusCode, 403);
  console.log('   ✓');

  console.log('\n5. REQUIRE_CLOUDFLARE on → allow with CF-Ray');
  nextCalled = false;
  requireCloudflareProxy(mockReq({ 'cf-ray': 'abc-DEL' }), mockRes(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  console.log('   ✓');

  console.log('\n6. Health stays reachable when gate on');
  nextCalled = false;
  requireCloudflareProxy(
    mockReq({}, { path: '/api/health' }),
    mockRes(),
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);
  console.log('   ✓');

  delete process.env.REQUIRE_CLOUDFLARE;
  console.log('\n=== RL-003 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
