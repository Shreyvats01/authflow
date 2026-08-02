import { MongoClient, type Db } from "mongodb";
import { createMongoAdapter, ensureIndexes } from "@bolkauth/adapter-mongodb";

export interface MongoDriverOptions {
  uri: string;
  dbName?: string;
  autoEnsureIndexes?: boolean;
}

export interface MongoDriverResult {
  client: MongoClient;
  db: Db;
  adapter: ReturnType<typeof createMongoAdapter>;
}

export async function createMongoDriver(options: MongoDriverOptions): Promise<MongoDriverResult> {
  const client = new MongoClient(options.uri);
  await client.connect();

  const db = client.db(options.dbName ?? "bolkauth");
  
  const autoEnsureIndexes =
    options.autoEnsureIndexes ?? process.env.NODE_ENV !== "production";

  if (autoEnsureIndexes) {
    await ensureIndexes(db);
  }

  const adapter = createMongoAdapter(db);

  return {
    client,
    db,
    adapter,
  };
}

export * from "@bolkauth/adapter-mongodb";
