import { randomUUID } from 'node:crypto';
import { connectMongo } from './db';
import { logger } from './logger';

const COLLECTION = 'admin_audit_log';

export type AdminAuditAction =
  | 'kyc_aadhar_verify'
  | 'kyc_aadhar_unverify'
  | 'kyc_pan_verify'
  | 'kyc_pan_unverify'
  | 'listing_doc_approve'
  | 'listing_doc_reject';

export type AdminAuditEntry = {
  id: string;
  action: AdminAuditAction;
  actorUserId: string;
  targetUserId?: string;
  listingId?: string;
  documentId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
  requestId?: string;
  createdAt: string;
};

let indexesReady = false;

async function getCollection() {
  const db = await connectMongo();
  const collection = db.collection<AdminAuditEntry>(COLLECTION);
  if (!indexesReady) {
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ actorUserId: 1, createdAt: -1 });
    await collection.createIndex({ targetUserId: 1, createdAt: -1 });
    await collection.createIndex({ listingId: 1, createdAt: -1 });
    indexesReady = true;
  }
  return collection;
}

/** MON-006 — append-only KYC / verification admin trail. */
export async function appendAdminAudit(
  entry: Omit<AdminAuditEntry, 'id' | 'createdAt'> & { createdAt?: string },
): Promise<AdminAuditEntry> {
  const doc: AdminAuditEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };

  const collection = await getCollection();
  await collection.insertOne(doc);
  logger.info(
    {
      adminAudit: doc.action,
      actorUserId: doc.actorUserId,
      targetUserId: doc.targetUserId,
      listingId: doc.listingId,
      requestId: doc.requestId,
    },
    'admin.audit',
  );
  return doc;
}

export async function listAdminAudit(options?: {
  targetUserId?: string;
  listingId?: string;
  limit?: number;
}): Promise<AdminAuditEntry[]> {
  const collection = await getCollection();
  const filter: Record<string, string> = {};
  if (options?.targetUserId) filter.targetUserId = options.targetUserId;
  if (options?.listingId) filter.listingId = options.listingId;
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  return collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
}
