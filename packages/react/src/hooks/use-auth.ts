import { useAuthContext } from '../provider';

export const useAuth = () => {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuthContext();
  
  return {
    isLoaded,
    isSignedIn,
    userId,
    sessionId
  };
};
