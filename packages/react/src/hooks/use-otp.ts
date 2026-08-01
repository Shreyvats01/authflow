import { useState } from 'react';
import { useAuthContext } from '../provider';
import { BolkAuthError, HookResponse } from '../types';

export type OTPStep = 'idle' | 'code_sent' | 'verified';

export interface UseOTPReturn {
  /** Current step in the OTP flow */
  step: OTPStep;

  /** Email address that the OTP was sent to */
  email: string | null;

  /** When the pending OTP expires */
  expiresAt: Date | null;

  /**
   * Send a 6-digit OTP to the given email address.
   * On success, transitions step to 'code_sent'.
   */
  sendCode: (email: string) => Promise<HookResponse>;

  /**
   * Verify the code the user entered.
   * On success, transitions step to 'verified' and creates a session.
   */
  verifyCode: (code: string) => Promise<HookResponse>;

  /** Reset back to 'idle' (e.g., user wants to change their email) */
  reset: () => void;

  isLoading: boolean;
  error: BolkAuthError | null;
}

export const useOTP = (): UseOTPReturn => {
  const { config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';

  const [step, setStep] = useState<OTPStep>('idle');
  const [email, setEmail] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<BolkAuthError | null>(null);

  const sendCode = async (emailAddress: string): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseURL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmail(emailAddress);
        setExpiresAt(data.data?.expiresAt ? new Date(data.data.expiresAt) : null);
        setStep('code_sent');
        setIsLoading(false);
        return { isLoading: false, error: null, data: data.data };
      } else {
        const hookError: BolkAuthError = {
          code: data.error?.code ?? 'unknown_error',
          message: data.error?.message ?? 'Failed to send OTP',
        };
        setError(hookError);
        setIsLoading(false);
        return { isLoading: false, error: hookError };
      }
    } catch {
      const hookError: BolkAuthError = { code: 'network_error', message: 'Network error occurred' };
      setError(hookError);
      setIsLoading(false);
      return { isLoading: false, error: hookError };
    }
  };

  const verifyCode = async (code: string): Promise<HookResponse> => {
    if (!email) {
      const hookError: BolkAuthError = { code: 'unknown_error', message: 'No email address set. Call sendCode() first.' };
      setError(hookError);
      return { isLoading: false, error: hookError };
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseURL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep('verified');
        // Sync auth state across tabs
        const channel = new BroadcastChannel('bolkauth_sync');
        channel.postMessage('sync_session');
        channel.close();
        await reload();
        setIsLoading(false);
        return { isLoading: false, error: null, data: data.data };
      } else {
        const hookError: BolkAuthError = {
          code: data.error?.code ?? 'unknown_error',
          message: data.error?.message ?? 'Invalid or expired code',
        };
        setError(hookError);
        setIsLoading(false);
        return { isLoading: false, error: hookError };
      }
    } catch {
      const hookError: BolkAuthError = { code: 'network_error', message: 'Network error occurred' };
      setError(hookError);
      setIsLoading(false);
      return { isLoading: false, error: hookError };
    }
  };

  const reset = () => {
    setStep('idle');
    setEmail(null);
    setExpiresAt(null);
    setError(null);
    setIsLoading(false);
  };

  return { step, email, expiresAt, sendCode, verifyCode, reset, isLoading, error };
};
