<div align="center">

# ⚡ BolkAuth

**High-performance, self-hosted, type-safe authentication for TypeScript & Next.js.**

*Clerk-like developer experience, zero vendor lock-in, full database ownership.*

[![npm version](https://img.shields.io/npm/v/@bolkauth/core?color=blue&style=flat-square)](https://www.npmjs.com/package/@bolkauth/core)
[![license](https://img.shields.io/github/license/Shreyvats01/authflow?color=emerald&style=flat-square)](LICENSE)
[![docs](https://img.shields.io/badge/docs-bolkauth-indigo?style=flat-square)](https://Shreyvats01.github.io/authflow/bolkauth)
[![typescript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br />

[Quickstart](#-quickstart-in-5-minutes) &bull; [Documentation](https://Shreyvats01.github.io/authflow/bolkauth) &bull; [Monorepo Packages](#-monorepo-packages) &bull; [Architecture](#-architecture) &bull; [License](#-license)

</div>

---

## ✨ Why BolkAuth?

Modern web authentication usually forces a compromise: pay high monthly per-MAU subscription fees for hosted SaaS providers, or spend weeks writing custom authentication boilerplate.

**BolkAuth** bridges this gap:
- 🚀 **Clerk-like DX**: Headless React hooks, Next.js Edge Middleware, and Server Component helpers.
- 🗄️ **Full Data Sovereignty**: Store users and sessions directly in your own PostgreSQL database via Drizzle or Prisma.
- 🔒 **Zero Native Dependencies**: 100% Web Crypto API (`crypto.subtle`) for PBKDF2 password hashing and HMAC-SHA256 tokens.
- 🧭 **Built-in Onboarding Engine**: Multi-step user onboarding state machine with automatic access redirects.

---

## 📦 Monorepo Packages

BolkAuth is architected as a modular, tree-shakeable monorepo:

| Package | Version | Description |
|---|---|---|
| [`@bolkauth/core`](./packages/core) | `0.1.0` | Zero-dependency Web Crypto auth engine (JWT, PBKDF2, OAuth 2.0, FSM) |
| [`@bolkauth/react`](./packages/react) | `0.1.0` | Headless React hooks (`useSignIn`, `useOAuth`) & `<BolkAuthProvider>` |
| [`@bolkauth/nextjs`](./packages/nextjs) | `0.1.0` | Next.js App Router handlers (`bolkAuthHandler`), Edge Middleware, & Server Helpers |
| [`@bolkauth/adapter-drizzle`](./packages/adapter-drizzle) | `0.1.0` | PostgreSQL table definitions & Drizzle ORM adapter |
| [`@bolkauth/adapter-prisma`](./packages/adapter-prisma) | `0.1.0` | Prisma ORM adapter & schema models |
| [`@bolkauth/cli`](./packages/cli) | `0.1.0` | Interactive scaffolding wizard (`npx @bolkauth/cli init`) |

---

## ⚡ Quickstart in 5 Minutes

### 1. Interactive CLI Setup

Scaffold BolkAuth in any Next.js or React application:

```bash
npx @bolkauth/cli init
```

*Or install dependencies manually:*
```bash
pnpm add @bolkauth/core @bolkauth/nextjs @bolkauth/react @bolkauth/adapter-drizzle
```

### 2. Configure Auth Engine (`lib/auth.ts`)

```ts
import { createBolkAuth } from "@bolkauth/core";
import { createDrizzleAdapter } from "@bolkauth/adapter-drizzle";
import { db } from "./db";

export const auth = createBolkAuth({
  adapter: createDrizzleAdapter(db),
  secret: process.env.BOLKAUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  onboarding: {
    enabled: true,
    requiredForAccess: true,
    redirectUrl: "/onboarding",
  },
});
```

### 3. Expose API Route Handler (`app/api/auth/[...bolkauth]/route.ts`)

```ts
import { bolkAuthHandler } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

export const { GET, POST, PATCH, DELETE } = bolkAuthHandler(auth);
```

### 4. Wrap Application with Provider (`app/layout.tsx`)

```tsx
import { BolkAuthProvider } from "@bolkauth/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BolkAuthProvider config={{ baseURL: "/api/auth" }}>
          {children}
        </BolkAuthProvider>
      </body>
    </html>
  );
}
```

### 5. Protect Routes via Edge Middleware (`middleware.ts`)

```ts
import { bolkAuthMiddleware } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

export default bolkAuthMiddleware(auth, {
  signInUrl: "/sign-in",
  onboardingUrl: "/onboarding",
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/auth"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

---

## 🔑 Headless React Hooks Example

Build custom, unstyled auth UIs with full control over design and state:

```tsx
"use client";

import { useSignIn, useOAuth } from "@bolkauth/react";
import { useState } from "react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, error } = useSignIn();
  const { signInWithOAuth } = useOAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn({ email, password });
    if (!res.error) window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 text-white rounded-xl border border-slate-800">
      <h2 className="text-xl font-bold mb-4">Sign In</h2>
      {error && <p className="text-red-400 text-sm mb-4">{error.message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => signInWithOAuth("github")}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
        >
          Continue with GitHub
        </button>
      </div>
    </div>
  );
}
```

---

## 🖥️ Server Component Integration

Retrieve the active session and user in Next.js Server Components:

```tsx
import { createServerHelpers } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

const { requireAuth } = createServerHelpers(auth);

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="p-8">
      <h1>Welcome back, {user.name || user.email}!</h1>
    </div>
  );
}
```

---

## 🔒 Security Specifications

- **Password Hashing**: PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte cryptographically secure random salt (`crypto.getRandomValues`).
- **Session Tokens**: Cryptographically strong random 32-byte hexadecimal session tokens.
- **Cookies**: HTTP-only, `SameSite=Lax`, `Secure` in production, with configurable Max-Age (default: 30 days).
- **OAuth Protection**: OAuth 2.0 PKCE flow with state CSRF cookies to prevent login cross-site request forgery.

---

## 🤝 Contributing

Contributions are always welcome! Please check out our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

1. Fork the repo and create a feature branch (`git checkout -b feature/my-feature`).
2. Install dependencies: `pnpm install`.
3. Run tests: `pnpm test`.
4. Commit changes following conventional commits (`feat: add provider`).

---

## 📄 License

BolkAuth is open-source software licensed under the **[MIT License](LICENSE)**.
