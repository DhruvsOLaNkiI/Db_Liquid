/**
 * BID-001 through BID-004 server bid test — run from db-liquid/: npm run test:bid001
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';

const API = process.env.API_URL ?? 'http://localhost:3001';
const TEST_EMAIL = process.env.BID001_TEST_EMAIL ?? process.env.SEC001_TEST_EMAIL ?? 'a@b.com';
const TEST_PASSWORD = process.env.BID001_TEST_PASSWORD ?? process.env.SEC001_TEST_PASSWORD ?? 'x';

function getBidTotal(bid, areaSqFt) {
  if (typeof bid.bidTotal === 'number') return bid.bidTotal;
  if (typeof bid.amountPerSqFt === 'number' && areaSqFt > 0) return bid.amountPerSqFt * areaSqFt;
  return 0;
}

async function main() {
  console.log('=== BID-001/004 Server Bid Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const client = createApiClient(API);

  console.log(`1. Login as ${TEST_EMAIL}`);
  const login = await client.api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  console.log('   Status:', login.status, login.ok ? '✓' : '✗', login.data?.error ?? '');
  if (!login.ok) process.exit(1);

  const me = login.data.user;
  if (!me?.id) {
    console.log('   ✗ Missing login user');
    process.exit(1);
  }

  console.log('\n2. Ensure bid credits');
  const currentCredits = Number(me.credits ?? 0);
  if (currentCredits < 2) {
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
            note: 'BID-001 test top-up',
            amountInr: 0,
            createdAt: new Date().toISOString(),
          },
          ...(me.creditHistory ?? []),
        ],
      }),
    });
    console.log('   Top-up:', topup.status, topup.ok ? '✓' : '✗', topup.data?.error ?? '');
    if (!topup.ok) process.exit(1);
  } else {
    console.log('   Existing credits:', currentCredits, '✓');
  }

  console.log('\n3. Pick non-owned open listing');
  const listingsRes = await client.api('/api/listings');
  const listings = Array.isArray(listingsRes.data) ? listingsRes.data : [];
  const listing = listings.find((entry) => {
    const endsAt = entry.biddingEndsAt ? new Date(entry.biddingEndsAt).getTime() : Date.now() + 1;
    return entry.sellerId !== me.id && !entry.acceptedBidId && endsAt > Date.now();
  });
  if (!listing) {
    console.log('   ✗ No non-owned open listing found for test');
    process.exit(1);
  }
  console.log('   Listing:', listing.id, '✓');

  const highest = (listing.bids ?? []).reduce(
    (max, bid) => Math.max(max, getBidTotal(bid, Number(listing.areaSqFt ?? 0))),
    0,
  );

  console.log('\n4. Valid bid should succeed');
  const bidTotal = Math.max(1, highest + 1);
  const bid = await client.api(`/api/listings/${listing.id}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal }),
  });
  console.log('   Status:', bid.status, bid.ok ? '✓' : '✗', bid.data?.error ?? '');
  if (!bid.ok || bid.data.bid?.bidTotal !== bidTotal) process.exit(1);
  console.log('   Bid:', bid.data.bid.id, 'creditsRemaining:', bid.data.creditsRemaining);

  console.log('\n5. Same amount should now fail minimum increment');
  const low = await client.api(`/api/listings/${listing.id}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal }),
  });
  console.log('   Status:', low.status, low.status >= 400 ? '✓ blocked' : '✗', low.data?.error ?? '');
  if (low.status < 400) process.exit(1);

  console.log('\n=== BID-001/004 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
