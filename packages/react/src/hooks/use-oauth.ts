import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../provider';

export const useOAuth = () => {
  const { config } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';

  const signInWithOAuth = useCallback(
    (provider: 'github' | 'google' | string) => {
      window.location.href = `${baseURL}/oauth/${provider}`;
    },
    [baseURL]
  );

  return useMemo(() => ({ signInWithOAuth }), [signInWithOAuth]);
};
