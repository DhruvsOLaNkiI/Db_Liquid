import { prototype } from 'node:events';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://xo01mtpuf0za8ezbsxvtplxl.187.127.145.42.sslip.io';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${base}/browse-property`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

const href = await page.locator('a[href*="/browse-property/"]').first().getAttribute('href');
await page.goto(`${base}${href}`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

const text = await page.locator('body').innerText();
console.log('URL:', page.url());
console.log('Body preview:', text.slice(0, 300).replace(/\n/g, ' | '));
console.log('Errors:', errors.length ? errors.join(' || ') : 'none');

await browser.close();
