import { describe } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createDrizzleAdapter } from "./sqlite";
import { runAdapterTests } from "@bolkauth/core/testing";

function setupDatabase() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bolkauth_users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER,
      image TEXT,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS bolkauth_accounts (
      user_id TEXT NOT NULL REFERENCES bolkauth_users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      PRIMARY KEY (provider, provider_account_id)
    );

    CREATE TABLE IF NOT EXISTS bolkauth_sessions (
      session_token TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES bolkauth_users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bolkauth_verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires INTEGER NOT NULL,
      PRIMARY KEY (identifier, token)
    );

    CREATE TABLE IF NOT EXISTS bolkauth_user_metadata (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES bolkauth_users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const db = drizzle(sqlite);
  return { adapter: createDrizzleAdapter(db), sqlite };
}

let activeSqlite: Database.Database | null = null;

describe("Drizzle Adapter Contract Test Suite (SQLite)", () => {
  runAdapterTests(
    () => {
      const { adapter, sqlite } = setupDatabase();
      activeSqlite = sqlite;
      return adapter;
    },
    () => {
      if (activeSqlite) {
        activeSqlite.close();
        activeSqlite = null;
      }
    }
  );
});
