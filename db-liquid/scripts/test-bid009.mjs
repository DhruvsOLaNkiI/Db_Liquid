/**
 * BID-009 auto-close expired auctions — run from db-liquid/: npm run test:bid009
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';
import { closeExpiredAuctions } from '../server/auctionCloser.ts';
import { closeMongo } from '../server/db.ts';
import { getListings, saveListings, updateListings } from '../server/mongoStore.ts';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = `bid009-seller-${stamp}@example.com`;
const BUYER_EMAIL = `bid009-buyer-${stamp}@example.com`;
const PASSWORD = 'Bid009Test1!';

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
          note: 'BID-009 test top-up',
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
  console.log('=== BID-009 Auto-Close Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const buyer = createApiClient(API);

  console.log('1. Create open listing');
  const sellerUser = await register(seller, SELLER_EMAIL, 'BID009 Seller', '9999990091');
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
        location: 'BID009 Close Property',
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
  console.log('   Sync:', sync.status, sync.ok ? '✓' : '✗', sync.data?.error ?? '');
  if (!sync.ok) process.exit(1);

  console.log('\n2. Force biddingEndsAt into the past');
  await updateListings(async (listings) => {
    const index = listings.findIndex((entry) => entry.id === listingId);
    if (index === -1) throw new Error('listing missing');
    listings[index] = {
      ...listings[index],
      biddingEndsAt: new Date(Date.now() - 60_000).toISOString(),
      auctionClosedAt: null,
    };
    await saveListings(listings);
  });
  console.log('   Past end time set ✓');

  console.log('\n3. Run closer job');
  const result = await closeExpiredAuctions();
  console.log('   Closed count includes listing:', result.closedListingIds.includes(listingId) ? '✓' : '✗', result);
  if (!result.closedListingIds.includes(listingId)) process.exit(1);

  const stored = (await getListings()).find((entry) => entry.id === listingId);
  console.log('   auctionClosedAt set:', stored?.auctionClosedAt ? '✓' : '✗', stored?.auctionClosedAt);
  if (!stored?.auctionClosedAt) process.exit(1);

  console.log('\n4. Second closer run is idempotent');
  const again = await closeExpiredAuctions();
  console.log(
    '   Not re-closed:',
    !again.closedListingIds.includes(listingId) ? '✓' : '✗',
    again,
  );
  if (again.closedListingIds.includes(listingId)) process.exit(1);

  console.log('\n5. Place bid on closed auction should fail');
  await register(buyer, BUYER_EMAIL, 'BID009 Buyer', '9999990092');
  await topUp(buyer);
  const bid = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: randomUUID() }),
  });
  console.log('   Status:', bid.status, bid.status >= 400 ? '✓ blocked' : '✗', bid.data?.error ?? '');
  if (bid.status < 400) process.exit(1);

  console.log('\n6. Non-admin cannot trigger closer API');
  const forbidden = await buyer.api('/api/admin/close-expired-auctions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log(
    '   Status:',
    forbidden.status,
    forbidden.status === 403 ? '✓ blocked' : '✗',
    forbidden.data?.error ?? '',
  );
  if (forbidden.status !== 403) process.exit(1);

  console.log('\n=== BID-009 passed ===');
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
