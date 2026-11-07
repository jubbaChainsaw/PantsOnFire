import { normalizeUnlockedThemePackIds } from '../data/themeCatalog';
import { TIER_FIBBER } from '../account/tierModel.js';
import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';

/**
 * Build the same session shape the game uses from a cloud user + API payload.
 * @param {object} user Cloud user object (PoF or legacy Supabase shape)
 * @param {{ tierId?: string, addonTwistTruth?: boolean, unlockedThemePackIds?: string[] }} payload
 * @param {'pof' | 'supabase'} authProvider
 */
export function buildSessionFromRemote(user, payload = {}, authProvider = 'pof') {
  const email = String(user?.email || '').trim();
  const metaName = String(user?.user_metadata?.full_name || user?.display_name || '').trim();
  const displayName =
    metaName ||
    (email ? email.split('@')[0] : '') ||
    'Player';
  return {
    userId: String(user?.id || '').trim(),
    displayName,
    tierId: String(payload.tierId || TIER_FIBBER).trim() || TIER_FIBBER,
    addonTwistTruth: Boolean(payload.addonTwistTruth),
    unlockedThemePackIds: normalizeUnlockedThemePackIds(
      payload.unlockedThemePackIds || [],
    ),
    authProvider: authProvider === 'supabase' ? 'supabase' : 'pof',
  };
}

/**
 * @param {string} accessToken
 * @returns {Promise<{ tierId: string, addonTwistTruth: boolean, unlockedThemePackIds: string[] }>}
 */
export async function fetchRemoteEntitlements(accessToken) {
  const res = await fetch(`${getLobbyApiBase()}/me/entitlements`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (res.status === 503) {
    return {
      tierId: TIER_FIBBER,
      addonTwistTruth: false,
      unlockedThemePackIds: [],
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `entitlements-http-${res.status}`);
  }
  return res.json();
}
