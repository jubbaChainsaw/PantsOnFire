import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '../lib/supabaseBrowser.js';
import {
  clearPoFCloudAuth,
  fetchPoFAuthStatus,
  loginPoFCloud,
  readPoFCloudAuth,
  registerPoFCloud,
  validatePoFCloudSession,
} from '../lib/pofCloudAuthClient.js';

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pofAuthConfigured, setPofAuthConfigured] = useState(false);
  const supabaseEnabled = isSupabaseBrowserConfigured();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (supabaseEnabled) {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setSession(data.session ?? null);
        if (!cancelled) setLoading(false);
        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
          setSession(next);
        });
        return () => {
          cancelled = true;
          sub.subscription.unsubscribe();
        };
      }

      try {
        const status = await fetchPoFAuthStatus();
        if (!cancelled) setPofAuthConfigured(Boolean(status?.configured));
      } catch {
        if (!cancelled) setPofAuthConfigured(false);
      }
      const stored = readPoFCloudAuth();
      if (stored?.access_token) {
        const validated = await validatePoFCloudSession(stored);
        if (!cancelled) setSession(validated);
      }
      if (!cancelled) setLoading(false);
      return undefined;
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  const signInWithEmail = useCallback(async (email, password) => {
    if (supabaseEnabled) {
      const supabase = getSupabaseBrowserClient();
      return supabase.auth.signInWithPassword({ email, password });
    }
    const result = await loginPoFCloud({ email, password });
    if (result.error) return result;
    setSession(result.data.session);
    return { data: result.data, error: null };
  }, [supabaseEnabled]);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    if (supabaseEnabled) {
      const supabase = getSupabaseBrowserClient();
      return supabase.auth.signUp({ email, password });
    }
    const result = await registerPoFCloud({
      email,
      password,
      displayName,
    });
    if (result.error) return result;
    setSession(result.data.session);
    return { data: result.data, error: null };
  }, [supabaseEnabled]);

  const signOutCloud = useCallback(async () => {
    if (supabaseEnabled) {
      const supabase = getSupabaseBrowserClient();
      return supabase.auth.signOut();
    }
    clearPoFCloudAuth();
    setSession(null);
    return { error: null };
  }, [supabaseEnabled]);

  const cloudProvider = supabaseEnabled ? 'supabase' : 'pof';
  const cloudConfigured = supabaseEnabled || pofAuthConfigured;

  const value = useMemo(
    () => ({
      cloudConfigured,
      cloudProvider,
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOutCloud,
    }),
    [
      cloudConfigured,
      cloudProvider,
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signOutCloud,
    ],
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
