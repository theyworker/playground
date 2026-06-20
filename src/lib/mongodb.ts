// Cached MongoDB client. In dev, the connection promise is stashed on
// globalThis so Next.js HMR does not open a new pool on every reload.
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "alcohol_tracker";

declare global {
  var _alcoholMongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._alcoholMongoClientPromise) {
      global._alcoholMongoClientPromise = new MongoClient(uri).connect();
    }
    return global._alcoholMongoClientPromise;
  }
  return new MongoClient(uri).connect();
}

export const DRINKS_COLLECTION = "drinks";

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}
