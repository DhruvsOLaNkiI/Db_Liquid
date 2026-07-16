/**
 * RL-005 bid IP logging test — run from db-liquid/: npm run test:rl005
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getClientIp } from '../server/cloudflare.ts';
import { appendBidAudit, listBidAudit } from '../server/bidAudit.ts';
import { closeMongo } from '../server/db.ts';

async function main() {
  console.log('=== RL-005 Bid IP Logging Test ===\n');

  console.log('1. Audit IP source prefers CF-Connecting-IP');
  const ip = getClientIp({
    headers: {
      'cf-connecting-ip': '203.0.113.40',
      'x-forwarded-for': '1.1.1.1',
    },
    ip: '10.0.0.1',
    socket: { remoteAddress: '10.0.0.1' },
  });
  assert.equal(ip, '203.0.113.40');
  console.log('   ✓');

  const listingId = `rl005-${randomUUID()}`;
  const bidId = randomUUID();
  const markerIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  console.log('\n2. Append audit entry with IP');
  await appendBidAudit({
    action: 'place',
    listingId,
    bidId,
    actorUserId: 'user-rl005',
    bidderUserId: 'user-rl005',
    bidderName: 'RL005 Tester',
    bidTotal: 100000,
    ip: markerIp,
    userAgent: 'rl005-test-agent',
  });
  console.log('   ✓');

  console.log('\n3. listBidAudit filters by IP');
  const byIp = await listBidAudit({ ip: markerIp, limit: 50 });
  const hit = byIp.find((entry) => entry.listingId === listingId && entry.bidId === bidId);
  assert.ok(hit, 'expected audit row for marker IP');
  assert.equal(hit.ip, markerIp);
  assert.equal(hit.userAgent, 'rl005-test-agent');
  console.log('   ✓');

  console.log('\n4. listBidAudit filters by listingId and includes IP');
  const byListing = await listBidAudit({ listingId, limit: 10 });
  assert.equal(byListing.length >= 1, true);
  assert.equal(byListing[0].ip, markerIp);
  console.log('   ✓');

  await closeMongo().catch(() => {});
  console.log('\n=== RL-005 passed ===');
  console.log('Admin UI: /admin/verification → Bid IP audit');
}

main().catch(async (err) => {
  console.error(err);
  await closeMongo().catch(() => {});
  process.exit(1);
});
