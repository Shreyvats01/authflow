import { useAuthContext } from '../provider';

export const useSession = () => {
  const { isLoaded, session } = useAuthContext();
  
  return {
    isLoaded,
    session
  };
};
