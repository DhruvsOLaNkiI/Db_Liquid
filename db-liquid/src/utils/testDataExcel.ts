import * as XLSX from 'xlsx';
import type { User, UserRole } from '../types/user';
import type { PropertyListing } from '../types/listing';
import { normalizeListing } from '../types/listing';
import { getAllUsers, replaceAllUsers } from '../data/usersTable';
import { loadListingsFromStorage, mergeListingsById, replaceAllListings } from './listingsStorage';

type UserRow = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  roles: string;
  createdAt: string;
};

type ListingRow = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  propertyType: string;
  location: string;
  pricePerSqFt: number | string;
  totalPrice: number | string;
  areaSqFt: number | string;
  detailsSummary: string;
  description: string;
  publishedAt: string;
  biddingEndsAt: string;
  acceptedBidId?: string;
  acceptedAt?: string;
  proceededAt?: string;
  tokenStatus?: string;
  chatSellerName?: string;
  chatSellerPhone?: string;
  chatBuyerName?: string;
  chatBuyerPhone?: string;
};

type BidRow = {
  listingId: string;
  id: string;
  bidderName: string;
  bidderPhone: string;
  amountPerSqFt: number | string;
  createdAt: string;
};

function sheetRows<T>(workbook: XLSX.WorkBook, name: string): T[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

function parseRoles(raw: string): UserRole[] {
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter((r): r is UserRole => r === 'buyer' || r === 'seller');
}

function toUserRow(user: User): UserRow {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    password: user.password,
    roles: user.roles.join(','),
    createdAt: user.createdAt,
  };
}

function toListingRow(listing: PropertyListing): ListingRow {
  return {
    id: listing.id,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    sellerPhone: listing.sellerPhone,
    propertyType: listing.propertyType,
    location: listing.location,
    pricePerSqFt: listing.pricePerSqFt,
    totalPrice: listing.totalPrice,
    areaSqFt: listing.areaSqFt,
    detailsSummary: listing.detailsSummary,
    description: listing.description,
    publishedAt: listing.publishedAt,
    biddingEndsAt: listing.biddingEndsAt,
    acceptedBidId: listing.acceptedBidId ?? '',
    acceptedAt: listing.acceptedAt ?? '',
    proceededAt: listing.proceededAt ?? '',
    tokenStatus: listing.tokenStatus,
    chatSellerName: listing.chatSellerName,
    chatSellerPhone: listing.chatSellerPhone,
    chatBuyerName: listing.chatBuyerName,
    chatBuyerPhone: listing.chatBuyerPhone,
  };
}

