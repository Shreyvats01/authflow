import { describe, it, expect, vi, beforeEach } from "vitest";
import mysql from "mysql2/promise";
import { createMysql2Driver } from "./index";

vi.mock("mysql2/promise", () => {
  return {
    default: {
      createPool: vi.fn().mockImplementation((config) => {
        return {
          config,
          getConnection: vi.fn(),
          query: vi.fn(),
          execute: vi.fn(),
          end: vi.fn(),
        };
      }),
    },
  };
});

describe("createMysql2Driver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes pool with connectionLimit: 10 and enableKeepAlive: true and returns { connection, db, adapter }", async () => {
    const result = await createMysql2Driver({});

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionLimit: 10,
        enableKeepAlive: true,
      })
    );
    expect(result).toHaveProperty("connection");
    expect(result).toHaveProperty("db");
    expect(result).toHaveProperty("adapter");
    expect(result.connection).toBeDefined();
    expect(result.db).toBeDefined();
    expect(result.adapter).toBeDefined();
  });

  it("handles connectionString and config overrides", async () => {
    const result = await createMysql2Driver({
      connectionString: "mysql://user:pass@localhost:3306/db",
      config: {
        connectionLimit: 20,
      },
    });

    expect(mysql.createPool).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: "mysql://user:pass@localhost:3306/db",
        connectionLimit: 20,
        enableKeepAlive: true,
      })
    );
    expect(result.connection).toBeDefined();
    expect(result.db).toBeDefined();
    expect(result.adapter).toBeDefined();
  });
});
