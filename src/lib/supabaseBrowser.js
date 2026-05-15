import { createClient } from '@supabase/supabase-js';

let client;

export function isSupabaseBrowserConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseBrowserConfigured()) {
    throw new Error('Supabase env vars are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }
  return client;
}
