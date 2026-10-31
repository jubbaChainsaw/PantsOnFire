import { createClient } from '@supabase/supabase-js';

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
 * @param {{
 *   userId: string,
 *   provider: 'pof' | 'supabase',
 *   accountStore: ReturnType<import('./pofAccountStore.js').createPoFAccountStore>,
 *   profileStore: { delete?: (id: string) => Promise<void>, set?: Function, get?: Function },
 *   entitlementsStore: { delete?: (id: string) => Promise<void>, set?: Function, get?: Function },
 *   pgPool: import('pg').Pool | null,
 * }} deps
 */
export async function deleteAccountAndPersonalData(deps) {
  const userId = String(deps.userId || '').trim();
  if (!userId) return { ok: false, error: 'missing-user-id' };

  if (deps.pgPool) {
    await deps.pgPool.query(`DELETE FROM pof_player_profiles WHERE user_id = $1`, [userId]);
    await deps.pgPool.query(`DELETE FROM pof_entitlements WHERE user_id = $1`, [userId]);
    await deps.pgPool.query(`DELETE FROM pof_player_blocks WHERE blocker_user_id = $1`, [userId]);
    await deps.pgPool.query(`DELETE FROM pof_accounts WHERE id = $1`, [userId]);
    await deps.pgPool.query(
      `DELETE FROM pof_referral_codes WHERE user_id = $1`,
      [userId],
    );
    await deps.pgPool.query(
      `DELETE FROM pof_referral_signups WHERE inviter_user_id = $1 OR invitee_user_id = $1`,
      [userId],
    );
  } else if (deps.profileStore instanceof Map) {
    deps.profileStore.delete(userId);
  }
  if (deps.entitlementsStore instanceof Map) {
    deps.entitlementsStore.delete(userId);
  }

  if (deps.provider === 'pof' && deps.accountStore?.deleteAccount) {
    await deps.accountStore.deleteAccount(userId);
  }

  if (deps.provider === 'supabase') {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[account-delete] supabase delete failed', err);
        return { ok: false, error: 'supabase-delete-failed' };
      }
    }
  }

  return { ok: true };
}
