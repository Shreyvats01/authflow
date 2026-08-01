# @bolkauth/adapter-prisma

[![npm version](https://img.shields.io/npm/v/@bolkauth/adapter-prisma.svg)](https://www.npmjs.com/package/@bolkauth/adapter-prisma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Prisma ORM adapter for **BolkAuth**. Compatible with PostgreSQL, MySQL, SQLite, and CockroachDB via Prisma Client.

## Features

- 💎 **Prisma Client Support**: Clean integration with standard `@prisma/client`.
- 🔐 **Token Security**: SHA-256 token hashing for sessions and verification tokens.
- 📐 **Complete Data Models**: Standardized Prisma models (`AuthUser`, `AuthSession`, `AuthAccount`, `AuthVerificationToken`, `AuthUserMetadata`).
- 🔄 **Cascade Deletions**: Automatic foreign key cascade cleanup on user deletion.
- 📦 **Exported Schema Reference**: Exported `schemaPath` constant for programmatic schema loading.

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

## Prisma Schema Configuration

Add the BolkAuth models to your `prisma/schema.prisma` file:

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

Run Prisma CLI commands to generate the client and apply migrations:

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

Initialize the `createPrismaAdapter` with your `PrismaClient` instance:

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

Accepts an initialized `PrismaClient` instance and exposes full CRUD adapter methods for BolkAuth:

- `createUser(user)` / `findUserById(id)` / `findUserByEmail(email)` / `updateUser(id, data)` / `deleteUser(id)`
- `createSession(session)` / `findSessionByToken(token)` / `updateSession(id, data)` / `deleteSession(id)` / `deleteUserSessions(userId)`
- `createAccount(account)` / `findAccountByProvider(provider, providerAccountId)`
- `createVerificationToken(token)` / `findVerificationToken(identifier, token)` / `deleteVerificationToken(identifier, token)`
- `getUserMetadata(userId, key)` / `updateUserMetadata(userId, key, value)`

### Helper Export: `schemaPath`

```typescript
import { schemaPath } from "@bolkauth/adapter-prisma";
console.log(schemaPath); // Path to default schema.prisma provided by adapter
```

---

## License

[MIT](./LICENSE) © BolkAuth
