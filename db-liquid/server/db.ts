import { MongoClient, type Db } from 'mongodb';
import 'dotenv/config';

const URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGODB_DB ?? 'db_liquid';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

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
  return { uri: URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), db: DB_NAME };
}
