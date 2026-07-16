/**
 * PERF-001–006 smoke tests — run from db-liquid/: npm run test:perf001
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { applyStaticAssetCaching } from '../server/staticCache.ts';
import {
  ensureStoreIndexes,
  getListings,
  getListingsPage,
  getUsers,
  saveListings,
  saveUsers,
} from '../server/mongoStore.ts';
import { closeMongo } from '../server/db.ts';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function withTempDist(run) {
  const dist = path.join(__dirname, `.tmp-perf-dist-${Date.now()}`);
  mkdirSync(path.join(dist, 'assets'), { recursive: true });
  writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html></html>');
  writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
  try {
    await run(dist);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

function request(app, url) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        const res = await fetch(`http://127.0.0.1:${port}${url}`);
        resolve({
          status: res.status,
          cacheControl: res.headers.get('cache-control') || '',
          body: await res.text(),
        });
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
}

async function main() {
  console.log('=== PERF-001–006 Tests ===\n');

  console.log('1. PERF-001/003 — Cache-Control on hashed assets vs index.html');
  await withTempDist(async (dist) => {
    assert.equal(existsSync(path.join(dist, 'index.html')), true);
    const app = express();
    applyStaticAssetCaching(app, dist);

    const asset = await request(app, '/assets/app-abc123.js');
    assert.equal(asset.status, 200);
    assert.match(asset.cacheControl, /max-age=31536000/);
    assert.match(asset.cacheControl, /immutable/);

    const html = await request(app, '/');
    assert.equal(html.status, 200);
    assert.match(html.cacheControl, /no-store|no-cache/);
  });
  console.log('   ✓');

  console.log('\n2. PERF-004/005 — users/listings collections + indexes');
  await ensureStoreIndexes();
  const stamp = Date.now();
  const userId = randomUUID();
  const listingId = `perf-${stamp}`;
  await saveUsers([
    ...(await getUsers()).filter((u) => u.id !== userId),
    {
      id: userId,
      email: `perf-${stamp}@example.com`,
      phone: '9999990000',
      name: 'Perf User',
      password: 'x',
      roles: ['buyer', 'seller'],
      createdAt: new Date().toISOString(),
      credits: 0,
    },
  ]);
  await saveListings([
    ...(await getListings()).filter((row) => row.id !== listingId),
    {
      id: listingId,
      sellerId: userId,
      sellerName: 'Perf User',
      propertyType: 'Apartment',
      location: 'Test',
      pricePerSqFt: 1,
      totalPrice: 1000,
      areaSqFt: 1000,
      publishedAt: new Date().toISOString(),
      biddingEndsAt: new Date(Date.now() + 86400000).toISOString(),
      bids: [],
      propertyPhotos: [],
      verificationDocuments: [],
      verifications: {},
    },
  ]);
  const page = await getListingsPage({ page: 1, limit: 5 });
  assert.ok(page.total >= 1);
  assert.ok(page.listings.some((row) => row.id === listingId));
  console.log('   ✓');

  console.log('\n3. PERF-006 — getListingsPage shape');
  assert.equal(typeof page.page, 'number');
  assert.equal(typeof page.limit, 'number');
  assert.equal(typeof page.totalPages, 'number');
  assert.ok(Array.isArray(page.listings));
  console.log('   ✓');

  await closeMongo().catch(() => {});
  console.log('\n=== PERF-001–006 passed ===');
  console.log('Cloudflare CDN for assets/images: see docs/completed/PERF-001-006-cache-mongo-pagination.md');
}

main().catch(async (err) => {
  console.error(err);
  await closeMongo().catch(() => {});
  process.exit(1);
});
