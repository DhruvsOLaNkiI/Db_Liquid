/**
 * BID-008 bid audit log test — run from db-liquid/: npm run test:bid008
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';
import { listBidAudit } from '../server/bidAudit.ts';
import { closeMongo } from '../server/db.ts';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = `bid008-seller-${stamp}@example.com`;
const BUYER_EMAIL = `bid008-buyer-${stamp}@example.com`;
const PASSWORD = 'Bid008Test1!';

async function register(client, email, name, phone) {
  const res = await client.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, name, phone }),
  });
  if (!res.ok) {
    console.log('   Register failed:', res.status, res.data?.error ?? '');
    process.exit(1);
  }
  return res.data.user;
}

async function topUp(client) {
  const res = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credits: 5,
      creditHistory: [
        {
          id: randomUUID(),
          type: 'purchase',
          credits: 5,
          balanceAfter: 5,
          note: 'BID-008 test top-up',
          amountInr: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!res.ok) {
    console.log('   Top-up failed:', res.status, res.data?.error ?? '');
    process.exit(1);
  }
}

async function main() {
  console.log('=== BID-008 Bid Audit Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const buyer = createApiClient(API);

  console.log('1. Create seller listing + buyer bid');
  const sellerUser = await register(seller, SELLER_EMAIL, 'BID008 Seller', '9999990081');
  const listingId = randomUUID();
  const now = new Date();
  const sync = await seller.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        id: listingId,
        sellerId: sellerUser.id,
        sellerName: sellerUser.name,
        sellerPhone: sellerUser.phone,
        location: 'BID008 Audit Property',
        city: 'Test City',
        areaSqFt: 1000,
        pricePerSqFt: 100,
        totalPrice: 100000,
        publishedAt: now.toISOString(),
        biddingEndsAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
        bids: [],
        acceptedBidId: null,
        chatMessages: [],
        chatSellerName: '',
        chatSellerPhone: '',
        chatBuyerName: '',
        chatBuyerPhone: '',
      },
    ]),
  });
  if (!sync.ok) {
    console.log('   Listing sync failed:', sync.status, sync.data?.error ?? '');
    process.exit(1);
  }

  const buyerUser = await register(buyer, BUYER_EMAIL, 'BID008 Buyer', '9999990082');
  await topUp(buyer);
  const key = randomUUID();
  const place = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.88',
    },
    body: JSON.stringify({ bidTotal: 125000, idempotencyKey: key }),
  });
  console.log('   Place bid:', place.status, place.ok ? '✓' : '✗', place.data?.error ?? '');
  if (!place.ok) process.exit(1);
  const bidId = place.data.bid.id;

  console.log('\n2. Audit entry exists (who / when / amount / IP)');
  const entries = await listBidAudit({ listingId, bidId, limit: 20 });
  const placeEntry = entries.find((entry) => entry.action === 'place' && entry.bidId === bidId);
  console.log('   place entry:', placeEntry ? '✓' : '✗');
  if (!placeEntry) process.exit(1);
  console.log('   actorUserId:', placeEntry.actorUserId === buyerUser.id ? '✓' : '✗');
  console.log('   bidTotal:', placeEntry.bidTotal === 125000 ? '✓' : '✗');
  console.log('   ip:', placeEntry.ip === '203.0.113.88' ? '✓' : '✗', placeEntry.ip);
  console.log('   createdAt:', placeEntry.createdAt ? '✓' : '✗');
  if (
    placeEntry.actorUserId !== buyerUser.id ||
    placeEntry.bidTotal !== 125000 ||
    placeEntry.ip !== '203.0.113.88' ||
    !placeEntry.createdAt
  ) {
    process.exit(1);
  }

  console.log('\n3. Idempotent replay also audited');
  const replay = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '203.0.113.88',
    },
    body: JSON.stringify({ bidTotal: 125000, idempotencyKey: key }),
  });
  if (!replay.ok || !replay.data.idempotent) {
    console.log('   Replay failed:', replay.status, replay.data?.error ?? '');
    process.exit(1);
  }
  const afterReplay = await listBidAudit({ listingId, bidId, limit: 20 });
  const replayEntry = afterReplay.find((entry) => entry.action === 'place_replay');
  console.log('   place_replay entry:', replayEntry ? '✓' : '✗');
  if (!replayEntry) process.exit(1);

  console.log('\n4. Accept bid audited');
  const accept = await seller.api(`/api/listings/${listingId}/accept-bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.22',
    },
    body: JSON.stringify({ bidId }),
  });
  console.log('   Accept:', accept.status, accept.ok ? '✓' : '✗', accept.data?.error ?? '');
  if (!accept.ok) process.exit(1);
  const afterAccept = await listBidAudit({ listingId, bidId, limit: 20 });
  const acceptEntry = afterAccept.find((entry) => entry.action === 'accept');
  console.log('   accept entry:', acceptEntry ? '✓' : '✗');
  console.log(
    '   seller actor + IP:',
    acceptEntry?.actorUserId === sellerUser.id && acceptEntry?.ip === '198.51.100.22' ? '✓' : '✗',
  );
  if (!acceptEntry || acceptEntry.actorUserId !== sellerUser.id || acceptEntry.ip !== '198.51.100.22') {
    process.exit(1);
  }

  console.log('\n5. Non-admin cannot read audit API');
  const forbidden = await buyer.api(`/api/admin/bid-audit?listingId=${listingId}`);
  console.log(
    '   Status:',
    forbidden.status,
    forbidden.status === 403 ? '✓ blocked' : '✗',
    forbidden.data?.error ?? '',
  );
  if (forbidden.status !== 403) process.exit(1);

  console.log('\n=== BID-008 passed ===');
  await closeMongo();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await closeMongo();
  } catch {
    // ignore
  }
  process.exit(1);
});
