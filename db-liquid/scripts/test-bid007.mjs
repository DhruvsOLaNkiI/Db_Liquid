/**
 * BID-007 bid idempotency test — run from db-liquid/: npm run test:bid007
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = `bid007-seller-${stamp}@example.com`;
const BUYER_EMAIL = `bid007-buyer-${stamp}@example.com`;
const PASSWORD = 'Bid007Test1!';

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
          note: 'BID-007 test top-up',
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
  console.log('=== BID-007 Idempotency Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const buyer = createApiClient(API);

  console.log('1. Create seller + listing');
  const sellerUser = await register(seller, SELLER_EMAIL, 'BID007 Seller', '9999990071');
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
        location: 'BID007 Idempotency Property',
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
  console.log('   Listing:', sync.status, sync.ok ? '✓' : '✗', sync.data?.error ?? '');
  if (!sync.ok) process.exit(1);

  console.log('\n2. Buyer places bid with idempotency key');
  await register(buyer, BUYER_EMAIL, 'BID007 Buyer', '9999990072');
  await topUp(buyer);
  const key = randomUUID();
  const first = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: key }),
  });
  console.log('   Status:', first.status, first.ok ? '✓' : '✗', first.data?.error ?? '');
  if (!first.ok || first.status !== 201) process.exit(1);
  const bidId = first.data.bid.id;
  const creditsAfterFirst = first.data.creditsRemaining;
  console.log('   Bid:', bidId, 'credits:', creditsAfterFirst);

  console.log('\n3. Replay same key — must not charge again');
  const replay = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: key }),
  });
  console.log(
    '   Status:',
    replay.status,
    replay.ok && replay.data.idempotent && replay.data.bid?.id === bidId ? '✓' : '✗',
    replay.data?.error ?? '',
  );
  if (
    !replay.ok ||
    !replay.data.idempotent ||
    replay.data.bid?.id !== bidId ||
    replay.data.creditsRemaining !== creditsAfterFirst
  ) {
    process.exit(1);
  }

  const listingBids = (replay.data.listing?.bids ?? []).filter(
    (bid) => bid.bidderUserId || bid.id === bidId,
  );
  const sameKeyCount = (replay.data.listing?.bids ?? []).filter((bid) => bid.id === bidId).length;
  console.log('   Single bid retained:', sameKeyCount === 1 ? '✓' : '✗');
  if (sameKeyCount !== 1) process.exit(1);
  void listingBids;

  console.log('\n4. Same key + different amount should fail');
  const conflict = await buyer.api(`/api/listings/${listingId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 120000, idempotencyKey: key }),
  });
  console.log(
    '   Status:',
    conflict.status,
    conflict.status === 409 ? '✓ blocked' : '✗',
    conflict.data?.error ?? '',
  );
  if (conflict.status !== 409) process.exit(1);

  console.log('\n=== BID-007 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
