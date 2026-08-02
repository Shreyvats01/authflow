import { useMemo } from 'react';
import { useAuthContext } from '../provider';

export const useUser = () => {
  const { isLoaded, isSignedIn, user, reload } = useAuthContext();
  
  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      user,
      reload,
    }),
    [isLoaded, isSignedIn, user, reload]
  );
};
