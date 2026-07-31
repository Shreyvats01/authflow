import { useAuthContext } from '../provider';

export const useOAuth = () => {
  const { config } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';

  const signInWithOAuth = (provider: 'github' | 'google' | string) => {
    window.location.href = `${baseURL}/oauth/${provider}`;
  };

  return { signInWithOAuth };
};
