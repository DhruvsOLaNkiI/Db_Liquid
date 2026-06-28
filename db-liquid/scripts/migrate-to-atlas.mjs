/**
 * Copy app data from local MongoDB → MongoDB Atlas.
 *
 * Usage:
 *   1. Add MONGODB_URI_ATLAS to .env (your Atlas connection string)
 *   2. npm run migrate:atlas
 *
 * Local source uses MONGODB_URI (default: mongodb://localhost:27017/)
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const SOURCE_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/';
const TARGET_URI = process.env.MONGODB_URI_ATLAS;
const DB_NAME = process.env.MONGODB_DB ?? 'db_liquid';
const COLLECTION = 'app_state';

if (!TARGET_URI) {
  console.error('Missing MONGODB_URI_ATLAS in .env');
  console.error('Example: mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority');
  process.exit(1);
}

const sourceClient = new MongoClient(SOURCE_URI);
const targetClient = new MongoClient(TARGET_URI);

try {
  await sourceClient.connect();
  await targetClient.connect();

  const sourceDb = sourceClient.db(DB_NAME);
  const targetDb = targetClient.db(DB_NAME);

  const docs = await sourceDb.collection(COLLECTION).find({}).toArray();

  if (docs.length === 0) {
    console.log('No data found in local MongoDB. Nothing to migrate.');
    process.exit(0);
  }

  for (const doc of docs) {
    const { key, data } = doc;
    await targetDb.collection(COLLECTION).updateOne(
      { key },
      { $set: { key, data, updatedAt: new Date() } },
      { upsert: true },
    );
    const count = Array.isArray(data) ? data.length : 0;
    console.log(`✓ Migrated "${key}" (${count} records)`);
  }

  console.log(`\nDone! ${docs.length} document(s) copied to Atlas database "${DB_NAME}".`);
  console.log('Update .env MONGODB_URI to your Atlas string, then restart: npm run dev');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
} finally {
  await sourceClient.close();
  await targetClient.close();
}
