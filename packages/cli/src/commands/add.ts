import { log, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

export async function add(args: string[]) {
  if (args.length === 0) {
    log.error("Please specify an adapter to add (drizzle or prisma).");
    return;
  }

  const adapter = args[0];
  const s = spinner();

  if (adapter === "drizzle") {
    s.start("Adding Drizzle schema...");
    const dbDir = path.join(process.cwd(), "db");
    await fs.ensureDir(dbDir);
    
    const schemaContent = `
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;
    await fs.writeFile(path.join(dbDir, "schema.ts"), schemaContent.trim());
    s.stop("Drizzle schema generated at db/schema.ts");
  } else if (adapter === "prisma") {
    s.start("Adding Prisma models...");
    const prismaDir = path.join(process.cwd(), "prisma");
    await fs.ensureDir(prismaDir);
    
    const schemaFile = path.join(prismaDir, "schema.prisma");
    const modelContent = `
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now())
}
`;
    
    if (await fs.pathExists(schemaFile)) {
      await fs.appendFile(schemaFile, "\\n" + modelContent.trim() + "\\n");
    } else {
      const baseContent = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;
      await fs.writeFile(schemaFile, baseContent.trim() + "\\n\\n" + modelContent.trim() + "\\n");
    }
    s.stop("Prisma models added to prisma/schema.prisma");
  } else {
    log.error(`Unknown adapter: ${adapter}`);
  }
}
