import type { BolkAuthAdapter, UserMetadata } from './adapters/types';

export interface SessionConfig {
  maxAge?: number;
  updateAge?: number;
  strategy?: 'jwt' | 'database';
  cookieName?: string;
}

export interface EmailConfig {
  sendVerificationRequest?: (params: { identifier: string; url: string; token: string }) => Promise<void>;
  sendMagicLink?: (params: { identifier: string; url: string; token: string }) => Promise<void>;
  /**
   * Called when an OTP code should be sent to the user's email.
   * Use any email provider (Resend, Nodemailer, etc.)
   */
  sendOTP?: (params: { email: string; code: string; expiresAt: Date }) => Promise<void>;
  verifyRedirectUrl?: string;
}

export interface SocialConfig {
  providers?: string[];
  redirectUrl?: string;
}

export interface OnboardingConfig {
  enabled?: boolean;
  requiredForAccess?: boolean;
  redirectUrl?: string;
  steps?: string[];
}

export interface OTPConfig {
  /**
   * How long (in seconds) the OTP code is valid.
   * Default: 600 (10 minutes) — NIST SP 800-63B recommendation.
   */
  expiresIn?: number;

  /**
   * Number of digits in the generated code.
   * Default: 6
   */
  codeLength?: 4 | 6 | 8;

  /**
   * Max failed verification attempts before the code is invalidated.
   * Prevents brute-force on short codes. Default: 5.
   */
  maxAttempts?: number;

  /**
   * Called when a user exceeds maxAttempts.
   * Use to record events or trigger IP bans.
   */
  onRateLimitExceeded?: (email: string) => Promise<void>;
}

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

export interface BolkAuthResponseError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface BolkAuthResponse<T = any> {
  data?: T;
  error?: BolkAuthResponseError;
}

export type { UserMetadata, BolkAuthAdapter };
