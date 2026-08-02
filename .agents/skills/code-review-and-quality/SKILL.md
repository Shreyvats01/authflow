---
name: code-review-and-quality
description: Conducts multi-axis code review specifically for BolkAuth monorepo libraries (@bolkauth/core, @bolkauth/react, @bolkauth/nextjs, @bolkauth/adapter-*). Use before merging any PR or code change to ensure public API stability, cryptographic security, Web Crypto edge runtime compatibility, React hook performance, and multi-dialect ORM adapter consistency.
---

# Code Review and Quality for BolkAuth Libraries

## Overview

Conduct multi-dimensional code reviews for **BolkAuth monorepo packages and SDK libraries** (`@bolkauth/core`, `@bolkauth/react`, `@bolkauth/nextjs`, `@bolkauth/adapter-drizzle`, `@bolkauth/adapter-prisma`, `@bolkauth/adapter-mongodb`, `@bolkauth/cli`). 

Every change to BolkAuth libraries must pass a rigorous multi-axis quality gate before merging. Because BolkAuth is a self-hosted, enterprise-grade authentication engine used by downstream developers, code reviews must protect public API stability, enforce cryptographic security, guarantee edge runtime compatibility, and maintain strict multi-database adapter parity.

**The Approval Standard:** Approve a pull request or code change when it definitively improves SDK code health, maintains backward compatibility (or includes a justified changeset for breaking changes), adheres to security specifications, and follows BolkAuth monorepo conventions.

## When to Use

- **Before merging any PR or change** to packages in `packages/*` or tooling in `tooling/*`.
- **After implementing new library features** (e.g. adding new hooks to `@bolkauth/react` or new social providers to `@bolkauth/core`).
- **When modifying multi-dialect database adapters** (`@bolkauth/adapter-drizzle`, `@bolkauth/adapter-prisma`, `@bolkauth/adapter-mongodb`).
- **When refactoring core authentication, session, or onboarding logic**.
- **After bug fixes** (reviewing both the fix and regression test coverage).
- **When updating monorepo dependencies** or project references (`tsconfig.json`, `pnpm-workspace.yaml`).

## The Six-Axis Library Quality Gate

Every BolkAuth library change is evaluated across six core axes:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SIX-AXIS QUALITY GATE                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Public API Contract & SemVer Stability                       │
│ 2. Security & Cryptographic Hardening                           │
│ 3. Edge & Web Crypto Engine Compatibility                       │
│ 4. Monorepo Architecture & Package Layer Boundaries             │
│ 5. Headless React Hooks & Context Performance                   │
│ 6. Multi-Database Adapter Parity                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### Axis 1: Public API Contract & SemVer Stability

As an authentication SDK consumed by external applications, public API changes directly impact library consumers.

- **Package Export Discipline**:
  - Are exported symbols strictly controlled via `package.json` `exports` maps?
  - Are subpath exports clean and explicit (e.g., `@bolkauth/adapter-drizzle/pg`, `@bolkauth/adapter-drizzle/mysql`, `@bolkauth/adapter-drizzle/sqlite`)?
  - Are internal helpers kept private and out of main package index exports?
- **TypeScript Type-Safety**:
  - Is `strictNullChecks` fully respected for authentication states (e.g., `user` and `session` nullable states)?
  - Are public types explicit? Reject `any` or unconstrained `unknown` leaks in public signatures.
  - Do public functions and hooks have explicit return type annotations?
- **Documentation & TSDoc**:
  - Are public exported functions, hooks, and configuration interfaces annotated with descriptive TSDoc comments for IDE IntelliSense?
- **SemVer & Changeset Compliance**:
  - Is any public API signature modified in a breaking way?
  - Does the change include a changeset file (`.changeset/`) via `@changesets/cli` detailing the version bump (patch, minor, major)?

---

### Axis 2: Security & Cryptographic Hardening

Security is a hard constraint on every line of code in `@bolkauth`. See `security-and-hardening` for detailed specs.

