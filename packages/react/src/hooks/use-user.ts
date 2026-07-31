import { useAuthContext } from '../provider';

export const useUser = () => {
  const { isLoaded, isSignedIn, user, reload } = useAuthContext();
  
  return {
    isLoaded,
    isSignedIn,
    user,
    reload
  };
};
