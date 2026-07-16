/**
 * BID-012 credit refund policy test — run from db-liquid/: npm run test:bid012
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createApiClient } from './api-test-client.mjs';
import { closeExpiredAuctions } from '../server/auctionCloser.ts';
import { closeMongo } from '../server/db.ts';
import { getListings, getUsers, saveListings, updateListings } from '../server/mongoStore.ts';

const API = process.env.API_URL ?? 'http://localhost:3001';
const stamp = Date.now();
const SELLER_EMAIL = `bid012-seller-${stamp}@example.com`;
const BUYER_EMAIL = `bid012-buyer-${stamp}@example.com`;
const PASSWORD = 'Bid012Test1!';

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

async function topUp(client, credits = 5) {
  const res = await client.api('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credits,
      creditHistory: [
        {
          id: randomUUID(),
          type: 'purchase',
          credits,
          balanceAfter: credits,
          note: 'BID-012 test top-up',
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

async function createListing(seller, sellerUser, location) {
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
        location,
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
  return listingId;
}

async function main() {
  console.log('=== BID-012 Credit Refund Test ===\n');

  try {
    await fetch(`${API}/api/health`).then((r) => r.json());
  } catch {
    console.log('API not running — start with: npm run dev');
    process.exit(1);
  }

  const seller = createApiClient(API);
  const buyer = createApiClient(API);

  console.log('1. Setup seller + buyer');
  const sellerUser = await register(seller, SELLER_EMAIL, 'BID012 Seller', '9999990121');
  const buyerUser = await register(buyer, BUYER_EMAIL, 'BID012 Buyer', '9999990122');
  await topUp(buyer, 5);

  console.log('\n2. Decline accepted bid refunds credit');
  const listingA = await createListing(seller, sellerUser, 'BID012 Decline Property');
  const placeA = await buyer.api(`/api/listings/${listingA}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 110000, idempotencyKey: randomUUID() }),
  });
  console.log('   Place:', placeA.status, placeA.ok ? '✓' : '✗', placeA.data?.error ?? '');
  if (!placeA.ok) process.exit(1);
  const creditsAfterSpend = placeA.data.creditsRemaining;
  const bidId = placeA.data.bid.id;

  const accept = await seller.api(`/api/listings/${listingA}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId }),
  });
  console.log('   Accept:', accept.status, accept.ok ? '✓' : '✗', accept.data?.error ?? '');
  if (!accept.ok) process.exit(1);

  const decline = await seller.api(`/api/listings/${listingA}/decline-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('   Decline:', decline.status, decline.ok ? '✓' : '✗', decline.data?.error ?? '');
  if (!decline.ok) process.exit(1);

  const usersAfterDecline = await getUsers();
  const buyerAfterDecline = usersAfterDecline.find((entry) => entry.id === buyerUser.id);
  console.log(
    '   Credits restored:',
    buyerAfterDecline?.credits === creditsAfterSpend + 1 ? '✓' : '✗',
    buyerAfterDecline?.credits,
  );
  const refundTx = (buyerAfterDecline?.creditHistory ?? []).find(
    (tx) => tx.type === 'refund' && tx.bidId === bidId,
  );
  console.log('   Refund history entry:', refundTx ? '✓' : '✗');
  if (buyerAfterDecline?.credits !== creditsAfterSpend + 1 || !refundTx) process.exit(1);

  console.log('\n3. Auction auto-close refunds open bids');
  const listingB = await createListing(seller, sellerUser, 'BID012 Close Property');
  const placeB = await buyer.api(`/api/listings/${listingB}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 120000, idempotencyKey: randomUUID() }),
  });
  console.log('   Place:', placeB.status, placeB.ok ? '✓' : '✗', placeB.data?.error ?? '');
  if (!placeB.ok) process.exit(1);
  const creditsBeforeClose = placeB.data.creditsRemaining;
  const bidB = placeB.data.bid.id;

  await updateListings(async (listings) => {
    const index = listings.findIndex((entry) => entry.id === listingB);
    if (index === -1) throw new Error('listing missing');
    listings[index] = {
      ...listings[index],
      biddingEndsAt: new Date(Date.now() - 60_000).toISOString(),
      auctionClosedAt: null,
      acceptedBidId: null,
    };
    await saveListings(listings);
  });

  const closed = await closeExpiredAuctions();
  console.log(
    '   Closer refunded bid:',
    closed.closedListingIds.includes(listingB) && closed.refundedBids >= 1 ? '✓' : '✗',
    closed,
  );
  if (!closed.closedListingIds.includes(listingB) || closed.refundedBids < 1) process.exit(1);

  const usersAfterClose = await getUsers();
  const buyerAfterClose = usersAfterClose.find((entry) => entry.id === buyerUser.id);
  console.log(
    '   Credits after close refund:',
    buyerAfterClose?.credits === creditsBeforeClose + 1 ? '✓' : '✗',
    buyerAfterClose?.credits,
  );
  const listingAfter = (await getListings()).find((entry) => entry.id === listingB);
  const bidMarked = (listingAfter?.bids ?? []).find((bid) => bid.id === bidB)?.creditRefundedAt;
  console.log('   Bid marked refunded:', bidMarked ? '✓' : '✗');
  if (buyerAfterClose?.credits !== creditsBeforeClose + 1 || !bidMarked) process.exit(1);

  console.log('\n4. Non-seller cannot decline');
  const listingC = await createListing(seller, sellerUser, 'BID012 Auth Property');
  const placeC = await buyer.api(`/api/listings/${listingC}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidTotal: 130000, idempotencyKey: randomUUID() }),
  });
  if (!placeC.ok) process.exit(1);
  await seller.api(`/api/listings/${listingC}/accept-bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bidId: placeC.data.bid.id }),
  });
  const forbidden = await buyer.api(`/api/listings/${listingC}/decline-bid`, {
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

  console.log('\n=== BID-012 passed ===');
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
