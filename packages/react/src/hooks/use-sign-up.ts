import { useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '../provider';
import { BolkAuthError, HookResponse } from '../types';

export const useSignUp = () => {
  const { config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<BolkAuthError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const signUp = useCallback(async (data: any): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const res = await fetch(`${baseURL}/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const resData = await res.json();
      
      if (res.ok) {
        const channel = new BroadcastChannel('bolkauth_sync');
        channel.postMessage('sync_session');
        channel.close();
        await reload();
        
        setIsLoading(false);
        return { isLoading: false, error: null, data: resData };
      } else {
        setIsLoading(false);
        const hookError: BolkAuthError = {
          code: resData.error?.code || 'unknown_error',
          message: resData.error?.message || 'Failed to sign up',
        };
        setError(hookError);
        setFieldErrors(resData.error?.fieldErrors || {});
        return { isLoading: false, error: hookError, fieldErrors: resData.error?.fieldErrors };
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
  }, [baseURL, reload]);
  
  return useMemo(
    () => ({ signUp, isLoading, error, fieldErrors }),
    [signUp, isLoading, error, fieldErrors]
  );
};
