# @bolkauth/driver-mongodb

[![npm version](https://img.shields.io/npm/v/@bolkauth/driver-mongodb.svg)](https://www.npmjs.com/package/@bolkauth/driver-mongodb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MongoDB driver factory helper for **BolkAuth**. Connects via `mongodb` MongoClient, automatically configures TTL and unique collection indexes, and returns a ready-to-use BolkAuth MongoDB adapter.

## Installation

```bash
pnpm add @bolkauth/driver-mongodb @bolkauth/adapter-mongodb @bolkauth/core mongodb
```

## Quickstart

```typescript
import { createMongoDriver } from "@bolkauth/driver-mongodb";
import { createBolkAuth } from "@bolkauth/core";

// 1. Connect to MongoDB and set up indexes + adapter in one step
const { client, db, adapter } = await createMongoDriver({
  uri: process.env.MONGODB_URI!,
  dbName: "my_app_auth",
});

// 2. Initialize BolkAuth engine
export const auth = createBolkAuth({
  adapter,
  secret: process.env.BOLKAUTH_SECRET!,
});
```

## License

[MIT](./LICENSE) © BolkAuth
