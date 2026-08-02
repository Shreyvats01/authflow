import { useMemo } from 'react';
import { useAuthContext } from '../provider';

export const useAuth = () => {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuthContext();
  
  return useMemo(
    () => ({
      isLoaded,
      isSignedIn,
      userId,
      sessionId,
    }),
    [isLoaded, isSignedIn, userId, sessionId]
  );
};
