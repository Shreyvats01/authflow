import { useAuthContext } from '../provider';

export const useUserMetadata = () => {
  const { user, config, reload } = useAuthContext();
  const baseURL = config?.baseURL ?? '/api/auth';
  
  const updateMetadata = async (metadata: Record<string, any>) => {
    if (!user) return;
    
    const res = await fetch(`${baseURL}/user/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    
    if (res.ok) {
      await reload();
    }
  };

  const getMetadata = async (key: string) => {
    if (!user) return null;
    const res = await fetch(`${baseURL}/user/metadata?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
    return null;
  };
  
  return {
    metadata: user?.metadata || {},
    updateMetadata,
    getMetadata
  };
};
