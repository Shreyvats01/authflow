import { useState } from 'react';
import { useAuthContext } from '../provider';
import { AuthFlowError, HookResponse } from '../types';

export const useSignIn = () => {
  const { config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthFlowError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const signIn = async (credentials: any): Promise<HookResponse> => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      const res = await fetch(`${baseURL}/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const channel = new BroadcastChannel('authflow_sync');
        channel.postMessage('sync_session');
        channel.close();
        await reload();
        
        setIsLoading(false);
        return { isLoading: false, error: null, data };
      } else {
        setIsLoading(false);
        const hookError: AuthFlowError = {
          code: data.error?.code || 'unknown_error',
          message: data.error?.message || 'Failed to sign in',
        };
        setError(hookError);
        setFieldErrors(data.error?.fieldErrors || {});
        return { isLoading: false, error: hookError, fieldErrors: data.error?.fieldErrors };
      }
    } catch (e) {
      setIsLoading(false);
      const hookError: AuthFlowError = {
        code: 'network_error',
        message: 'Network error occurred',
      };
      setError(hookError);
      return { isLoading: false, error: hookError };
    }
  };
  
  return { signIn, isLoading, error, fieldErrors };
};
