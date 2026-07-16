/**
 * BID-010 block seller bidding on own listing — run from db-liquid/: npm run test:bid010
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = `bid010-seller-${stamp}@example.com`;
const OTHER_EMAIL = `bid010-buyer-${stamp}@example.com`;
const PASSWORD = 'Bid010Test1!';

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
          note: 'BID-010 test top-up',
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
  console.log('=== BID-010 Own-Listing Bid Block ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const other = createApiClient(API);

  console.log('1. Seller creates listing');
  const sellerUser = await register(seller, SELLER_EMAIL, 'BID010 Seller', '9999990101');
  await topUp(seller);
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
        location: 'BID010 Own Listing Property',
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

  console.log('\n2. Seller bidding on own listing must be blocked');
  const ownBid = await seller.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: randomUUID() }),
  });
  console.log(
    '   Status:',
    ownBid.status,
    ownBid.status === 403 ? '✓ blocked' : '✗',
    ownBid.data?.error ?? '',
  );
  if (ownBid.status !== 403) process.exit(1);
  if (!String(ownBid.data?.error ?? '').toLowerCase().includes('own listing')) {
    console.log('   ✗ Unexpected error message');
    process.exit(1);
  }

  console.log('\n3. Another user can still bid');
  await register(other, OTHER_EMAIL, 'BID010 Buyer', '9999990102');
  await topUp(other);
  const okBid = await other.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: randomUUID() }),
  });
  console.log('   Status:', okBid.status, okBid.ok ? '✓' : '✗', okBid.data?.error ?? '');
  if (!okBid.ok) process.exit(1);

  console.log('\n=== BID-010 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
