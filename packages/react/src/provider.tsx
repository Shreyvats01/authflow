import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';

interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  user: any | null;
  session: any | null;
  reload: () => Promise<void>;
  config?: { baseURL?: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface BolkAuthProviderProps {
  children: ReactNode;
  config?: {
    baseURL?: string;
  };
}

export const BolkAuthProvider = ({ children, config }: BolkAuthProviderProps) => {
  const baseURL = config?.baseURL ?? '/api/auth';
  const [state, setState] = useState({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    user: null,
    session: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`${baseURL}/session`);
      if (res.ok) {
        const data = await res.json();
        setState({
          isLoaded: true,
          isSignedIn: !!data.user,
          userId: data.user?.id || null,
          sessionId: data.session?.id || null,
          user: data.user || null,
          session: data.session || null,
        });
      } else {
        setState({
          isLoaded: true,
          isSignedIn: false,
          userId: null,
          sessionId: null,
          user: null,
          session: null,
        });
      }
    } catch (e) {
      setState({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        user: null,
        session: null,
      });
    }
  }, [baseURL]);

  useEffect(() => {
    fetchSession();

    const channel = new BroadcastChannel('bolkauth_sync');
    channel.onmessage = (event) => {
      if (event.data === 'sync_session') {
        fetchSession();
      }
    };

    return () => {
      channel.close();
    };
  }, [fetchSession]);

  const value = useMemo(
    () => ({
      ...state,
      reload: fetchSession,
      config,
    }),
    [state, fetchSession, config]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within a BolkAuthProvider');
  }
  return context;
};

export const AuthFlowProvider = BolkAuthProvider;
export type AuthFlowProviderProps = BolkAuthProviderProps;
