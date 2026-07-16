/**
 * PERF-008–010 smoke tests — run from db-liquid/: npm run test:perf008
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { applyApiNoStoreCache } from '../server/apiCache.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function request(app, url) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      const { port } = server.address();
      try {
        const res = await fetch(`http://127.0.0.1:${port}${url}`);
        resolve({
          status: res.status,
          cacheControl: res.headers.get('cache-control') || '',
          pragma: res.headers.get('pragma') || '',
          body: await res.json().catch(() => ({})),
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
  console.log('=== PERF-008–010 Tests ===\n');

  console.log('1. PERF-010 — no Google Fonts link in index.html; fontsource used in main');
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(html.includes('fonts.googleapis.com'), false);
  const mainTsx = readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
  assert.match(mainTsx, /@fontsource\/inter/);
  assert.match(mainTsx, /@fontsource\/space-grotesk/);
  console.log('   ✓');

  console.log('\n2. PERF-008 — optimize + OptimizedImage helpers exist');
  const opt = readFileSync(path.join(root, 'src/utils/optimizeImage.ts'), 'utf8');
  assert.match(opt, /image\/webp/);
  assert.match(opt, /MAX_EDGE_PX/);
  const img = readFileSync(path.join(root, 'src/components/OptimizedImage.tsx'), 'utf8');
  assert.match(img, /loading = 'lazy'/);
  const upload = readFileSync(path.join(root, 'src/utils/fileUpload.ts'), 'utf8');
  assert.match(upload, /optimizeImageForUpload/);
  console.log('   ✓');

  console.log('\n3. PERF-009 — /api sets private, no-store');
  const app = express();
  applyApiNoStoreCache(app);
  app.get('/api/listings', (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/api/v1/files', (_req, res) => {
    res.setHeader('Cache-Control', 'private, max-age=900');
    res.json({ ok: true });
  });

  const listings = await request(app, '/api/listings');
  assert.equal(listings.status, 200);
  assert.match(listings.cacheControl, /no-store/);
  assert.match(listings.pragma, /no-cache/);

  const files = await request(app, '/api/v1/files');
  assert.equal(files.status, 200);
  assert.match(files.cacheControl, /max-age=900/);
  console.log('   ✓');

  console.log('\n=== PERF-008–010 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
