import { useMemo } from 'react';
import { useAuthContext } from '../provider';

export const useSession = () => {
  const { isLoaded, session } = useAuthContext();
  
  return useMemo(
    () => ({
      isLoaded,
      session,
    }),
    [isLoaded, session]
  );
};
