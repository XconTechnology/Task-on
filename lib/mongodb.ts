// lib/mongodb.ts

import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "projectflow"

if (!uri) {
  throw new Error('Missing environment variable: "MONGODB_URI"')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Development: use globalThis to persist across reloads
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 100000, // give more time
      socketTimeoutMS: 60000,
    })
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

/**
 * Returns the connected MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db(dbName)
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err)
    throw err // Let the API route fail with 500
  }
}

export default clientPromise
