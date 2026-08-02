import { describe, it, expect } from "vitest";
import { runAdapterTests } from "@bolkauth/core/testing";
import { createMongoAdapter, ensureIndexes, COLLECTION_NAMES } from "./index";

class MockCollection {
  public docs: any[] = [];
  public indexes: any[] = [];

  constructor(public name: string) {}

  private matchesFilter(doc: any, filter: any): boolean {
    if (!filter) return true;
    if (filter.$or && Array.isArray(filter.$or)) {
      return filter.$or.some((subFilter: any) => this.matchesFilter(doc, subFilter));
    }
    for (const [key, value] of Object.entries(filter)) {
      if (key.startsWith("$")) continue;
      if (doc[key] !== value) return false;
    }
    return true;
  }

  async insertOne(doc: any) {
    const docCopy = { ...doc };
    this.docs.push(docCopy);
    return { acknowledged: true, insertedId: docCopy._id };
  }

  async findOne(filter: any) {
    const doc = this.docs.find((d) => this.matchesFilter(d, filter));
    return doc ? { ...doc } : null;
  }

  async findOneAndUpdate(filter: any, update: any, options?: any) {
    const idx = this.docs.findIndex((d) => this.matchesFilter(d, filter));
    if (idx === -1) return null;

    const doc = this.docs[idx];
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    return { ...doc };
  }

  async updateOne(filter: any, update: any, options?: any) {
    const idx = this.docs.findIndex((d) => this.matchesFilter(d, filter));
    if (idx === -1) {
      if (options?.upsert) {
        const newDoc: any = {};
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        if (update.$set) Object.assign(newDoc, update.$set);
        for (const [k, v] of Object.entries(filter)) {
          if (!k.startsWith("$")) newDoc[k] = v;
        }
        this.docs.push(newDoc);
        return { acknowledged: true, upsertedCount: 1, upsertedId: newDoc._id };
      }
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    }

    const doc = this.docs[idx];
    if (update.$set) {
      Object.assign(doc, update.$set);
    }
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter: any) {
    const idx = this.docs.findIndex((d) => this.matchesFilter(d, filter));
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }

  async deleteMany(filter: any) {
    const initialLen = this.docs.length;
    this.docs = this.docs.filter((d) => !this.matchesFilter(d, filter));
    return { acknowledged: true, deletedCount: initialLen - this.docs.length };
  }

  async createIndex(keys: any, options?: any) {
    this.indexes.push({ keys, options });
    return `index_${Object.keys(keys).join("_")}`;
  }
}

class MockDb {
  public collections = new Map<string, MockCollection>();

  collection(name: string): MockCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection(name));
    }
    return this.collections.get(name)!;
  }
}

describe("MongoDB Adapter Contract Test Suite", () => {
  runAdapterTests(() => {
    const db = new MockDb();
    return createMongoAdapter(db as any);
  });

  describe("ensureIndexes", () => {
    it("creates all required indexes on mongodb collections", async () => {
      const db = new MockDb();
      await ensureIndexes(db as any);

      const usersCol = db.collection(COLLECTION_NAMES.USERS);
      const sessionsCol = db.collection(COLLECTION_NAMES.SESSIONS);
      const accountsCol = db.collection(COLLECTION_NAMES.ACCOUNTS);
      const vtCol = db.collection(COLLECTION_NAMES.VERIFICATION_TOKENS);
      const metaCol = db.collection(COLLECTION_NAMES.USER_METADATA);

      expect(usersCol.indexes).toContainEqual({
        keys: { email: 1 },
        options: { unique: true },
      });

      expect(sessionsCol.indexes).toContainEqual({
        keys: { token: 1 },
        options: { unique: true },
      });
      expect(sessionsCol.indexes).toContainEqual({
        keys: { expiresAt: 1 },
        options: { expireAfterSeconds: 0 },
      });

      expect(accountsCol.indexes).toContainEqual({
        keys: { provider: 1, providerAccountId: 1 },
        options: { unique: true },
      });

      expect(vtCol.indexes).toContainEqual({
        keys: { identifier: 1, token: 1 },
        options: { unique: true },
      });
      expect(vtCol.indexes).toContainEqual({
        keys: { expiresAt: 1 },
        options: { expireAfterSeconds: 0 },
      });

      expect(metaCol.indexes).toContainEqual({
        keys: { userId: 1, key: 1 },
        options: { unique: true },
      });
    });
  });
});
