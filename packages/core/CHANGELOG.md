# @bolkauth/core

## 0.2.1

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

## 0.2.0

### Minor Changes

- feat: add email OTP authentication

  Adds one-time password (OTP) authentication via email codes:

  - `POST /otp/send` — generates a 6-digit cryptographically random code,
    hashes it with SHA-256, stores it in the VerificationToken table,
    and calls `config.email.sendOTP()` with the plaintext code.
  - `POST /otp/verify` — verifies the code, auto-creates or verifies the
    user account, and issues a session cookie.
  - `generateOTPCode()`, `hashOTPCode()`, `timingSafeEqual()` exported
    from `@bolkauth/core` for use in custom implementations.
  - `useOTP()` hook in `@bolkauth/react` with two-phase UX state machine
    (`idle` → `code_sent` → `verified`).
  - `OTPConfig` added to `BolkAuthConfig` with `expiresIn`, `codeLength`,
    `maxAttempts`, and `onRateLimitExceeded` options.
  - Added comprehensive documentation at `/otp` covering setup, API endpoints,
    Resend/Nodemailer recipes, and a 6-digit React component.

  No adapter changes required — OTP tokens reuse the existing
  VerificationToken table.
