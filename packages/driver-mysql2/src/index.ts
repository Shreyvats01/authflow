import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql, { type PoolOptions } from "mysql2/promise";
import { createDrizzleAdapter } from "@bolkauth/adapter-drizzle/mysql";
import * as mysqlSchema from "@bolkauth/adapter-drizzle/mysql";

export interface Mysql2DriverOptions {
  connectionString?: string;
  config?: PoolOptions;
  /**
   * Optional custom schema object if extending BolkAuth tables.
   */
  schema?: Record<string, unknown>;
}

export interface Mysql2DriverResult {
  connection: mysql.Pool;
  db: MySql2Database<typeof mysqlSchema>;
  adapter: ReturnType<typeof createDrizzleAdapter>;
}

export async function createMysql2Driver(options: Mysql2DriverOptions): Promise<Mysql2DriverResult> {
  const poolOptions: PoolOptions = {
    connectionLimit: 10,
    enableKeepAlive: true,
    ...(options.connectionString ? { uri: options.connectionString } : {}),
    ...options.config,
  };

  const connection = mysql.createPool(poolOptions);

  const db = drizzle(connection, { schema: options.schema ?? mysqlSchema, mode: "default" });
  const adapter = createDrizzleAdapter(db);

  return {
    connection,
    db,
    adapter,
  };
}

export * from "@bolkauth/adapter-drizzle/mysql";
