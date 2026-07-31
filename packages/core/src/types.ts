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
