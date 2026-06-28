import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../data/testing');
mkdirSync(outDir, { recursive: true });

const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'seller@example.com',
    phone: '9876543210',
    name: 'Amit Seller',
    password: 'seller123',
    roles: 'seller',
    createdAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'buyer@example.com',
    phone: '9123456789',
    name: 'Priya Buyer',
    password: 'buyer123',
    roles: 'buyer',
    createdAt: '2026-06-01T11:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'both@example.com',
    phone: '9988776655',
    name: 'Rahul Both',
    password: 'both1234',
    roles: 'buyer,seller',
    createdAt: '2026-06-02T09:00:00.000Z',
  },
];

const listings = [
  {
    id: 'listing-001',
    sellerId: '11111111-1111-1111-1111-111111111111',
    sellerName: 'Amit Seller',
    sellerPhone: '9876543210',
    propertyType: 'Apartment',
    location: 'Bandra West, Mumbai',
    pricePerSqFt: 25000,
    totalPrice: 50000000,
    areaSqFt: 2000,
    detailsSummary: '3 Bed · 2 Bath · 2000 sq.ft',
    description: 'Sea-facing apartment for testing bids.',
    publishedAt: '2026-06-20T08:00:00.000Z',
    biddingEndsAt: '2026-06-27T08:00:00.000Z',
    acceptedBidId: '',
    acceptedAt: '',
    proceededAt: '',
    tokenStatus: 'none',
    chatSellerName: '',
    chatSellerPhone: '',
    chatBuyerName: '',
    chatBuyerPhone: '',
  },
  {
    id: 'listing-002',
    sellerId: '11111111-1111-1111-1111-111111111111',
    sellerName: 'Amit Seller',
    sellerPhone: '9876543210',
    propertyType: 'Plot',
    location: 'Whitefield, Bangalore',
    pricePerSqFt: 8000,
    totalPrice: 4800000,
    areaSqFt: 600,
    detailsSummary: '600 sq.ft plot · 30×20 ft',
    description: 'Corner plot sample listing.',
    publishedAt: '2026-06-22T08:00:00.000Z',
    biddingEndsAt: '2026-06-29T08:00:00.000Z',
    acceptedBidId: '',
    acceptedAt: '',
    proceededAt: '',
    tokenStatus: 'none',
    chatSellerName: '',
    chatSellerPhone: '',
    chatBuyerName: '',
    chatBuyerPhone: '',
  },
];

const bids = [
  {
    listingId: 'listing-001',
    id: 'bid-001',
    bidderName: 'Priya Buyer',
    bidderPhone: '9123456789',
    amountPerSqFt: 25200,
    createdAt: '2026-06-21T14:00:00.000Z',
  },
  {
    listingId: 'listing-001',
    id: 'bid-002',
    bidderName: 'Rahul Both',
    bidderPhone: '9988776655',
    amountPerSqFt: 25500,
    createdAt: '2026-06-21T16:00:00.000Z',
  },
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(users), 'Users');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(listings), 'Listings');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bids), 'Bids');

const xlsxPath = join(outDir, 'db-liquid-test-data.xlsx');
XLSX.writeFile(workbook, xlsxPath);

for (const [name, rows] of [
  ['users', users],
  ['listings', listings],
  ['bids', bids],
]) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  writeFileSync(join(outDir, `${name}.csv`), csv);
  writeFileSync(join(outDir, '..', '..', 'public', 'data', 'testing', `${name}.csv`), csv);
}

mkdirSync(join(outDir, '..', '..', 'public', 'data', 'testing'), { recursive: true });
XLSX.writeFile(workbook, join(outDir, '..', '..', 'public', 'data', 'testing', 'db-liquid-test-data.xlsx'));

console.log('Created:', xlsxPath);
