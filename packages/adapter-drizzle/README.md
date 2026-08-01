# @bolkauth/adapter-drizzle

[![npm version](https://img.shields.io/npm/v/@bolkauth/adapter-drizzle.svg)](https://www.npmjs.com/package/@bolkauth/adapter-drizzle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Drizzle ORM PostgreSQL adapter for **BolkAuth**. Provides pre-built schema definitions, session token hashing, metadata storage, and seamless integration with Drizzle Kit.

## Features

- 🗄️ **PostgreSQL Support**: Optimized for PostgreSQL via Drizzle ORM (`drizzle-orm/pg-core`).
- 🔐 **Token Hashing**: Built-in SHA-256 token hashing for sessions and verification tokens.
- 📦 **Exported Table Schemas**: Pre-defined PostgreSQL tables (`authUsers`, `authSessions`, `authAccounts`, `authVerificationTokens`, `authUserMetadata`).
- ⚡ **Connection Pooling**: Native compatibility with `pg`, `postgres.js`, `@neondatabase/serverless`, and `@planetscale/database`.
- 🛠️ **Drizzle Kit Ready**: Easily run schema migrations and pushes.

---

## Installation

```bash
npm install @bolkauth/adapter-drizzle @bolkauth/core drizzle-orm pg
npm install -D drizzle-kit @types/pg
# or
pnpm add @bolkauth/adapter-drizzle @bolkauth/core drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

---

## Database Schema Setup

Export BolkAuth table definitions in your Drizzle schema file (e.g. `db/schema.ts`):

```typescript
// db/schema.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
export {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
  authUserMetadata,
} from "@bolkauth/adapter-drizzle";

// Optionally add your application tables here
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  authorId: text("author_id").notNull(),
});
```

### Table Definitions Reference

BolkAuth manages 5 PostgreSQL tables in your database:

| Exported Table | Database Table Name | Key Fields | Description |
| :--- | :--- | :--- | :--- |
| `authUsers` | `bolkauth_users` | `id`, `email`, `password`, `emailVerified`, `name`, `image` | Stores core user identities and auth credentials. |
| `authAccounts` | `bolkauth_accounts` | `userId`, `provider`, `providerAccountId`, `access_token` | Stores linked OAuth provider credentials. |
| `authSessions` | `bolkauth_sessions` | `sessionToken` (SHA-256), `userId`, `expires` | Tracks active authenticated sessions. |
| `authVerificationTokens` | `bolkauth_verification_tokens` | `identifier`, `token` (SHA-256), `expires` | Password reset and email magic link verification tokens. |
| `authUserMetadata` | `bolkauth_user_metadata` | `id`, `userId`, `key`, `value` (JSONB) | Key-value store for user metadata & custom settings. |

---

## Adapter Initialization & Connection Pooling

Set up your PostgreSQL database connection pool and initialize `createDrizzleAdapter`:

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createDrizzleAdapter } from "@bolkauth/adapter-drizzle";
import { createBolkAuth } from "@bolkauth/core";
import * as schema from "./schema";

// 1. Connection pooling with pg.Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });

// 2. Initialize BolkAuth with Drizzle Adapter
export const auth = createBolkAuth({
  adapter: createDrizzleAdapter(db),
  secret: process.env.BOLKAUTH_SECRET!,
});
```

---

## Migrations & Schema Push

### 1. Configure `drizzle.config.ts`

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 2. Generate and Apply Migrations

```bash
# Push schema directly to database (development)
npx drizzle-kit push

# Or generate migration files for production
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## API Reference

### `createDrizzleAdapter(db: DrizzleDatabase)`

Factory function returning a full `BolkAuthAdapter` instance.

#### Adapter Methods Implemented:

- **Users**: `createUser`, `findUserById`, `findUserByEmail`, `updateUser`, `deleteUser`
- **Sessions**: `createSession`, `findSessionByToken`, `updateSession`, `deleteSession`, `deleteUserSessions`
- **Accounts**: `createAccount`, `findAccountByProvider`
- **Verification Tokens**: `createVerificationToken`, `findVerificationToken`, `deleteVerificationToken`
- **Metadata**: `getUserMetadata`, `updateUserMetadata`

---

## License

[MIT](./LICENSE) © BolkAuth
