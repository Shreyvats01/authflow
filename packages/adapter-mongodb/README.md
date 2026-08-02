# @bolkauth/adapter-mongodb

MongoDB adapter for [BolkAuth](https://github.com/Shreyvats01/bolkauth).

## Installation

```bash
pnpm add @bolkauth/adapter-mongodb mongodb
```

## Usage

```ts
import { createMongoAdapter } from "@bolkauth/adapter-mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
await client.connect();
const db = client.db("bolkauth");

const adapter = createMongoAdapter(db);
```

## License

MIT