- **Cryptographic Standards**:
  - Password Hashing: Uses PBKDF2 with SHA-256 digest, 100,000 iterations, and 16-byte cryptographically secure random salts via Web Crypto API.
  - Session Tokens: Uses 32-byte cryptographically secure random tokens, hashed via SHA-256 before database storage.
  - Constant-Time String Comparison: Secret string comparisons MUST use Web Crypto constant-time routines to prevent timing side-channel attacks.
- **Session & Cookie Security**:
  - Cookies must be configured with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production environments.
- **Input Validation & Injection Prevention**:
  - Are all incoming user payloads (credentials, email addresses, redirect URIs) validated using schema validators (e.g., Zod)?
  - Are database queries in adapters parameterized to prevent SQL and NoSQL injection?
- **Zero Credential Exposure**:
  - Ensure raw passwords, session secrets, salts, and tokens are never written to logs, console output, or error response payloads.

---

### Axis 3: Edge & Web Crypto Engine Compatibility

BolkAuth packages must run seamlessly across Edge runtimes (Next.js Edge Middleware, Cloudflare Workers, Vercel Edge) and modern browsers.

- **Native Web Crypto API**:
  - `@bolkauth/core` MUST use `window.crypto.subtle` or global `crypto.subtle` primitives natively.
- **Zero Node Native Module Leaks**:
  - Verify that edge-targeted packages (`@bolkauth/core`, `@bolkauth/react`, `@bolkauth/nextjs`) DO NOT import Node-only native modules (`crypto`, `fs`, `path`, `os`, `buffer`).
  - Do not introduce dependencies that break Edge bundlers.

---

### Axis 4: Monorepo Architecture & Package Layer Boundaries

Maintain clean separation of concerns across the workspace packages.

- **Strict Dependency Hierarchy**:
  ```
  @bolkauth/core          <-- Zero framework dependencies (pure TS + Web Crypto)
        ▲
        │
   ┌────┴───────────────────────────┬──────────────────────────────┐
   │                                │                              │
  @bolkauth/react           @bolkauth/nextjs             @bolkauth/adapter-*
  (React peer deps only)    (Next.js App Router / Edge)  (Drizzle, Prisma, Mongo)
  ```
- **Architectural Rules**:
  - Is feature-specific framework logic leaking into `@bolkauth/core`? (Reject React/Next.js imports in core).
  - Do adapters (`@bolkauth/adapter-drizzle`, `@bolkauth/adapter-prisma`, `@bolkauth/adapter-mongodb`) depend only on `@bolkauth/core` and their ORM drivers?
  - Are shared types defined canonically in `@bolkauth/core` rather than duplicated across packages?

---

### Axis 5: Headless React Hooks & Context Performance (`@bolkauth/react`)

`@bolkauth/react` provides headless, unstyled authentication hooks and context providers.

- **Unstyled Contract**:
  - Hooks (`useSignIn`, `useSignUp`, `useSession`, `useOnboarding`, `useOtp`, `useMagicLink`, `useOAuth`, `useUser`) MUST remain completely unstyled, returning raw state (`isLoading`, `error`, `data`) and actions without rendering DOM elements.
- **Context Memoization & Cascade Re-render Prevention**:
  - Are `<BolkAuthProvider>` context values properly memoized with `useMemo` / `useCallback` to prevent unnecessary global re-render cascades across consumer component trees?
- **Provider Boundary Safety**:
  - Do hooks throw clear, actionable errors when invoked outside a `<BolkAuthProvider>` tree?

---

### Axis 6: Multi-Database Adapter Parity

BolkAuth guarantees multi-database support across PostgreSQL, MySQL, SQLite, CockroachDB, and MongoDB.

- **Schema Model Parity**:
  - Are `User`, `Session`, `Account`, and `OnboardingState` models identical in structure and constraints across Drizzle schemas, Prisma schemas, and MongoDB models?
- **Adapter Interface Integrity**:
  - Do all database adapters implement the canonical adapter interface exported by `@bolkauth/core` without omitting methods?
