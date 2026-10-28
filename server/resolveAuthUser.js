import { createClient } from '@supabase/supabase-js';
import { verifyPoFAccessToken, isPoFAuthConfigured } from './pofAuthJwt.js';

function getSupabaseAdmin() {
  const supabaseUrl = String(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  ).trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Resolve bearer token to a canonical user id (PoF JWT first, optional Supabase legacy).
 * @returns {Promise<{ userId: string, provider: 'pof' | 'supabase' } | { error: string }>}
 */
export async function resolveAuthUserFromBearer(req) {
  const token = String(req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return { error: 'missing-token' };

  if (isPoFAuthConfigured()) {
    const pof = verifyPoFAccessToken(token);
    if (pof?.userId) {
      return { userId: pof.userId, provider: 'pof' };
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data?.user?.id) {
      return { userId: data.user.id, provider: 'supabase' };
    }
  }

  if (!isPoFAuthConfigured() && !getSupabaseAdmin()) {
    return { error: 'server-auth-not-configured' };
  }
  return { error: 'invalid-token' };
}
