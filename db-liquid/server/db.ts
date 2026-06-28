import { MongoClient, type Db } from 'mongodb';
import 'dotenv/config';

const URI = process.env.MONGODB_URI_ATLAS;
const DB_NAME = process.env.MONGODB_DB ?? 'db_liquid';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  if (!URI) {
    throw new Error('Missing MONGODB_URI_ATLAS in .env');
  }

  client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getMongoInfo() {
  const safeUri = URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') ?? '(not set)';
  return { uri: safeUri, db: DB_NAME };
}
