import { select, log, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

export async function add(args: string[]) {
  let adapter = args[0];
  if (!adapter) {
    adapter = (await select({
      message: "Which adapter would you like to add?",
      options: [
        { value: "drizzle", label: "Drizzle ORM" },
        { value: "prisma", label: "Prisma" },
        { value: "mongodb", label: "MongoDB" },
      ],
    })) as string;
  }

  let dialect = args[1];
  if ((adapter === "drizzle" || adapter === "prisma") && !dialect) {
    dialect = (await select({
      message: `Which dialect would you like to use for ${adapter}?`,
      options: [
        { value: "pg", label: "PostgreSQL" },
        { value: "mysql", label: "MySQL" },
        { value: "sqlite", label: "SQLite" },
      ],
    })) as string;
  }

  const s = spinner();

  if (adapter === "drizzle") {
    s.start(`Adding Drizzle schema (${dialect || "pg"})...`);
    const dbDir = path.join(process.cwd(), "db");
    await fs.ensureDir(dbDir);

    let schemaContent = "";
    if (dialect === "mysql") {
      schemaContent = `
import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;
    } else if (dialect === "sqlite") {
      schemaContent = `
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
`;
    } else {
      schemaContent = `
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;
    }

    await fs.writeFile(path.join(dbDir, "schema.ts"), schemaContent.trim() + "\n");
    s.stop(`Drizzle schema (${dialect || "pg"}) generated at db/schema.ts`);
  } else if (adapter === "prisma") {
    s.start(`Adding Prisma models (${dialect || "pg"})...`);
    const prismaDir = path.join(process.cwd(), "prisma");
    await fs.ensureDir(prismaDir);

    const schemaFile = path.join(prismaDir, "schema.prisma");
    const provider =
      dialect === "mysql"
        ? "mysql"
        : dialect === "sqlite"
        ? "sqlite"
        : "postgresql";

    const modelContent = `
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now())
}
`;

    if (await fs.pathExists(schemaFile)) {
      await fs.appendFile(schemaFile, "\n" + modelContent.trim() + "\n");
    } else {
      const baseContent = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}
`;
      await fs.writeFile(schemaFile, baseContent.trim() + "\n\n" + modelContent.trim() + "\n");
    }
    s.stop(`Prisma models added to prisma/schema.prisma (${provider})`);
  } else if (adapter === "mongodb") {
    s.start("Adding MongoDB connection setup...");
    const dbDir = path.join(process.cwd(), "db");
    await fs.ensureDir(dbDir);

    const mongoContent = `
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bolkauth";

let client: MongoClient;
let db: ReturnType<MongoClient["db"]>;

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };
  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri);
}

db = client.db();

export { client, db };
`;
    await fs.writeFile(path.join(dbDir, "db.ts"), mongoContent.trim() + "\n");
    s.stop("MongoDB setup generated at db/db.ts");
  } else {
    log.error(`Unknown adapter: ${adapter}`);
  }
}
