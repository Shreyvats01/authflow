# @bolkauth/driver-mysql2

[![npm version](https://img.shields.io/npm/v/@bolkauth/driver-mysql2.svg)](https://www.npmjs.com/package/@bolkauth/driver-mysql2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MySQL driver factory helper for **BolkAuth**. Connects via `mysql2` and returns an initialized Drizzle ORM database instance along with a ready-to-use BolkAuth MySQL adapter.

## Installation

```bash
pnpm add @bolkauth/driver-mysql2 @bolkauth/adapter-drizzle @bolkauth/core drizzle-orm mysql2
```

## Quickstart

```typescript
import { createMysql2Driver } from "@bolkauth/driver-mysql2";
import { createBolkAuth } from "@bolkauth/core";

// 1. Initialize MySQL connection and BolkAuth adapter in one step
const { connection, db, adapter } = await createMysql2Driver({
  connectionString: process.env.DATABASE_URL!,
});

// 2. Initialize BolkAuth engine
export const auth = createBolkAuth({
  adapter,
  secret: process.env.BOLKAUTH_SECRET!,
});
```

## License

[MIT](./LICENSE) © BolkAuth
