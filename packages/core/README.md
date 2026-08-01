# @bolkauth/core

[![npm version](https://img.shields.io/npm/v/@bolkauth/core.svg?style=flat-square)](https://www.npmjs.com/package/@bolkauth/core)
[![license](https://img.shields.io/npm/l/@bolkauth/core.svg?style=flat-square)](LICENSE)

**@bolkauth/core** is a lightweight, framework-agnostic, zero-dependency authentication engine built on the standard Web Crypto API (`crypto.subtle`). Designed for Node.js, Next.js, Cloudflare Workers, Bun, Deno, and Vercel Edge Runtime, `@bolkauth/core` provides complete authentication flows out of the box with zero external cryptographic dependencies.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [Core Architecture & Security](#core-architecture--security)
  - [Web Crypto PBKDF2 Password Hashing](#web-crypto-pbkdf2-password-hashing)
  - [JWT & Session Management](#jwt--session-management)
  - [Email OTP & Magic Links](#email-otp--magic-links)
  - [OAuth 2.0 Authentication](#oauth-20-authentication)
  - [Onboarding Finite State Machine (FSM)](#onboarding-finite-state-machine-fsm)
- [API Reference](#api-reference)
  - [`createBolkAuth(config)`](#createbolkauthconfig)
  - [`BolkAuthInstance`](#bolkauthinstance)
  - [Configuration Options (`BolkAuthConfig`)](#configuration-options-bolkauthconfig)
  - [Database Adapter Interface (`BolkAuthAdapter`)](#database-adapter-interface-bolkauthadapter)
  - [Cryptographic Utilities](#cryptographic-utilities)
- [Supported HTTP Endpoints](#supported-http-endpoints)
- [License](#license)

---

## Features

- 🔐 **Zero External Crypto Dependencies**: Native Web Crypto API (`crypto.subtle`) for PBKDF2-SHA256 password hashing and HMAC-SHA256 JWT signing.
- 🔑 **Cryptographically Secure Email OTP**: `crypto.getRandomValues()` generation, SHA-256 hashed storage, oracle attack prevention, and strict attempt limits.
- 🎟️ **Session Management**: Dual support for JWTs and Database sessions with `HttpOnly`, `SameSite=Lax` cookies.
- ⚡ **OAuth 2.0 Integration**: Out-of-the-box support for GitHub and Google with PKCE-like state parameter CSRF validation.
- 📋 **Onboarding FSM**: Step-by-step onboarding progress tracking & completion state machine stored via user metadata.
- 🌐 **Edge & Multi-Runtime Ready**: Fully compatible with Node.js 18+, Next.js (App Router & Pages Router), Cloudflare Workers, Vercel Edge, Deno, and Bun.
- 🔌 **Pluggable Database Adapters**: Clean TypeScript adapter pattern for Prisma, Drizzle, Kysely, MongoDB, PostgreSQL, or custom ORMs.

---

## Installation

```bash
# npm
npm install @bolkauth/core

# pnpm
pnpm add @bolkauth/core

# yarn
yarn add @bolkauth/core
```

---

## Quickstart

Initialize BolkAuth with your database adapter and secret:

```typescript
import { createBolkAuth, type BolkAuthAdapter } from '@bolkauth/core';

// Define or import your database adapter
const adapter: BolkAuthAdapter = {
  async createUser(user) { /* ... database query ... */ },
  async findUserByEmail(email) { /* ... database query ... */ },
  async findUserById(id) { /* ... database query ... */ },
  async updateUser(id, user) { /* ... database query ... */ },
  async deleteUser(id) { /* ... database query ... */ },
  async createSession(session) { /* ... database query ... */ },
  async findSessionByToken(token) { /* ... database query ... */ },
  async updateSession(id, session) { /* ... database query ... */ },
  async deleteSession(id) { /* ... database query ... */ },
  async deleteUserSessions(userId) { /* ... database query ... */ },
  async createAccount(account) { /* ... database query ... */ },
  async findAccountByProvider(provider, providerAccountId) { /* ... database query ... */ },
  async createVerificationToken(token) { /* ... database query ... */ },
  async findVerificationToken(identifier, token) { /* ... database query ... */ },
  async deleteVerificationToken(identifier, token) { /* ... database query ... */ },
  async getUserMetadata(userId, key) { /* ... database query ... */ },
  async updateUserMetadata(userId, key, value) { /* ... database query ... */ },
};

export const auth = createBolkAuth({
  secret: process.env.BOLKAUTH_SECRET || 'super-secret-key-32-chars-long!',
  adapter,
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    cookieName: 'bolkauth.session',
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});
```

### Next.js App Router Catch-all API Route (`app/api/auth/[...bolkauth]/route.ts`)

```typescript
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  return auth.handleRequest(request);
}

export async function POST(request: Request) {
  return auth.handleRequest(request);
}
```

---

## Core Architecture & Security

### Web Crypto PBKDF2 Password Hashing

`@bolkauth/core` uses standard Web Crypto `SubtleCrypto` primitives for password hashing, removing the need for native C++ bindings like `bcrypt`.

- **Salt**: 16 bytes of cryptographically random data generated via `crypto.getRandomValues()`.
- **Key Derivation**: `PBKDF2` with 100,000 iterations and `SHA-256`.
- **Output Format**: `${saltHex}:${hashHex}`.

```typescript
import { hashPassword, verifyPassword } from '@bolkauth/core';

// Hash a user's password
const storedHash = await hashPassword('mySecurePassword123');
// -> "a1f8c...:9e2b4..."

// Verify credentials during sign-in
const isValid = await verifyPassword('mySecurePassword123', storedHash);
// -> true
```

### JWT & Session Management

Tokens are signed using HMAC-SHA256 via Web Crypto (`subtle.importKey` + `subtle.sign`).

- **Cookie Security**: Set with `HttpOnly; SameSite=Lax; Path=/; Max-Age=<seconds>`.
- **Session Lookup**: Sessions are indexed and validated in both database adapters and signed JWT payloads.

```typescript
import { signJwt, verifyJwt, hashToken } from '@bolkauth/core';

// Sign a session payload
const jwt = await signJwt({ sessionId: 'sess_123', userId: 'user_456' }, secret, 86400);

// Verify and decode JWT
const payload = await verifyJwt(jwt, secret);
```

### Email OTP & Magic Links

Email OTP uses high-entropy numeric generation combined with secure one-time database token storage.

1. **Generation**: `crypto.getRandomValues()` produces a uniform 4, 6, or 8-digit numeric code.
2. **Storage**: Hashed with SHA-256 prior to database storage (`otp:<email>` namespace).
3. **Verification**: Input is sanitized, hashed, and checked in constant time (`timingSafeEqual`).
4. **Oracle & Brute-Force Protection**: Uses unified timing-safe responses to prevent email enumeration.

```typescript
import { generateOTPCode, hashOTPCode, timingSafeEqual } from '@bolkauth/core';

const code = generateOTPCode(6); // e.g. "849201"
const hashed = await hashOTPCode(code);

// Constant-time check
const isMatch = timingSafeEqual(hashed, storedHashedCode);
```

### OAuth 2.0 Authentication

Built-in support for provider authorization URLs, state cookies for CSRF prevention, code-for-token exchange, and user profile retrieval.

```typescript
import { buildAuthorizationUrl, exchangeCodeForToken, fetchUserInfo } from '@bolkauth/core';

// Generates authorization URL for GitHub/Google
const url = buildAuthorizationUrl(
  'github',
  { clientId: 'XYZ', scopes: ['read:user', 'user:email'] },
  'https://example.com/api/auth/oauth/github/callback',
  'state_nonce_123'
);
```

### Onboarding Finite State Machine (FSM)

Track onboarding progress across steps using user metadata key-value storage:

- Step data saved via `/onboarding/step` endpoint (`key: 'onboarding_step'`).
- Completion toggled via `/onboarding/complete` (`key: 'onboarding_complete'`).

---

## API Reference

### `createBolkAuth(config)`

Factory function to instantiate the authentication engine.

```typescript
function createBolkAuth(config: BolkAuthConfig): BolkAuthInstance
```

### `BolkAuthInstance`

The instantiated engine handling incoming HTTP requests and auth state.

#### Methods

- `handleRequest(req: Request): Promise<Response>`  
  Main handler mapping URL paths to internal handlers (sign-up, sign-in, OTP, session, metadata, OAuth).

---

### Configuration Options (`BolkAuthConfig`)

```typescript
export interface BolkAuthConfig {
  adapter: BolkAuthAdapter;
  secret: string;
  session?: SessionConfig;
  email?: EmailConfig;
  emailAndPassword?: {
    enabled?: boolean;
    requireEmailVerification?: boolean;
    minPasswordLength?: number;
  };
  socialProviders?: Record<string, { clientId: string; clientSecret: string; scopes?: string[] }>;
  social?: SocialConfig;
  onboarding?: OnboardingConfig;
  otp?: OTPConfig;
}
```

#### `SessionConfig`
- `maxAge?: number` (Default: 30 days in seconds)
- `updateAge?: number`
- `strategy?: 'jwt' | 'database'`
- `cookieName?: string` (Default: `'bolkauth.session'`)

#### `EmailConfig`
- `sendVerificationRequest?: (params: { identifier: string; url: string; token: string }) => Promise<void>`
- `sendMagicLink?: (params: { identifier: string; url: string; token: string }) => Promise<void>`
- `sendOTP?: (params: { email: string; code: string; expiresAt: Date }) => Promise<void>`
- `verifyRedirectUrl?: string`

#### `OTPConfig`
- `expiresIn?: number` (Default: `600` seconds / 10 minutes)
- `codeLength?: 4 | 6 | 8` (Default: `6`)
- `maxAttempts?: number` (Default: `5`)
- `onRateLimitExceeded?: (email: string) => Promise<void>`

---

### Database Adapter Interface (`BolkAuthAdapter`)

Implement this interface to plug in any database:

```typescript
export interface BolkAuthAdapter {
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>;
  findSessionByToken(token: string): Promise<Session | null>;
  updateSession(id: string, session: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
  findAccountByProvider(provider: string, providerAccountId: string): Promise<Account | null>;

  createVerificationToken(token: Omit<VerificationToken, 'createdAt'>): Promise<VerificationToken>;
  findVerificationToken(identifier: string, token: string): Promise<VerificationToken | null>;
  deleteVerificationToken(identifier: string, token: string): Promise<void>;

  getUserMetadata(userId: string, key: string): Promise<UserMetadata | null>;
  updateUserMetadata(userId: string, key: string, value: string): Promise<UserMetadata>;
}
```

---

### Cryptographic Utilities

```typescript
// Password hashing
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, storedHash: string): Promise<boolean>;

// Session & JWT
export function hashToken(token: string): Promise<string>;
export function signJwt(payload: any, secret: string, expiresIn?: number): Promise<string>;
export function verifyJwt(token: string, secret: string): Promise<any>;

// Email OTP
export function generateOTPCode(length?: 4 | 6 | 8): string;
export function hashOTPCode(code: string): Promise<string>;
export function timingSafeEqual(a: string, b: string): boolean;
```

---

## Supported HTTP Endpoints

When `handleRequest(req)` is invoked, it routes the following endpoints based on `req.url`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/sign-up` | Registers a new user with email & password. Returns user & session cookie. |
| `POST` | `/sign-in/email` | Authenticates existing user with email & password. Sets session cookie. |
| `POST` | `/sign-in/magic-link` | Sends a passwordless login link to user's email. |
| `GET` | `/verify` | Validates magic link token and redirects user. |
| `POST` | `/otp/send` | Generates & sends email OTP using `config.email.sendOTP`. |
| `POST` | `/otp/verify` | Validates email OTP, creates/logs in user, sets session cookie. |
| `POST` | `/sign-out` | Invalidates active session and clears session cookie. |
| `GET` | `/session` | Retrieves current session state and authenticated user payload. |
| `POST` | `/user/metadata` | Updates key-value metadata for the authenticated user. |
| `GET` | `/user/metadata` | Retrieves metadata by `key` search parameter. |
| `POST` | `/onboarding/step` | Saves onboarding step progress (`onboarding_step`). |
| `POST` | `/onboarding/complete` | Marks onboarding as complete (`onboarding_complete`). |
| `GET` | `/oauth/:provider` | Initiates OAuth 2.0 authorization redirect. |
| `GET` | `/oauth/:provider/callback` | Handles OAuth callback, exchanges authorization code, signs in user. |

---

## License

[MIT](LICENSE) © BolkAuth
