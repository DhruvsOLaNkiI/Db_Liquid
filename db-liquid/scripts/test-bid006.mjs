/**
 * BID-006 server timestamps test — run from db-liquid/: npm run test:bid006
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const EMAIL = process.env.BID006_TEST_EMAIL ?? `bid006-${stamp}@example.com`;
const PASSWORD = process.env.BID006_TEST_PASSWORD ?? 'Bid006Test1!';

function withinSeconds(iso, maxSkewSec = 30) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Math.abs(Date.now() - t) <= maxSkewSec * 1000;
}

async function main() {
  console.log('=== BID-006 Server Timestamps Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log('1. Register test user');
  const auth = await client.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      name: 'BID006 User',
      phone: '9999990006',
    }),
  });
  console.log('   Status:', auth.status, auth.ok ? '✓' : '✗', auth.data?.error ?? '');
  if (!auth.ok) process.exit(1);
  const user = auth.data.user;

  console.log('\n2. Create listing with fake past publishedAt + fake bids');
  const listingId = randomUUID();
  const fakePublishedAt = '2020-01-01T00:00:00.000Z';
  const sync = await client.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      {
        id: listingId,
        sellerId: user.id,
        sellerName: user.name,
        sellerPhone: user.phone,
        location: 'BID006 Timestamp Property',
        city: 'Test City',
        areaSqFt: 1000,
        pricePerSqFt: 100,
        publishedAt: fakePublishedAt,
        biddingEndsAt: '2020-01-08T00:00:00.000Z',
        bids: [
          {
            id: randomUUID(),
            bidderName: 'Fake',
            bidderPhone: '000',
            amountPerSqFt: 50,
            bidTotal: 50000,
            createdAt: '2019-01-01T00:00:00.000Z',
          },
        ],
        acceptedBidId: null,
        acceptedAt: null,
        proceededAt: null,
        tokenStatus: 'none',
        chatMessages: [],
        chatSellerName: '',
        chatSellerPhone: '',
        chatBuyerName: '',
        chatBuyerPhone: '',
      },
    ]),
  });
  console.log('   Status:', sync.status, sync.ok ? '✓' : '✗', sync.data?.error ?? '');
  if (!sync.ok) process.exit(1);

  const listingsRes = await client.api('/api/listings');
  const listing = (Array.isArray(listingsRes.data) ? listingsRes.data : []).find(
    (entry) => entry.id === listingId,
  );
  if (!listing) {
    console.log('   ✗ Listing not found after sync');
    process.exit(1);
  }

  console.log('   publishedAt:', listing.publishedAt);
  console.log(
    '   Server stamped publish time:',
    listing.publishedAt !== fakePublishedAt && withinSeconds(listing.publishedAt) ? '✓' : '✗',
  );
  if (listing.publishedAt === fakePublishedAt || !withinSeconds(listing.publishedAt)) process.exit(1);

  console.log('   Fake bids stripped:', (listing.bids?.length ?? 0) === 0 ? '✓' : '✗');
  if ((listing.bids?.length ?? 0) !== 0) process.exit(1);

  console.log('\n3. Place bid — createdAt must be server clock');
  const topup = await client.api('/api/v1/users/me', {
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
          note: 'BID-006 test top-up',
          amountInr: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!topup.ok) {
    console.log('   Top-up failed:', topup.status, topup.data?.error ?? '');
    process.exit(1);
  }

  // Need a second user to bid (cannot bid on own listing)
  const buyer = createApiClient(API);
  const buyerAuth = await buyer.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `bid006-buyer-${stamp}@example.com`,
      password: PASSWORD,
      name: 'BID006 Buyer',
      phone: '9999990007',
    }),
  });
  if (!buyerAuth.ok) {
    console.log('   Buyer register failed:', buyerAuth.status, buyerAuth.data?.error ?? '');
    process.exit(1);
  }
  await buyer.api('/api/v1/users/me', {
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
          note: 'BID-006 buyer top-up',
          amountInr: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
  });

  const beforeBid = Date.now();
  const bid = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: randomUUID() }),
  });
  console.log('   Status:', bid.status, bid.ok ? '✓' : '✗', bid.data?.error ?? '');
  if (!bid.ok) process.exit(1);

  const createdAt = bid.data.bid?.createdAt;
  const createdMs = new Date(createdAt).getTime();
  console.log('   bid.createdAt:', createdAt);
  console.log(
    '   Server clock:',
    createdMs >= beforeBid - 5000 && createdMs <= Date.now() + 5000 ? '✓' : '✗',
  );
  if (!(createdMs >= beforeBid - 5000 && createdMs <= Date.now() + 5000)) process.exit(1);

  console.log('\n=== BID-006 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