- **Multi-Dialect Export Consistency**:
  - Does `@bolkauth/adapter-drizzle` expose matching `/pg`, `/mysql`, and `/sqlite` entry points?
  - Does `@bolkauth/adapter-prisma` support all declared dialects seamlessly?

---

## Structural Remedies for Library Code

When flagging structural problems in code review, propose clear architectural remedies:

| Code Smell | Recommended Remedy |
|------------|-------------------|
| Node `crypto` import in core package | Refactor to use standard `crypto.subtle` (Web Crypto API) |
| Feature logic duplicated in multiple adapters | Extract canonical mapper/helper into `@bolkauth/core` |
| Context provider value re-created on every render | Wrap provider value object in `useMemo` and callbacks in `useCallback` |
| Loose `any` return type on custom hook | Define explicit TypeScript interface in `@bolkauth/react/src/types.ts` |
| Monorepo package importing another package's internal path | Update `package.json` `exports` and import from official entry point |
| Multi-step FSM logic tangled in UI components | Move state transitions to `@bolkauth/core` onboarding state machine |

---

## Changeset & Release Discipline

Every PR modifying public packages MUST include versioning metadata:

1. **Check for Changeset**: Verify if `.changeset/*.md` exists for public package changes.
2. **SemVer Validation**:
   - `patch`: Internal bug fixes, documentation, performance cleanups.
   - `minor`: New backwards-compatible features, new hooks, new adapter dialects.
   - `major`: Breaking public API changes (requires explicit team RFC).
3. **Lockfile Integrity**: Ensure `pnpm-lock.yaml` is committed and updated automatically via `pnpm install`, never manually edited.

---

## Review Process & Severity Labels

Label every review comment with a clear severity tag:

| Severity | Meaning | Author Action |
|----------|---------|---------------|
| **Critical:** | Security flaw, crypto vulnerability, breaking API change without changeset, edge runtime crash | Must fix before merge |
| *(no prefix)* | Required change for code health, correctness, or type safety | Must address before merge |
| **Optional:** / **Consider:** | Structural or performance optimization suggestion | Recommended, author discretion |
| **Nit:** | Formatting, comment typo, non-functional preference | Author may ignore |
| **FYI:** | Informational note for context | No action needed |

---

## BolkAuth Library Review Checklist

```markdown
## PR Review Checklist: [PR Title]

### 1. Public API & Types
- [ ] Public API surface is minimal and intentional
- [ ] No `any` or loose `unknown` types in exported interfaces
- [ ] Subpath exports in `package.json` are correct
- [ ] Changeset file included (if public package modified)

### 2. Security & Crypto
- [ ] Web Crypto API used for all hashing and digests
- [ ] Constant-time secret string comparisons enforced
- [ ] HTTP-Only cookie security flags configured
- [ ] Database queries parameterized (no raw injection paths)
- [ ] Zero sensitive credentials logged or exposed

### 3. Edge Runtime Compatibility
- [ ] Zero Node native module dependencies (`crypto`, `fs`, `path`) in core/react/nextjs
- [ ] Edge middleware compatibility verified

### 4. Monorepo Architecture
- [ ] Dependency flow respects hierarchy (`core` -> `react`/`nextjs`/`adapters`)
- [ ] Canonical helpers reused from `@bolkauth/core`

### 5. Headless React Hooks
- [ ] Hooks remain unstyled and return raw state/actions
- [ ] `<BolkAuthProvider>` value memoized to prevent re-render cascades
- [ ] Out-of-provider error guards in place

### 6. Adapter Parity & Testing
- [ ] Schema models consistent across Drizzle, Prisma, and MongoDB
- [ ] All unit tests pass (`pnpm test`)
- [ ] Typecheck passes across monorepo (`pnpm typecheck`)
- [ ] Build passes (`pnpm build`)
```

## Verification

Before approving any pull request or marking code review complete:

- [ ] Run `pnpm typecheck` across all monorepo workspace packages.
- [ ] Run `pnpm test` across all package unit test suites.
- [ ] Run `pnpm build` to verify Turbo build pipeline.
- [ ] Confirm all `Critical` and `Required` review findings are resolved.
