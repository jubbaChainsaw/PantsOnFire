import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '../lib/supabaseBrowser.js';

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setLoading(false);
      return undefined;
    }
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session ?? null);
      if (!cancelled) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!isSupabaseBrowserConfigured()) {
      return { error: new Error('Supabase is not configured.') };
    }
    const supabase = getSupabaseBrowserClient();
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUpWithEmail = useCallback(async (email, password) => {
    if (!isSupabaseBrowserConfigured()) {
      return { error: new Error('Supabase is not configured.') };
    }
    const supabase = getSupabaseBrowserClient();
    return supabase.auth.signUp({ email, password });
  }, []);

  const signOutCloud = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) return { error: null };
    const supabase = getSupabaseBrowserClient();
    return supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      cloudConfigured: isSupabaseBrowserConfigured(),
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOutCloud,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signOutCloud],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
