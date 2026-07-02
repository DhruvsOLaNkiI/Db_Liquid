import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const api = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: root,
  stdio: 'inherit',
});

const vite = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
  cwd: root,
  stdio: 'inherit',
});

function shutdown() {
  api.kill();
  vite.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

api.on('exit', (code) => {
  if (code && code !== 0) shutdown();
});

vite.on('exit', (code) => {
  if (code && code !== 0) shutdown();
});
