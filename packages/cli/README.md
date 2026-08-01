# @bolkauth/cli

[![npm version](https://img.shields.io/npm/v/@bolkauth/cli.svg)](https://www.npmjs.com/package/@bolkauth/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Interactive CLI setup wizard, schema generator, and helper tool for the **BolkAuth** ecosystem.

## Features

- 🪄 **Interactive Setup Wizard**: Rapidly initialize BolkAuth configuration and automatic dependency installation.
- 🗄️ **Schema Generation**: Add Drizzle ORM or Prisma models to your project with a single command.
- ⚙️ **Env & Types Generators**: Scaffolds `.env.example` templates and custom TypeScript type definitions.
- 📦 **Package Manager Detection**: Automatic detection and installation via `npm`, `pnpm`, `yarn`, or `bun`.
- 🤖 **CI/CD Integration**: Streamlined commands suitable for build pipelines and automated repository initialization.

---

## Installation & Usage

You can run `bolkauth` directly using `npx`, `pnpm dlx`, or `bunx`:

```bash
npx @bolkauth/cli <command>
# or globally
npm install -g @bolkauth/cli
bolkauth <command>
```

---

## Commands Reference

### 1. `bolkauth init`

Runs an interactive step-by-step setup wizard that prompts for your database adapter, authentication features, and onboarding preference.

```bash
npx bolkauth init
```

#### What `init` does:
1. Prompts for Database Adapter (`Drizzle ORM` or `Prisma`).
2. Selects active Auth Features (`Password Auth`, `Magic Links`, `OAuth`).
3. Prompts for onboarding flow preference.
4. Generates standard configuration file at `lib/auth.ts`.
5. Auto-detects package manager (`pnpm`, `npm`, `yarn`, `bun`) and installs `@bolkauth/core` and the appropriate adapter package.

---

### 2. `bolkauth add <adapter>`

Generates database schema definitions for your project.

```bash
# Add Drizzle schema to db/schema.ts
npx bolkauth add drizzle

# Add Prisma schema models to prisma/schema.prisma
npx bolkauth add prisma
```

#### Outputs:
- `drizzle`: Creates `db/schema.ts` with PostgreSQL table definitions (`users`).
- `prisma`: Appends or creates `prisma/schema.prisma` with `User` model definitions.

---

### 3. `bolkauth generate <target>`

Generates boilerplate files such as environment templates and TypeScript definitions.

```bash
# Generate .env.example
npx bolkauth generate env

# Generate TypeScript declarations at types/bolkauth.d.ts
npx bolkauth generate types
```

#### Targets:
- `env`: Creates `.env.example` populated with `BOLKAUTH_SECRET`, `DATABASE_URL`, and OAuth credentials placeholders.
- `types`: Generates `types/bolkauth.d.ts` containing core TypeScript interface stubs.

---

### 4. `bolkauth status`

Verifies that `@bolkauth/cli` is correctly configured and operational.

```bash
npx bolkauth status
```

---

## CI/CD & Automated Setup

In CI/CD automation pipelines (e.g. GitHub Actions, Docker builds), you can invoke specific non-interactive sub-commands directly to generate environment templates or type files automatically during build steps.

### Example GitHub Actions Workflow Step:

```yaml
name: Generate Auth Environment Template

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx @bolkauth/cli generate env
      - run: npx @bolkauth/cli generate types
```

---

## Command Overview Table

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `bolkauth init` | None | Interactive configuration & package installation wizard. |
| `bolkauth add` | `drizzle` \| `prisma` | Scaffolds database schemas for Drizzle or Prisma. |
| `bolkauth generate` | `env` \| `types` | Generates `.env.example` or TypeScript definition files. |
| `bolkauth status` | None | Checks CLI availability and system status. |

---

## License

[MIT](./LICENSE) © BolkAuth
