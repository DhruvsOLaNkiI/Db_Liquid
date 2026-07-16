import { randomUUID } from 'node:crypto';
import { connectMongo } from './db';

const COLLECTION = 'bid_audit_log';

export type BidAuditAction = 'place' | 'place_replay' | 'accept' | 'decline' | 'refund';

export type BidAuditEntry = {
  id: string;
  action: BidAuditAction;
  listingId: string;
  bidId: string;
  actorUserId: string;
  bidderUserId?: string;
  bidderName?: string;
  bidTotal: number;
  amountPerSqFt?: number;
  idempotencyKey?: string;
  ip: string;
  userAgent?: string;
  createdAt: string;
};

let indexesReady = false;

async function getCollection() {
  const db = await connectMongo();
  const collection = db.collection<BidAuditEntry>(COLLECTION);
  if (!indexesReady) {
    await collection.createIndex({ listingId: 1, createdAt: -1 });
    await collection.createIndex({ bidId: 1 });
    await collection.createIndex({ actorUserId: 1, createdAt: -1 });
    await collection.createIndex({ ip: 1, createdAt: -1 });
    indexesReady = true;
  }
  return collection;
}

/** Append-only write — no update/delete path is exposed (BID-008). */
export async function appendBidAudit(
  entry: Omit<BidAuditEntry, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<BidAuditEntry> {
  const doc: BidAuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
  const collection = await getCollection();
  await collection.insertOne(doc);
  return doc;
}

export async function listBidAudit(options?: {
  listingId?: string;
  bidId?: string;
  ip?: string;
  limit?: number;
}): Promise<BidAuditEntry[]> {
  const collection = await getCollection();
  const filter: Record<string, string> = {};
  if (options?.listingId) filter.listingId = options.listingId;
  if (options?.bidId) filter.bidId = options.bidId;
  if (options?.ip) filter.ip = options.ip;
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  return collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
}
