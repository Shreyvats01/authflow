import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../provider';

export const useUserMetadata = () => {
  const { user, config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const updateMetadata = useCallback(
    async (metadata: Record<string, any>) => {
      if (!user) return;
      
      const res = await fetch(`${baseURL}/user/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      
      if (res.ok) {
        await reload();
      }
    },
    [user, baseURL, reload]
  );

  const getMetadata = useCallback(
    async (key: string) => {
      if (!user) return null;
      const res = await fetch(`${baseURL}/user/metadata?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
      return null;
    },
    [user, baseURL]
  );

  const metadata = user?.metadata || {};
  
  return useMemo(
    () => ({
      metadata,
      updateMetadata,
      getMetadata,
    }),
    [metadata, updateMetadata, getMetadata]
  );
};
