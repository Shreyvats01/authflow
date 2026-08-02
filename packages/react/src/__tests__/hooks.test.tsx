import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BolkAuthProvider } from '../provider';
import { useSignIn } from '../hooks/use-sign-in';
import { useSignUp } from '../hooks/use-sign-up';
import { useUser } from '../hooks/use-user';
import { useOAuth } from '../hooks/use-oauth';
import { useOnboarding } from '../hooks/use-onboarding';
import { useOTP } from '../hooks/use-otp';
import { useMagicLink } from '../hooks/use-magic-link';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BolkAuthProvider>{children}</BolkAuthProvider>
);

describe('React Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.endsWith('/session')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({}),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSignIn', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useSignIn(), { wrapper });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.fieldErrors).toEqual({});
      expect(typeof result.current.signIn).toBe('function');
    });

    it('handles successful sign in state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/email')) {
          return {
            ok: true,
            json: async () => ({ success: true, user: { id: 'user_1' } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignIn(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signIn({ email: 'test@example.com', password: 'password' });
      });

      expect(response).toEqual({
        isLoading: false,
        error: null,
        data: { success: true, user: { id: 'user_1' } },
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles sign in API error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/email')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: 'invalid_credentials',
                message: 'Invalid email or password',
                fieldErrors: { password: 'Password is invalid' },
              },
            }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignIn(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signIn({ email: 'test@example.com', password: 'wrong' });
      });

      expect(response).toEqual({
        isLoading: false,
        error: { code: 'invalid_credentials', message: 'Invalid email or password' },
        fieldErrors: { password: 'Password is invalid' },
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual({
        code: 'invalid_credentials',
        message: 'Invalid email or password',
      });
      expect(result.current.fieldErrors).toEqual({ password: 'Password is invalid' });
    });

    it('handles sign in network error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/email')) {
          throw new Error('Network error');
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignIn(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signIn({ email: 'test@example.com', password: 'pass' });
      });

      expect(response).toEqual({
        isLoading: false,
        error: { code: 'network_error', message: 'Network error occurred' },
      });
      expect(result.current.error).toEqual({
        code: 'network_error',
        message: 'Network error occurred',
      });
    });

    it('maintains action callback stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useSignIn(), { wrapper });
      const initialSignIn = result.current.signIn;

      rerender();

      expect(result.current.signIn).toBe(initialSignIn);
    });
  });

  describe('useSignUp', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useSignUp(), { wrapper });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.fieldErrors).toEqual({});
    });

    it('handles successful sign up state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-up')) {
          return {
            ok: true,
            json: async () => ({ user: { id: 'user_new' } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignUp(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signUp({ email: 'new@example.com', password: 'password' });
      });

      expect(response).toEqual({
        isLoading: false,
        error: null,
        data: { user: { id: 'user_new' } },
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles sign up API error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-up')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: 'email_taken',
                message: 'Email is already registered',
                fieldErrors: { email: 'Already taken' },
              },
            }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignUp(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signUp({ email: 'existing@example.com', password: 'pass' });
      });

      expect(response.error).toEqual({ code: 'email_taken', message: 'Email is already registered' });
      expect(result.current.error).toEqual({ code: 'email_taken', message: 'Email is already registered' });
      expect(result.current.fieldErrors).toEqual({ email: 'Already taken' });
    });

    it('handles sign up network error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-up')) {
          throw new Error('Network error');
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useSignUp(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.signUp({ email: 'test@example.com', password: 'pass' });
      });

      expect(response.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
      expect(result.current.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
    });

    it('maintains action callback stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useSignUp(), { wrapper });
      const initialSignUp = result.current.signUp;

      rerender();

      expect(result.current.signUp).toBe(initialSignUp);
    });
  });

  describe('useUser', () => {
    it('returns user state and reload from context', async () => {
      const mockUser = { id: 'user_789', email: 'user@example.com' };
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/session')) {
          return {
            ok: true,
            json: async () => ({ user: mockUser, session: { id: 'sess_789' } }),
          } as Response;
        }
        return { ok: false, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(typeof result.current.reload).toBe('function');
    });

    it('maintains reload callback stability', async () => {
      const { result, rerender } = renderHook(() => useUser(), { wrapper });
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      const initialReload = result.current.reload;
      rerender();

      expect(result.current.reload).toBe(initialReload);
    });
  });

  describe('useOAuth', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('redirects to OAuth provider URL', () => {
      const { result } = renderHook(() => useOAuth(), { wrapper });

      act(() => {
        result.current.signInWithOAuth('github');
      });

      expect(window.location.href).toBe('/api/auth/oauth/github');
    });

    it('maintains action callback stability', () => {
      const { result, rerender } = renderHook(() => useOAuth(), { wrapper });
      const initialSignInWithOAuth = result.current.signInWithOAuth;

      rerender();

      expect(result.current.signInWithOAuth).toBe(initialSignInWithOAuth);
    });
  });

  describe('useOnboarding', () => {
    it('initializes with step state', () => {
      const { result } = renderHook(() => useOnboarding(3), { wrapper });
      expect(result.current.currentStep).toBe(0);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.onboardingData).toEqual({});
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('navigates through steps correctly with bounds', () => {
      const { result } = renderHook(() => useOnboarding(3), { wrapper });

      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(2);

      // Should capped at max step (initialSteps - 1 = 2)
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.goToPrevStep();
      });
      expect(result.current.currentStep).toBe(1);

      act(() => {
        result.current.goToPrevStep();
      });
      expect(result.current.currentStep).toBe(0);

      // Should capped at min step 0
      act(() => {
        result.current.goToPrevStep();
      });
      expect(result.current.currentStep).toBe(0);
    });

    it('handles saveStep state transitions', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/onboarding/step')) {
          return {
            ok: true,
            json: async () => ({ success: true }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOnboarding(3), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.saveStep(0, { role: 'developer' });
      });

      expect(response).toEqual({ isLoading: false, error: null, data: { success: true } });
      expect(result.current.completedSteps).toEqual([0]);
      expect(result.current.onboardingData).toEqual({ role: 'developer' });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles saveStep API error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/onboarding/step')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: { code: 'invalid_data', message: 'Role is invalid' } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOnboarding(3), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.saveStep(0, { role: '' });
      });

      expect(response.error).toEqual({ code: 'invalid_data', message: 'Role is invalid' });
      expect(result.current.error).toEqual({ code: 'invalid_data', message: 'Role is invalid' });
    });

    it('handles completeOnboarding state transitions', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/onboarding/complete')) {
          return {
            ok: true,
            json: async () => ({ completed: true }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOnboarding(3), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.completeOnboarding();
      });

      expect(response).toEqual({ isLoading: false, error: null, data: { completed: true } });
      expect(result.current.isCompleted).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles completeOnboarding network error', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/onboarding/complete')) {
          throw new Error('Network failure');
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOnboarding(3), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.completeOnboarding();
      });

      expect(response.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
      expect(result.current.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
    });

    it('maintains action callbacks stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useOnboarding(3), { wrapper });
      const initialGoToNext = result.current.goToNextStep;
      const initialGoToPrev = result.current.goToPrevStep;
      const initialSaveStep = result.current.saveStep;
      const initialComplete = result.current.completeOnboarding;

      rerender();

      expect(result.current.goToNextStep).toBe(initialGoToNext);
      expect(result.current.goToPrevStep).toBe(initialGoToPrev);
      expect(result.current.saveStep).toBe(initialSaveStep);
      expect(result.current.completeOnboarding).toBe(initialComplete);
    });
  });

  describe('useOTP', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useOTP(), { wrapper });
      expect(result.current.step).toBe('idle');
      expect(result.current.email).toBeNull();
      expect(result.current.expiresAt).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles sendCode state transition on success', async () => {
      const expiry = '2026-12-31T23:59:59.000Z';
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/otp/send')) {
          return {
            ok: true,
            json: async () => ({ data: { expiresAt: expiry } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOTP(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.sendCode('user@example.com');
      });

      expect(response).toEqual({ isLoading: false, error: null, data: { expiresAt: expiry } });
      expect(result.current.step).toBe('code_sent');
      expect(result.current.email).toBe('user@example.com');
      expect(result.current.expiresAt).toEqual(new Date(expiry));
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles verifyCode state transition on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/otp/send')) {
          return {
            ok: true,
            json: async () => ({ data: {} }),
          } as Response;
        }
        if (typeof url === 'string' && url.endsWith('/otp/verify')) {
          return {
            ok: true,
            json: async () => ({ data: { verified: true } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOTP(), { wrapper });

      await act(async () => {
        await result.current.sendCode('user@example.com');
      });

      let response: any;
      await act(async () => {
        response = await result.current.verifyCode('123456');
      });

      expect(response).toEqual({ isLoading: false, error: null, data: { verified: true } });
      expect(result.current.step).toBe('verified');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns error if verifyCode is called before email is set', async () => {
      const { result } = renderHook(() => useOTP(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.verifyCode('123456');
      });

      expect(response.error).toEqual({
        code: 'unknown_error',
        message: 'No email address set. Call sendCode() first.',
      });
      expect(result.current.error).toEqual({
        code: 'unknown_error',
        message: 'No email address set. Call sendCode() first.',
      });
    });

    it('resets OTP state when reset is called', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/otp/send')) {
          return {
            ok: true,
            json: async () => ({ data: { expiresAt: '2026-12-31T23:59:59.000Z' } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useOTP(), { wrapper });

      await act(async () => {
        await result.current.sendCode('user@example.com');
      });
      expect(result.current.step).toBe('code_sent');

      act(() => {
        result.current.reset();
      });

      expect(result.current.step).toBe('idle');
      expect(result.current.email).toBeNull();
      expect(result.current.expiresAt).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('maintains action callback stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useOTP(), { wrapper });
      const initialSendCode = result.current.sendCode;
      const initialReset = result.current.reset;

      rerender();

      expect(result.current.sendCode).toBe(initialSendCode);
      expect(result.current.reset).toBe(initialReset);
    });
  });

  describe('useMagicLink', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useMagicLink(), { wrapper });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles successful sendMagicLink state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/magic-link')) {
          return {
            ok: true,
            json: async () => ({ sent: true }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useMagicLink(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.sendMagicLink('magic@example.com');
      });

      expect(response).toEqual({ isLoading: false, error: null, data: { sent: true } });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles sendMagicLink API error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/magic-link')) {
          return {
            ok: false,
            status: 400,
            json: async () => ({ error: { code: 'rate_limited', message: 'Too many requests' } }),
          } as Response;
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useMagicLink(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.sendMagicLink('magic@example.com');
      });

      expect(response.error).toEqual({ code: 'rate_limited', message: 'Too many requests' });
      expect(result.current.error).toEqual({ code: 'rate_limited', message: 'Too many requests' });
    });

    it('handles sendMagicLink network error state transition', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (typeof url === 'string' && url.endsWith('/sign-in/magic-link')) {
          throw new Error('Network error');
        }
        return { ok: false, status: 401, json: async () => ({}) } as Response;
      });

      const { result } = renderHook(() => useMagicLink(), { wrapper });

      let response: any;
      await act(async () => {
        response = await result.current.sendMagicLink('magic@example.com');
      });

      expect(response.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
      expect(result.current.error).toEqual({ code: 'network_error', message: 'Network error occurred' });
    });

    it('maintains action callback stability across re-renders', () => {
      const { result, rerender } = renderHook(() => useMagicLink(), { wrapper });
      const initialSendMagicLink = result.current.sendMagicLink;

      rerender();

      expect(result.current.sendMagicLink).toBe(initialSendMagicLink);
    });
  });
});
