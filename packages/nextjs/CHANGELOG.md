# @bolkauth/nextjs

## 0.1.2

### Patch Changes

- fix(npm): add production-grade README.md files and specify monorepo repository directory paths

  Adds tailored, high-quality `README.md` documentation to each package subfolder:

  - `@bolkauth/core`: Features, Web Crypto PBKDF2, JWT sessions, Email OTP, OAuth, FSM, and API references.
  - `@bolkauth/react`: Provider setup, all 6 headless hooks (`useAuth`, `useUser`, `useSignIn`, `useSignUp`, `useOAuth`, `useOTP`, `useOnboarding`), cross-tab sync, and full component recipes.
  - `@bolkauth/nextjs`: App Router handler (`bolkAuthHandler`), Edge Middleware (`bolkAuthMiddleware`), Server Component helpers (`getSession`, `getUser`, `requireAuth`), and Server Actions.
  - `@bolkauth/adapter-drizzle`: Drizzle ORM PostgreSQL schema setup, exported table definitions, migration commands, and connection pooling.
  - `@bolkauth/adapter-prisma`: Prisma schema model definitions, migration commands, and adapter initialization.
  - `@bolkauth/cli`: Setup wizard (`bolkauth init`), schema generators (`bolkauth add`), env/type generators (`bolkauth generate`), and CI/CD workflow guide.

  Also updates `package.json` repository URLs to `git+https://github.com/Shreyvats01/bolkauth.git` and includes the `"directory"` field (`packages/<name>`) so npmjs.com correctly links to package subfolders on GitHub.

- Updated dependencies
  - @bolkauth/core@0.2.1
  - @bolkauth/react@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies
  - @bolkauth/core@0.2.0
  - @bolkauth/react@0.2.0
