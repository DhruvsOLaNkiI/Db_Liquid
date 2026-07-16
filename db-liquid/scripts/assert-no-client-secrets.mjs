/**
 * INFRA-002 — scan client `src/` for embedded secrets.
 * Run: npm run test:infra002
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');

const FORBIDDEN = [
  /MONGODB_URI_ATLAS\s*=/,
  /JWT_SECRET\s*=/,
  /S3_SECRET_ACCESS_KEY\s*=/,
  /GEMINI_API_KEY\s*=/,
  /mongodb\+srv:\/\//,
  /sk_live_[A-Za-z0-9]+/,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

export function assertNoClientSecrets() {
  const files = walk(SRC);
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      if (pattern.test(text)) {
        hits.push(`${path.relative(SRC, file)} matches ${pattern}`);
      }
    }
  }
  return hits;
}

const isMain =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const hits = assertNoClientSecrets();
  if (hits.length) {
    console.error('INFRA-002 failed — secrets found in client source:');
    for (const hit of hits) console.error(' -', hit);
    process.exit(1);
  }
  console.log('INFRA-002 OK — no secrets in src/');
}