function buildWorkbook(users: User[], listings: PropertyListing[]) {
  const bids: BidRow[] = listings.flatMap((listing) =>
    listing.bids.map((bid) => ({
      listingId: listing.id,
      id: bid.id,
      bidderName: bid.bidderName,
      bidderPhone: bid.bidderPhone,
      amountPerSqFt: bid.amountPerSqFt,
      createdAt: bid.createdAt,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(users.map(toUserRow)), 'Users');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(listings.map(toListingRow)),
    'Listings',
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(bids), 'Bids');
  return workbook;
}

export function downloadTestDataExcel() {
  const users = getAllUsers();
  const listings = loadListingsFromStorage();
  const workbook = buildWorkbook(users, listings);
  XLSX.writeFile(workbook, 'db-liquid-test-data.xlsx');
}

function parseListingsFromWorkbook(workbook: XLSX.WorkBook) {
  const listingRows = sheetRows<ListingRow>(workbook, 'Listings');
  const bidRows = sheetRows<BidRow>(workbook, 'Bids');

  const bidsByListing = new Map<string, BidRow[]>();
  for (const bid of bidRows) {
    const listingId = String(bid.listingId);
    const group = bidsByListing.get(listingId) ?? [];
    group.push(bid);
    bidsByListing.set(listingId, group);
  }

  const listings: PropertyListing[] = listingRows.map((row) =>
    normalizeListing({
      id: String(row.id),
      sellerId: String(row.sellerId),
      sellerName: String(row.sellerName),
      sellerPhone: String(row.sellerPhone),
      propertyType: String(row.propertyType),
      location: String(row.location),
      pricePerSqFt: Number(row.pricePerSqFt) || 0,
      totalPrice: Number(row.totalPrice) || 0,
      areaSqFt: Number(row.areaSqFt) || 0,
      detailsSummary: String(row.detailsSummary ?? ''),
      description: String(row.description ?? ''),
      publishedAt: String(row.publishedAt),
      biddingEndsAt: String(row.biddingEndsAt),
      acceptedBidId: row.acceptedBidId ? String(row.acceptedBidId) : null,
      acceptedAt: row.acceptedAt ? String(row.acceptedAt) : null,
      proceededAt: row.proceededAt ? String(row.proceededAt) : null,
      tokenStatus: (row.tokenStatus as PropertyListing['tokenStatus']) || 'none',
      chatSellerName: String(row.chatSellerName ?? ''),
      chatSellerPhone: String(row.chatSellerPhone ?? ''),
      chatBuyerName: String(row.chatBuyerName ?? ''),
      chatBuyerPhone: String(row.chatBuyerPhone ?? ''),
      bids: (bidsByListing.get(String(row.id)) ?? []).map((bid) => ({
        id: String(bid.id),
        bidderName: String(bid.bidderName),
        bidderPhone: String(bid.bidderPhone),
        amountPerSqFt: Number(bid.amountPerSqFt) || 0,
        createdAt: String(bid.createdAt),
      })),
      chatMessages: [],
    }),
  );

  return { listings, bidCount: bidRows.length };
}

function parseUsersFromWorkbook(workbook: XLSX.WorkBook): User[] {
  const userRows = sheetRows<UserRow>(workbook, 'Users');
  return userRows.map((row) => ({
    id: String(row.id),
    email: String(row.email).trim().toLowerCase(),
    phone: String(row.phone),
    name: String(row.name),
    password: String(row.password),
    roles: parseRoles(String(row.roles)),
    createdAt: String(row.createdAt || new Date().toISOString()),
  }));
}

export function importTestDataFromExcel(
  file: File,
  options: { importUsers?: boolean; importListings?: boolean } = {},
): Promise<{ users: number; listings: number; bids: number }> {
  const importUsers = options.importUsers ?? true;
  const importListings = options.importListings ?? true;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = reader.result;
        const workbook = XLSX.read(data, { type: 'array' });

        let users = 0;
        let listings = 0;
        let bids = 0;

        if (importUsers) {
          const parsedUsers = parseUsersFromWorkbook(workbook);
          replaceAllUsers(parsedUsers);
          users = parsedUsers.length;
        }

        if (importListings) {
          const parsed = parseListingsFromWorkbook(workbook);
          const existing = loadListingsFromStorage();
          const merged = mergeListingsById(existing, parsed.listings);
          replaceAllListings(merged);
          listings = parsed.listings.length;
          bids = parsed.bidCount;
        }

        resolve({ users, listings, bids });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Could not read the Excel file.'));
    reader.readAsArrayBuffer(file);
  });
}

export async function loadBundledSampleExcel() {
  const response = await fetch('/data/testing/db-liquid-test-data.xlsx');
  if (!response.ok) {
    throw new Error('Sample Excel file not found.');
  }
  const buffer = await response.arrayBuffer();
  const file = new File([buffer], 'db-liquid-test-data.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return importTestDataFromExcel(file);
}

/** Load only listings + bids — keeps your buyer login (Rahul) intact. */
export async function loadSampleListingsForBrowse() {
  const response = await fetch('/data/testing/db-liquid-test-data.xlsx');
  if (!response.ok) {
    throw new Error('Sample Excel file not found.');
  }
  const buffer = await response.arrayBuffer();
  const file = new File([buffer], 'db-liquid-test-data.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return importTestDataFromExcel(file, { importUsers: false, importListings: true });
}
