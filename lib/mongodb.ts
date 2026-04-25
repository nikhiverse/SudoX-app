// ═══════════════════════════════════════════
// SudoX — MongoDB Atlas Connection
// Yeh file database (MongoDB) se connect hone aur wahan se data nikalne ka kaam karti hai.
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//
// Cached singleton client for serverless environments.
// Reuses the connection across hot reloads in development
// and across invocations in production (Vercel).

import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Missing MONGODB_URI environment variable. ' +
    'Add it to .env.local: MONGODB_URI=mongodb+srv://...'
  );
}

const DB_NAME = 'sudox';

// ── Global cache for dev hot-reloads ──
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In dev, preserve the client across hot-module reloads
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI);
    globalForMongo._mongoClientPromise = client.connect();
    globalForMongo._mongoClient = client;
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  // In production, create a fresh client
  const client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

/**
 * Get the MongoDB database instance.
 * Reuses the cached connection.
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/**
 * Get the raw MongoClient promise (for advanced use).
 */
export { clientPromise };
