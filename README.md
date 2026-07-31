# BolkAuth

> Self-hosted, type-safe authentication for TypeScript. Clerk-like DX, fully owned.

[![npm](https://img.shields.io/npm/v/@bolkauth/core)](https://www.npmjs.com/package/@bolkauth/core)
[![license](https://img.shields.io/github/license/shrey/clerk)](LICENSE)
[![docs](https://img.shields.io/badge/docs-bolkauth-blue)](https://shrey.github.io/clerk/bolkauth)

---

## ⚡ Features

- 🔐 **Password Auth** — Built-in salted PBKDF2 hashing via Web Crypto API
- 🔗 **Magic Links** — Passwordless verification via secure tokens
- 🌐 **OAuth Providers** — Built-in GitHub and Google OAuth 2.0 with state CSRF protection
- 🧭 **Onboarding Engine** — Finite state machine tracking onboarding steps & user completion
- 🗄️ **Database Adapters** — Official Drizzle ORM and Prisma ORM adapters
- ⚡ **Headless React Hooks** — `useSignIn`, `useSignUp`, `useUser`, `useOAuth`, `useOnboarding`
- 🖥️ **Next.js App Router** — Route Handlers, Edge Middleware, and Server Component helpers
- 🛠️ **CLI Scaffolding** — Interactive project setup (`npx @bolkauth/cli init`)

---

## 📦 Monorepo Packages

| Package | Version | Description |
|---|---|---|
| [`@bolkauth/core`](./packages/core) | `0.1.0` | Core framework-agnostic auth engine |
| [`@bolkauth/react`](./packages/react) | `0.1.0` | React hooks & `<BolkAuthProvider>` |
| [`@bolkauth/nextjs`](./packages/nextjs) | `0.1.0` | Next.js App Router handlers & middleware |
| [`@bolkauth/adapter-drizzle`](./packages/adapter-drizzle) | `0.1.0` | Drizzle ORM adapter & schema |
| [`@bolkauth/adapter-prisma`](./packages/adapter-prisma) | `0.1.0` | Prisma ORM adapter & schema |
| [`@bolkauth/cli`](./packages/cli) | `0.1.0` | CLI setup wizard (`bolkauth init`) |

---

## 🚀 Quick Start

Initialize BolkAuth in your project with one command:

```bash
npx @bolkauth/cli init
```

---

## 📄 License

MIT © [BolkAuth Contributors](LICENSE)
