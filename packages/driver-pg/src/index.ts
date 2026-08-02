import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { createDrizzleAdapter, pgSchema } from "@bolkauth/adapter-drizzle/pg";

export interface PgDriverOptions extends PoolConfig {
  /**
   * Optional custom schema object if extending BolkAuth tables.
   */
  schema?: Record<string, unknown>;
}

export interface PgDriverResult {
  pool: Pool;
  db: NodePgDatabase<typeof pgSchema>;
  adapter: ReturnType<typeof createDrizzleAdapter>;
}

export function createPgDriver(options: PgDriverOptions): PgDriverResult {
  const { schema, ...poolConfig } = options;
  const pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ...poolConfig,
  });
  const db = drizzle(pool, schema ? { schema } : undefined) as NodePgDatabase<typeof pgSchema>;
  const adapter = createDrizzleAdapter(db);

  return {
    pool,
    db,
    adapter,
  };
}

export * from "@bolkauth/adapter-drizzle/pg";
