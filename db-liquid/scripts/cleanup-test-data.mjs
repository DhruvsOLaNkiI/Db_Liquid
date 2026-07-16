/**
 * Remove automated test junk from MongoDB (keeps real accounts).
 *
 * Dry-run (default):
 *   npm run cleanup:test-data
 *
 * Apply deletes:
 *   npm run cleanup:test-data -- --apply
 */
import 'dotenv/config';
import { closeMongo, connectMongo } from '../server/db.ts';
import { getListings, getUsers, saveListings, saveUsers } from '../server/mongoStore.ts';

const APPLY = process.argv.includes('--apply');

function isTestEmail(email) {
  if (typeof email !== 'string') return false;
  const value = email.trim().toLowerCase();
  if (!value) return false;
  if (value.endsWith('@example.com')) return true;
  if (value === 'a@b.com') return true;
  if (/^(bid|sec|auth|rl|perf)\d{0,3}[-_]/.test(value)) return true;
  return false;
}

function isTestListing(listing, testUserIds) {
  const sellerId = typeof listing.sellerId === 'string' ? listing.sellerId : '';
  if (sellerId && testUserIds.has(sellerId)) return true;

  const haystack = [
    listing.location,
    listing.propertyType,
    listing.description,
    listing.sellerName,
    listing.id,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');

  return (
    /\bbid0\d{2}\b/.test(haystack) ||
    /\bperf-\d+\b/.test(haystack) ||
    haystack.includes('own listing property') ||
    haystack.includes('@example.com')
  );
}

async function scrubAppState(key, keepIds) {
  const db = await connectMongo();
  const doc = await db.collection('app_state').findOne({ key });
  if (!doc || !Array.isArray(doc.data)) return 0;

  const before = doc.data.length;
  const next = doc.data.filter((row) => {
    const id = row && typeof row === 'object' ? String(row.id ?? '') : '';
    return id && keepIds.has(id);
  });
  if (next.length === before) return 0;

  await db.collection('app_state').updateOne(
    { key },
    { $set: { data: next, updatedAt: new Date() } },
  );
  return before - next.length;
}

async function main() {
  console.log(APPLY ? '=== Cleanup test data (APPLY) ===\n' : '=== Cleanup test data (dry-run) ===\n');

  const users = await getUsers();
  const listings = await getListings();

  const testUsers = users.filter((user) => isTestEmail(user.email));
  const keepUsers = users.filter((user) => !isTestEmail(user.email));
  const testUserIds = new Set(testUsers.map((user) => String(user.id ?? '')).filter(Boolean));

  const testListings = listings.filter((listing) => isTestListing(listing, testUserIds));
  const keepListings = listings.filter((listing) => !isTestListing(listing, testUserIds));

  console.log(`Users total: ${users.length}`);
  console.log(`  keep: ${keepUsers.length}`);
  console.log(`  remove: ${testUsers.length}`);
  for (const user of testUsers.slice(0, 20)) {
    console.log(`   - ${user.email}`);
  }
  if (testUsers.length > 20) console.log(`   … +${testUsers.length - 20} more`);

  console.log(`\nListings total: ${listings.length}`);
  console.log(`  keep: ${keepListings.length}`);
  console.log(`  remove: ${testListings.length}`);

  if (!APPLY) {
    console.log('\nDry-run only. To delete:');
    console.log('  npm run cleanup:test-data -- --apply');
    await closeMongo();
    return;
  }

  await saveUsers(keepUsers);
  await saveListings(keepListings);

  const keepUserIds = new Set(keepUsers.map((user) => String(user.id ?? '')).filter(Boolean));
  const keepListingIds = new Set(
    keepListings.map((listing) => String(listing.id ?? '')).filter(Boolean),
  );
  const appUsersRemoved = await scrubAppState('users', keepUserIds);
  const appListingsRemoved = await scrubAppState('listings', keepListingIds);

  const db = await connectMongo();
  const removedListingIds = testListings
    .map((listing) => String(listing.id ?? ''))
    .filter(Boolean);
  let auditDeleted = 0;
  if (removedListingIds.length > 0) {
    const result = await db.collection('bid_audit_log').deleteMany({
      listingId: { $in: removedListingIds },
    });
    auditDeleted = result.deletedCount ?? 0;
  }

  console.log('\nApplied:');
  console.log(`  users kept: ${keepUsers.length}`);
  console.log(`  listings kept: ${keepListings.length}`);
  console.log(`  app_state users trimmed: ${appUsersRemoved}`);
  console.log(`  app_state listings trimmed: ${appListingsRemoved}`);
  console.log(`  bid_audit_log rows deleted: ${auditDeleted}`);

  await closeMongo();
}

main().catch(async (error) => {
  console.error(error);
  await closeMongo().catch(() => {});
  process.exit(1);
});
