import { useState } from 'react';
import { useAuthContext } from '../provider';
import { AuthFlowError, HookResponse } from '../types';

export const useSignUp = () => {
  const { config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthFlowError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const signUp = async (data: any): Promise<HookResponse> => {
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
        const channel = new BroadcastChannel('authflow_sync');
        channel.postMessage('sync_session');
        channel.close();
        await reload();
        
        setIsLoading(false);
        return { isLoading: false, error: null, data: resData };
      } else {
        setIsLoading(false);
        const hookError: AuthFlowError = {
          code: resData.error?.code || 'unknown_error',
          message: resData.error?.message || 'Failed to sign up',
        };
        setError(hookError);
        setFieldErrors(resData.error?.fieldErrors || {});
        return { isLoading: false, error: hookError, fieldErrors: resData.error?.fieldErrors };
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
  
  return { signUp, isLoading, error, fieldErrors };
};
