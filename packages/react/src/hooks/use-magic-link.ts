import { useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '../provider';
import { BolkAuthError, HookResponse } from '../types';

export const useMagicLink = () => {
  const { config } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<BolkAuthError | null>(null);

  const sendMagicLink = useCallback(async (email: string): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${baseURL}/sign-in/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsLoading(false);
        return { isLoading: false, error: null, data };
      } else {
        setIsLoading(false);
        const hookError: BolkAuthError = {
          code: data.error?.code || 'unknown_error',
          message: data.error?.message || 'Failed to send magic link',
        };
        setError(hookError);
        return { isLoading: false, error: hookError };
      }
    } catch (e) {
      setIsLoading(false);
      const hookError: BolkAuthError = {
        code: 'network_error',
        message: 'Network error occurred',
      };
      setError(hookError);
      return { isLoading: false, error: hookError };
    }
  }, [baseURL]);
  
  return useMemo(
    () => ({ sendMagicLink, isLoading, error }),
    [sendMagicLink, isLoading, error]
  );
};
