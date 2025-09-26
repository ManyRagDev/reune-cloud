import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

// Mock user for dev mode
const createMockUser = (): User => ({
  id: 'dev-user-123',
  email: 'dev@reune.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
} as User);

const createMockSession = (): Session => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: createMockUser()
} as Session);

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [devModeActive, setDevModeActive] = useState(() => {
    return isDevMode && localStorage.getItem('devModeActive') === 'true';
  });

  useEffect(() => {
    if (isDevMode && devModeActive) {
      // Dev mode: simulate authenticated user
      const mockSession = createMockSession();
      setSession(mockSession);
      setUser(mockSession.user);
      setLoading(false);
      return;
    }

    // Production mode: use real Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [devModeActive]);

  const enableDevMode = () => {
    if (isDevMode) {
      localStorage.setItem('devModeActive', 'true');
      setDevModeActive(true);
    }
  };

  const disableDevMode = () => {
    localStorage.removeItem('devModeActive');
    setDevModeActive(false);
    setUser(null);
    setSession(null);
  };

  return { user, session, loading, enableDevMode, disableDevMode, devModeActive };
};