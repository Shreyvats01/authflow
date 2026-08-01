# @bolkauth/core

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
