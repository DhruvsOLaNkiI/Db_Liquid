/**
 * INFRA-001–008 smoke tests — run from db-liquid/: npm run test:infra001
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { forceHttps } from '../server/httpsRedirect.ts';
import { applyCors, listCorsOriginsForTests } from '../server/cors.ts';
import { assertNoClientSecrets } from './assert-no-client-secrets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function mockRes() {
  const state = { statusCode: 200, location: '', headers: {} };
  return {
    state,
    setHeader(k, v) {
      state.headers[k] = v;
    },
    redirect(code, url) {
      state.statusCode = code;
      state.location = url;
    },
  };
}

async function main() {
  console.log('=== INFRA-001–008 Tests ===\n');

  console.log('1. INFRA-001 — forceHttps redirects http when enabled');
  process.env.FORCE_HTTPS = 'true';
  process.env.NODE_ENV = 'production';
  let nextCalled = false;
  const res = mockRes();
  forceHttps(
    {
      hostname: 'app.example.com',
      headers: { 'x-forwarded-proto': 'http', host: 'app.example.com' },
      protocol: 'http',
      originalUrl: '/browse-property',
    },
    res,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, false);
  assert.equal(res.state.statusCode, 301);
  assert.equal(res.state.location, 'https://app.example.com/browse-property');

  nextCalled = false;
  forceHttps(
    {
      hostname: 'app.example.com',
      headers: { 'x-forwarded-proto': 'https', host: 'app.example.com' },
      protocol: 'https',
      originalUrl: '/',
    },
    mockRes(),
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);
  delete process.env.FORCE_HTTPS;
  console.log('   ✓');

  console.log('\n2. INFRA-002 — no secrets in client src/');
  const secretHits = assertNoClientSecrets();
  assert.equal(secretHits.length, 0);
  console.log('   ✓');

  console.log('\n3. INFRA-003 — CORS allowlist includes APP_URL');
  process.env.APP_URL = 'https://app.example.com';
  process.env.CORS_ORIGINS = 'https://staging.example.com';
  process.env.NODE_ENV = 'production';
  const origins = listCorsOriginsForTests();
  assert.ok(origins.includes('https://app.example.com'));
  assert.ok(origins.includes('https://staging.example.com'));
  assert.ok(!origins.includes('http://evil.example'));
  console.log('   ✓');

  console.log('\n4. INFRA-006 — graceful shutdown helper present');
  const shutdownSrc = readFileSync(path.join(root, 'server/shutdown.ts'), 'utf8');
  assert.match(shutdownSrc, /SIGTERM/);
  assert.match(shutdownSrc, /closeMongo/);
  console.log('   ✓');

  console.log('\n5. INFRA-008 — health stays sanitized');
  const indexSrc = readFileSync(path.join(root, 'server/index.ts'), 'utf8');
  assert.match(indexSrc, /app\.get\('\/api\/health'/);
  assert.match(indexSrc, /res\.json\(\{ ok: true \}\)/);
  assert.equal(indexSrc.includes('getMongoInfo()'), true); // used at startup log only
  // Health handler body should not dump URI
  const healthSlice = indexSrc.slice(indexSrc.indexOf("app.get('/api/health'"), indexSrc.indexOf("app.get('/api/auth/csrf'"));
  assert.equal(healthSlice.includes('MONGODB_URI'), false);
  assert.equal(healthSlice.includes('uri:'), false);
  console.log('   ✓');

  console.log('\n6. INFRA docs cover staging/backups/domains');
  const doc = readFileSync(path.join(root, 'docs/completed/INFRA-001-008-deployment.md'), 'utf8');
  assert.match(doc, /INFRA-001/);
  assert.match(doc, /staging/i);
  assert.match(doc, /PITR|backup/i);
  console.log('   ✓');

  console.log('\n=== INFRA-001–008 passed ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
