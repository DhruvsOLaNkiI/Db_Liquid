import { randomUUID } from 'node:crypto';
import { connectMongo } from './db';
import { logger } from './logger';

const COLLECTION = 'product_events';

export type FunnelEvent =
  | 'signup'
  | 'top_up'
  | 'place_bid'
  | 'accept_bid'
  | 'decline_bid';

export type ProductEvent = {
  id: string;
  event: FunnelEvent;
  userId?: string;
  listingId?: string;
  bidId?: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
};

let indexesReady = false;

async function getCollection() {
  const db = await connectMongo();
  const collection = db.collection<ProductEvent>(COLLECTION);
  if (!indexesReady) {
    await collection.createIndex({ event: 1, createdAt: -1 });
    await collection.createIndex({ userId: 1, createdAt: -1 });
    await collection.createIndex({ createdAt: -1 });
    indexesReady = true;
  }
  return collection;
}

/** MON-005 — funnel breadcrumb (signup → top-up → bid → accept). */
export async function trackProductEvent(
  entry: Omit<ProductEvent, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<void> {
  const doc: ProductEvent = {
    ...entry,
    id: randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };

  logger.info(
    {
      funnel: doc.event,
      userId: doc.userId,
      listingId: doc.listingId,
      bidId: doc.bidId,
      requestId: doc.requestId,
      meta: doc.meta,
    },
    `funnel.${doc.event}`,
  );

  try {
    const collection = await getCollection();
    await collection.insertOne(doc);
  } catch (error) {
    logger.warn({ err: error, event: doc.event }, 'product_events insert failed');
  }
}

export async function listProductEvents(options?: {
  event?: FunnelEvent;
  userId?: string;
  limit?: number;
}): Promise<ProductEvent[]> {
  const collection = await getCollection();
  const filter: Record<string, string> = {};
  if (options?.event) filter.event = options.event;
  if (options?.userId) filter.userId = options.userId;
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  return collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
}
