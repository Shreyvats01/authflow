import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as adapterMongo from "@bolkauth/adapter-mongodb";
import { createMongoDriver } from "./index";

vi.mock("mongodb", () => {
  const mockDb = {
    collection: vi.fn().mockReturnValue({
      createIndex: vi.fn().mockResolvedValue(undefined),
    }),
  };
  const MongoClient = vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    db: vi.fn().mockReturnValue(mockDb),
  }));
  return { MongoClient };
});

vi.mock("@bolkauth/adapter-mongodb", async (importOriginal) => {
  const actual = await importOriginal<typeof adapterMongo>();
  return {
    ...actual,
    ensureIndexes: vi.fn().mockResolvedValue(undefined),
  };
});

describe("createMongoDriver", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("returns { client, db, adapter }", async () => {
    const result = await createMongoDriver({ uri: "mongodb://localhost:27017" });

    expect(result).toHaveProperty("client");
    expect(result).toHaveProperty("db");
    expect(result).toHaveProperty("adapter");
    expect(result.client).toBeDefined();
    expect(result.db).toBeDefined();
    expect(result.adapter).toBeDefined();
  });

  it("defaults autoEnsureIndexes to false in production environment", async () => {
    process.env.NODE_ENV = "production";
    await createMongoDriver({ uri: "mongodb://localhost:27017" });

    expect(adapterMongo.ensureIndexes).not.toHaveBeenCalled();
  });

  it("defaults autoEnsureIndexes to true in development environment", async () => {
    process.env.NODE_ENV = "development";
    await createMongoDriver({ uri: "mongodb://localhost:27017" });

    expect(adapterMongo.ensureIndexes).toHaveBeenCalledTimes(1);
  });

  it("allows explicit autoEnsureIndexes to override production environment setting", async () => {
    process.env.NODE_ENV = "production";
    await createMongoDriver({
      uri: "mongodb://localhost:27017",
      autoEnsureIndexes: true,
    });

    expect(adapterMongo.ensureIndexes).toHaveBeenCalledTimes(1);
  });

  it("allows explicit autoEnsureIndexes to override development environment setting", async () => {
    process.env.NODE_ENV = "development";
    await createMongoDriver({
      uri: "mongodb://localhost:27017",
      autoEnsureIndexes: false,
    });

    expect(adapterMongo.ensureIndexes).not.toHaveBeenCalled();
  });
});
