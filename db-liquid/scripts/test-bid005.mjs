/**
 * BID-005 accept-bid test — run from db-liquid/: npm run test:bid005
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = process.env.BID005_SELLER_EMAIL ?? `bid005-seller-${stamp}@example.com`;
const SELLER_PASSWORD = process.env.BID005_SELLER_PASSWORD ?? 'Bid005Seller1!';
const BUYER_EMAIL = process.env.BID005_BUYER_EMAIL ?? `bid005-buyer-${stamp}@example.com`;
const BUYER_PASSWORD = process.env.BID005_BUYER_PASSWORD ?? 'Bid005Buyer1!';

async function registerOrLogin(client, email, password, name, phone) {
  let res = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return res;

  res = await client.api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, phone }),
  });
  return res;
}

async function ensureCredits(client, me, minCredits = 2) {
  const currentCredits = Number(me.credits ?? 0);
  if (currentCredits >= minCredits) return me;
  const nextCredits = currentCredits + 5;
  const topup = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credits: nextCredits,
      creditHistory: [
        {
          id: randomUUID(),
          type: 'purchase',
          credits: 5,
          balanceAfter: nextCredits,
          note: 'BID-005 test top-up',
          amountInr: 0,
          createdAt: new Date().toISOString(),
        },
        ...(me.creditHistory ?? []),
      ],
    }),
  });
  if (!topup.ok) {
    console.log('   Top-up failed:', topup.status, topup.data?.error ?? '');
    process.exit(1);
  }
  return topup.data.user ?? { ...me, credits: nextCredits };
}

async function main() {
  console.log('=== BID-005 Accept Bid Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const buyer = createApiClient(API);

  console.log('1. Create seller account');
  const sellerAuth = await registerOrLogin(
    seller,
    SELLER_EMAIL,
    SELLER_PASSWORD,
    'BID005 Seller',
    '9999990001',
  );
  console.log('   Status:', sellerAuth.status, sellerAuth.ok ? '✓' : '✗', sellerAuth.data?.error ?? '');
  if (!sellerAuth.ok) process.exit(1);
  const sellerUser = sellerAuth.data.user;

  console.log('\n2. Seller creates open listing');
  const listingId = randomUUID();
  const now = new Date();
  const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const listingPayload = {
    id: listingId,
    sellerId: sellerUser.id,
    sellerName: sellerUser.name,
    sellerPhone: sellerUser.phone,
    location: 'BID005 Test Property',
    city: 'Test City',
    areaSqFt: 1000,
    pricePerSqFt: 100,
    publishedAt: now.toISOString(),
    biddingEndsAt: ends.toISOString(),
    bids: [],
    acceptedBidId: null,
    acceptedAt: null,
    proceededAt: null,
    tokenStatus: 'none',
    chatMessages: [],
    chatSellerName: '',
    chatSellerPhone: '',
    chatBuyerName: '',
    chatBuyerPhone: '',
  };
  const sync = await seller.api('/api/v1/listings/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([listingPayload]),
  });
  console.log('   Status:', sync.status, sync.ok ? '✓' : '✗', sync.data?.error ?? '');
  if (!sync.ok) process.exit(1);

  console.log('\n3. Buyer places a bid');
  const buyerAuth = await registerOrLogin(
    buyer,
    BUYER_EMAIL,
    BUYER_PASSWORD,
    'BID005 Buyer',
    '9999990002',
  );
  console.log('   Auth:', buyerAuth.status, buyerAuth.ok ? '✓' : '✗', buyerAuth.data?.error ?? '');
  if (!buyerAuth.ok) process.exit(1);
  await ensureCredits(buyer, buyerAuth.data.user, 2);

  const place = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 120000, idempotencyKey: randomUUID() }),
  });
  console.log('   Bid:', place.status, place.ok ? '✓' : '✗', place.data?.error ?? '');
  if (!place.ok) process.exit(1);
  const bidId = place.data.bid?.id;
  if (!bidId) {
    console.log('   ✗ Missing bid id');
    process.exit(1);
  }

  console.log('\n4. Non-seller cannot accept');
  const forbidden = await buyer.api(`/api/listings/${listingId}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId }),
  });
  console.log(
    '   Status:',
    forbidden.status,
    forbidden.status === 403 ? '✓ blocked' : '✗',
    forbidden.data?.error ?? '',
  );
  if (forbidden.status !== 403) process.exit(1);

  console.log('\n5. Seller accepts bid');
  const accept = await seller.api(`/api/listings/${listingId}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId }),
  });
  console.log('   Status:', accept.status, accept.ok ? '✓' : '✗', accept.data?.error ?? '');
  if (!accept.ok || accept.data.listing?.acceptedBidId !== bidId) process.exit(1);

  console.log('\n6. Second accept should fail');
  const again = await seller.api(`/api/listings/${listingId}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId }),
  });
  console.log('   Status:', again.status, again.status >= 400 ? '✓ blocked' : '✗', again.data?.error ?? '');
  if (again.status < 400) process.exit(1);

  console.log('\n=== BID-005 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
