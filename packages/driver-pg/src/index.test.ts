import { describe, it, expect, vi, beforeEach } from "vitest";
import { Pool } from "pg";
import { createPgDriver } from "./index";

vi.mock("pg", () => {
  const Pool = vi.fn().mockImplementation((config) => {
    return {
      options: config,
      connect: vi.fn(),
      query: vi.fn(),
      on: vi.fn(),
      end: vi.fn(),
    };
  });
  return { Pool };
});

describe("createPgDriver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes pool with default options (max: 20, idleTimeoutMillis: 30000) and returns { pool, db, adapter }", () => {
    const result = createPgDriver({});

    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      })
    );
    expect(result).toHaveProperty("pool");
    expect(result).toHaveProperty("db");
    expect(result).toHaveProperty("adapter");
    expect(result.pool).toBeDefined();
    expect(result.db).toBeDefined();
    expect(result.adapter).toBeDefined();
  });

  it("allows custom options to override or merge with default pool options", () => {
    const result = createPgDriver({
      host: "localhost",
      port: 5432,
      max: 50,
      idleTimeoutMillis: 10000,
    });

    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "localhost",
        port: 5432,
        max: 50,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
      })
    );
    expect(result.pool).toBeDefined();
    expect(result.db).toBeDefined();
    expect(result.adapter).toBeDefined();
  });
});
