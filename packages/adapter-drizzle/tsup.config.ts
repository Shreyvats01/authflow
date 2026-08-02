import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/pg.ts', 'src/mysql.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['drizzle-orm', 'drizzle-orm/pg-core', 'drizzle-orm/mysql-core'],
});
