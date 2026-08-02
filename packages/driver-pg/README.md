# @bolkauth/driver-pg

[![npm version](https://img.shields.io/npm/v/@bolkauth/driver-pg.svg)](https://www.npmjs.com/package/@bolkauth/driver-pg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

PostgreSQL driver factory helper for **BolkAuth**. Connects via `pg.Pool` and returns an initialized Drizzle ORM database instance along with a ready-to-use BolkAuth adapter.

## Installation

```bash
pnpm add @bolkauth/driver-pg @bolkauth/adapter-drizzle @bolkauth/core drizzle-orm pg
pnpm add -D @types/pg
```

## Quickstart

```typescript
import { createPgDriver } from "@bolkauth/driver-pg";
import { createBolkAuth } from "@bolkauth/core";

// 1. Initialize PostgreSQL pool and BolkAuth adapter in one step
const { pool, db, adapter } = createPgDriver({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
  idleTimeoutMillis: 30000,
});

// 2. Initialize BolkAuth engine
export const auth = createBolkAuth({
  adapter,
  secret: process.env.BOLKAUTH_SECRET!,
});
```

## License

[MIT](./LICENSE) © BolkAuth
