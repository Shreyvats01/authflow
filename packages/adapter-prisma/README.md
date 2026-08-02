# @bolkauth/adapter-prisma

[![npm version](https://img.shields.io/npm/v/@bolkauth/adapter-prisma.svg)](https://www.npmjs.com/package/@bolkauth/adapter-prisma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Prisma ORM adapter for **BolkAuth**. Built to seamlessly support multiple database dialects, including **PostgreSQL**, **MySQL**, and **SQLite**.

---

## Features

- 💎 **Multi-Dialect Support**: Production-ready Prisma schemas for PostgreSQL, MySQL, and SQLite.
- 🔐 **Token Security**: Automatic SHA-256 token hashing for sessions and verification tokens.
- 📐 **Complete Data Models**: Standardized Prisma models (`AuthUser`, `AuthSession`, `AuthAccount`, `AuthVerificationToken`, `AuthUserMetadata`).
- 🔄 **Cascade Deletions**: Automatic foreign key cascade cleanup on user deletion.
- 📦 **Exported Schema Paths**: Programmatically access dialect-specific schema file paths (`postgresqlSchemaPath`, `mysqlSchemaPath`, `sqliteSchemaPath`).

---

## Installation

```bash
npm install @bolkauth/adapter-prisma @bolkauth/core @prisma/client
npm install -D prisma
# or
pnpm add @bolkauth/adapter-prisma @bolkauth/core @prisma/client
pnpm add -D prisma
```

---

## Database Schemas & Dialect Setup

`@bolkauth/adapter-prisma` includes pre-built schema definitions optimized for each supported database dialect. Choose the schema below that matches your target database.

### 1. PostgreSQL Schema (`prisma/postgresql.prisma`)

Uses `@db.Text` for large payload fields like tokens and metadata values.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model AuthUser {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      AuthSession[]
  accounts      AuthAccount[]
  metadata      AuthUserMetadata[]
}

model AuthSession {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  accessToken       String?  @db.Text
  refreshToken      String?  @db.Text
  expiresAt         Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model AuthVerificationToken {
  identifier String
  token      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}

model AuthUserMetadata {
  userId    String
  key       String
  value     String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, key])
}
```

### 2. MySQL Schema (`prisma/mysql.prisma`)

Includes explicit `@db.VarChar(191)` annotations for indexed columns to respect MySQL index key length limits, and `@db.Text` for text fields.

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model AuthUser {
  id            String    @id @default(cuid()) @db.VarChar(191)
  email         String    @unique @db.VarChar(191)
  emailVerified DateTime?
  name          String?
  image         String?   @db.Text
  password      String?   @db.Text
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      AuthSession[]
  accounts      AuthAccount[]
  metadata      AuthUserMetadata[]
}

model AuthSession {
  id        String   @id @default(cuid()) @db.VarChar(191)
  userId    String   @db.VarChar(191)
  expiresAt DateTime
  token     String   @unique @db.VarChar(191)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuthAccount {
  id                String   @id @default(cuid()) @db.VarChar(191)
  userId            String   @db.VarChar(191)
  provider          String   @db.VarChar(191)
  providerAccountId String   @db.VarChar(191)
  accessToken       String?  @db.Text
  refreshToken      String?  @db.Text
  expiresAt         Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model AuthVerificationToken {
  identifier String   @db.VarChar(191)
  token      String   @db.VarChar(191)
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}

model AuthUserMetadata {
  userId    String   @db.VarChar(191)
  key       String   @db.VarChar(191)
  value     String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, key])
}
```

### 3. SQLite Schema (`prisma/sqlite.prisma`)

Uses clean standard Prisma types without `@db.*` native attribute annotations.

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model AuthUser {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions      AuthSession[]
  accounts      AuthAccount[]
  metadata      AuthUserMetadata[]
}

model AuthSession {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model AuthVerificationToken {
  identifier String
  token      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}

model AuthUserMetadata {
  userId    String
  key       String
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, key])
}
```

---

## Migrations & Client Generation

Run Prisma CLI commands to generate the client and apply migrations for your database:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations in development
npx prisma migrate dev --name init_bolkauth

# Deploy migrations in production / CI
npx prisma migrate deploy
```

---

## Adapter Setup

Initialize `createPrismaAdapter` with your `PrismaClient` instance. The adapter is dialect-agnostic and works seamlessly with PostgreSQL, MySQL, or SQLite:

```typescript
// lib/auth.ts
import { PrismaClient } from "@prisma/client";
import { createPrismaAdapter } from "@bolkauth/adapter-prisma";
import { createBolkAuth } from "@bolkauth/core";

const prisma = new PrismaClient();

export const auth = createBolkAuth({
  adapter: createPrismaAdapter(prisma),
  secret: process.env.BOLKAUTH_SECRET!,
});
```

---

## API Reference

### `createPrismaAdapter(db: PrismaClient)`

Accepts an initialized `PrismaClient` instance and exposes dialect-agnostic CRUD methods for BolkAuth:

- **Users**: `createUser(user)`, `findUserById(id)`, `findUserByEmail(email)`, `updateUser(id, data)`, `deleteUser(id)`
- **Sessions**: `createSession(session)`, `findSessionByToken(token)`, `updateSession(id, data)`, `deleteSession(id)`, `deleteUserSessions(userId)`
- **Accounts**: `createAccount(account)`, `findAccountByProvider(provider, providerAccountId)`
- **Verification Tokens**: `createVerificationToken(token)`, `findVerificationToken(identifier, token)`, `deleteVerificationToken(identifier, token)`
- **User Metadata**: `getUserMetadata(userId, key)`, `updateUserMetadata(userId, key, value)`

### Exported Schema Paths

The package exports absolute paths to the schema files:

```typescript
import {
  postgresqlSchemaPath,
  mysqlSchemaPath,
  sqliteSchemaPath,
  schemaPath, // Deprecated alias for postgresqlSchemaPath
} from "@bolkauth/adapter-prisma";

console.log(postgresqlSchemaPath); // Absolute path to postgresql.prisma
console.log(mysqlSchemaPath);      // Absolute path to mysql.prisma
console.log(sqliteSchemaPath);     // Absolute path to sqlite.prisma
```

---

## License

[MIT](./LICENSE) © BolkAuth
