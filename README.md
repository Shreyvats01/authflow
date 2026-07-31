# AuthFlow

> Self-hosted, type-safe authentication for TypeScript. Clerk-like DX, fully owned.

[![npm](https://img.shields.io/npm/v/@authflow/core)](https://www.npmjs.com/package/@authflow/core)
[![license](https://img.shields.io/github/license/authflow/authflow)](LICENSE)
[![docs](https://img.shields.io/badge/docs-authflow-blue)](https://shrey.github.io/clerk)

---

## ⚡ Features

- 🔐 **Password Auth** — Built-in salted PBKDF2 hashing via Web Crypto API
- 🔗 **Magic Links** — Passwordless verification via secure tokens
- 🌐 **OAuth Providers** — Built-in GitHub and Google OAuth 2.0 with state CSRF protection
- 🧭 **Onboarding Engine** — Finite state machine tracking onboarding steps & user completion
- 🗄️ **Database Adapters** — Official Drizzle ORM and Prisma ORM adapters
- ⚡ **Headless React Hooks** — `useSignIn`, `useSignUp`, `useUser`, `useOAuth`, `useOnboarding`
- 🖥️ **Next.js App Router** — Route Handlers, Edge Middleware, and Server Component helpers
- 🛠️ **CLI Scaffolding** — Interactive project setup (`npx @authflow/cli init`)

---

## 📦 Monorepo Packages

| Package | Version | Description |
|---|---|---|
| [`@authflow/core`](./packages/core) | `0.1.0` | Core framework-agnostic auth engine |
| [`@authflow/react`](./packages/react) | `0.1.0` | React hooks & `<AuthFlowProvider>` |
| [`@authflow/nextjs`](./packages/nextjs) | `0.1.0` | Next.js App Router handlers & middleware |
| [`@authflow/adapter-drizzle`](./packages/adapter-drizzle) | `0.1.0` | Drizzle ORM adapter & schema |
| [`@authflow/adapter-prisma`](./packages/adapter-prisma) | `0.1.0` | Prisma ORM adapter & schema |
| [`@authflow/cli`](./packages/cli) | `0.1.0` | CLI setup wizard (`authflow init`) |

---

## 🚀 Quick Start

Initialize AuthFlow in your project with one command:

```bash
npx @authflow/cli init
```

---

## 📄 License

MIT © [AuthFlow Contributors](LICENSE)
