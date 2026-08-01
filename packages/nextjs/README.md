# @bolkauth/nextjs

[![npm version](https://img.shields.io/npm/v/@bolkauth/nextjs.svg)](https://www.npmjs.com/package/@bolkauth/nextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Seamless Next.js App Router and Edge Middleware integration for **BolkAuth**.

## Features

- 🚀 **App Router Handlers**: Drop-in REST route handlers (`GET`, `POST`, `PATCH`, `DELETE`) for Next.js 13+ App Router.
- ⚡ **Edge Middleware**: Lightweight middleware for route protection, authentication redirects, and onboarding enforcement.
- 🔒 **Server Component Helpers**: First-class async functions (`getSession`, `getUser`, `requireAuth`) optimized for React Server Components.
- ⚡ **Server Actions**: Full support for authenticated Server Actions with simple credentials verification and session lookup.
- 🛡️ **Type Safe**: End-to-end TypeScript support out of the box.

---

## Installation

```bash
npm install @bolkauth/nextjs @bolkauth/core
# or
pnpm add @bolkauth/nextjs @bolkauth/core
# or
yarn add @bolkauth/nextjs @bolkauth/core
```

---

## Quick Setup

### 1. Configure BolkAuth Instance

Create your auth instance in `lib/auth.ts`:

```typescript
// lib/auth.ts
import { createBolkAuth } from "@bolkauth/core";
import { createDrizzleAdapter } from "@bolkauth/adapter-drizzle";
import { db } from "@/db";

export const auth = createBolkAuth({
  adapter: createDrizzleAdapter(db),
  secret: process.env.BOLKAUTH_SECRET!,
  session: {
    cookieName: "bolkauth.session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
```

### 2. Set Up App Router API Catch-All Route

Create `app/api/auth/[...bolkauth]/route.ts`:

```typescript
// app/api/auth/[...bolkauth]/route.ts
import { bolkAuthHandler } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

export const { GET, POST, PATCH, DELETE } = bolkAuthHandler(auth);
```

---

## Edge Middleware

Protect private routes and automatically handle redirects for unauthenticated users or incomplete onboarding flows.

```typescript
// middleware.ts
import { bolkAuthMiddleware } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

export default bolkAuthMiddleware(auth, {
  signInUrl: "/sign-in",
  onboardingUrl: "/onboarding",
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/auth"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### Middleware Options

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `signInUrl` | `string` | `"/sign-in"` | URL path to redirect unauthenticated requests. |
| `onboardingUrl` | `string` | `"/onboarding"` | URL path to redirect users who haven't completed onboarding. |
| `publicRoutes` | `string[]` | `[]` | Array of path prefixes that bypass authentication checks. |

---

## Server Components Integration

`@bolkauth/nextjs` provides flexible helpers for reading session data and enforcing auth in React Server Components (`RSC`).

### Using `createServerHelpers`

```typescript
// app/dashboard/page.tsx
import { createServerHelpers } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";

const { getSession, getUser, requireAuth } = createServerHelpers(auth);

export default async function DashboardPage() {
  // Requires authentication; automatically redirects to /sign-in if unauthorized
  const user = await requireAuth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Welcome back, {user.name || user.email}!</h1>
      <p className="text-gray-600">User ID: {user.id}</p>
    </main>
  );
}
```

### Direct Helper Imports

```typescript
import { getSession, getUser, requireAuth } from "@bolkauth/nextjs";

export default async function ProfilePage() {
  const user = await requireAuth();
  return <div>Profile for {user.email}</div>;
}
```

---

## Server Actions Integration

Authenticate user requests seamlessly inside Next.js Server Actions:

```typescript
// app/actions/profile.ts
"use server";

import { createServerHelpers } from "@bolkauth/nextjs";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const { requireAuth } = createServerHelpers(auth);

export async function updateDisplayName(formData: FormData) {
  const user = await requireAuth();
  const newName = formData.get("name") as string;

  if (!newName) {
    throw new Error("Name is required");
  }

  await auth.config.adapter.updateUser(user.id, { name: newName });
  revalidatePath("/dashboard");
}
```

---

## API Reference

### Exported Modules

- `bolkAuthHandler(authInstance)`: Returns route handler functions (`GET`, `POST`, `PATCH`, `DELETE`). Alias: `authFlowHandler`.
- `bolkAuthMiddleware(authInstance, options)`: Creates an Edge Middleware handler. Alias: `authFlowMiddleware`.
- `createServerHelpers(authInstance)`: Binds a BolkAuth instance to Next.js cookie store and returns `{ getSession, getUser, requireAuth }`.
- `getSession()`: Returns the active session object parsed from Next.js cookie store.
- `getUser()`: Resolves the current user.
- `requireAuth(signInUrl?: string)`: Protects a route/server action, redirecting if unauthenticated.

---

## License

[MIT](./LICENSE) © BolkAuth
