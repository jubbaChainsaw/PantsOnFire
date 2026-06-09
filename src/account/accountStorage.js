import { normalizeUnlockedThemePackIds } from '../data/themeCatalog';
import { TIER_FIBBER, TIER_HOST_MOST, TIER_LOCAL_LIAR, TIER_SUSPECT } from './tierModel.js';

/**
 * Demo billing is only available in dev/demo mode.
 * Set VITE_ENABLE_DEMO_BILLING="true" to allow it in a production build (for testing only).
 * WARNING: demo purchases are not real payments and must never be enabled in a live storefront.
 */
export function isDemoBillingEnabled() {
  if (import.meta.env?.PROD) {
    return import.meta.env?.VITE_ENABLE_DEMO_BILLING === 'true';
  }
  return true;
}

/**
 * Local (base64-encoded) auth is only for offline/demo testing.
 * Base64 encoding is NOT secure password storage. Passwords stored this way can be
 * trivially decoded by anyone with access to localStorage — never use in production.
 * Set VITE_ENABLE_LOCAL_AUTH="true" to allow it in a production build (for testing only).
 */
export function isLocalAuthEnabled() {
  if (import.meta.env?.PROD) {
    return import.meta.env?.VITE_ENABLE_LOCAL_AUTH === 'true';
  }
  return true;
}

const SESSION_KEY = 'imposter-account-session-v2';
const DIRECTORY_KEY = 'imposter-account-directory-v2';
const LEGACY_PACK_KEY = 'imposter-unlocked-theme-packs-v1';

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function encodePassword(password) {
  try {
    return window.btoa(unescape(encodeURIComponent(String(password || ''))));
  } catch {
    return '';
  }
}

function decodePassword(encoded) {
  try {
    return decodeURIComponent(escape(window.atob(String(encoded || ''))));
  } catch {
    return '';
  }
}

function migrateLegacyPackIds() {
  const legacy = readJson(LEGACY_PACK_KEY, []);
  return normalizeUnlockedThemePackIds(Array.isArray(legacy) ? legacy : []);
}

function readDirectory() {
  const raw = readJson(DIRECTORY_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

function writeDirectory(rows) {
  writeJson(DIRECTORY_KEY, rows);
}

/**
 * @returns {{ userId: string, displayName: string, tierId: string, addonTwistTruth: boolean, unlockedThemePackIds: string[] } | null}
 */
export function readAccountSession() {
  const raw = readJson(SESSION_KEY, null);
  if (!raw || typeof raw !== 'object') return null;
  const userId = String(raw.userId || '').trim();
  const displayName = String(raw.displayName || '').trim();
  if (!userId || !displayName) return null;
  return {
    userId,
    displayName,
    tierId: String(raw.tierId || TIER_FIBBER).trim() || TIER_FIBBER,
    addonTwistTruth: Boolean(raw.addonTwistTruth),
    unlockedThemePackIds: normalizeUnlockedThemePackIds(raw.unlockedThemePackIds || []),
    authProvider: raw.authProvider === 'supabase' ? 'supabase' : 'local',
  };
}

export function writeAccountSession(session) {
  if (!session) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  writeJson(SESSION_KEY, session);
}

export function clearAccountSession() {
  writeAccountSession(null);
}

function upsertDirectoryRow(row) {
  const dir = readDirectory();
  const next = dir.filter((r) => String(r?.userId) !== String(row.userId));
  next.push(row);
  writeDirectory(next);
}

function findDirectoryUser(userId) {
  return readDirectory().find((r) => String(r?.userId) === String(userId)) || null;
}

/**
 * @returns {{ ok: true, session: object } | { ok: false, error: string }}
 */
export function registerAccount({ displayName, password }) {
  if (!isLocalAuthEnabled()) {
    return {
      ok: false,
      error:
        'Local account registration is disabled in production. Please sign in with Supabase.',
    };
  }
  const name = String(displayName || '').trim();
  const pass = String(password || '');
  if (name.length < 2) return { ok: false, error: 'Display name should be at least 2 characters.' };
  if (pass.length < 4) return { ok: false, error: 'Password should be at least 4 characters.' };
  const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const unlockedThemePackIds = migrateLegacyPackIds();
  const directoryRow = {
    userId,
    displayName: name,
    passwordEncoded: encodePassword(pass),
    tierId: TIER_FIBBER,
    addonTwistTruth: false,
    unlockedThemePackIds,
  };
  upsertDirectoryRow(directoryRow);
  const session = {
    userId,
    displayName: name,
    tierId: TIER_FIBBER,
    addonTwistTruth: false,
    unlockedThemePackIds,
    authProvider: 'local',
  };
  writeAccountSession(session);
  writeJson(LEGACY_PACK_KEY, unlockedThemePackIds);
  return { ok: true, session };
}

/**
 * @returns {{ ok: true, session: object } | { ok: false, error: string }}
 */
export function loginAccount({ displayName, password }) {
  if (!isLocalAuthEnabled()) {
    return {
      ok: false,
      error: 'Local account login is disabled in production. Please sign in with Supabase.',
    };
  }
  const name = String(displayName || '').trim().toLowerCase();
  const pass = String(password || '');
  const dir = readDirectory();
  const row = dir.find((r) => String(r?.displayName || '').trim().toLowerCase() === name);
  if (!row) return { ok: false, error: 'No account found with that display name.' };
  if (decodePassword(row.passwordEncoded) !== pass) return { ok: false, error: 'Incorrect password.' };
  const session = {
    userId: row.userId,
    displayName: String(row.displayName || '').trim(),
    tierId: String(row.tierId || TIER_FIBBER).trim() || TIER_FIBBER,
    addonTwistTruth: Boolean(row.addonTwistTruth),
    unlockedThemePackIds: normalizeUnlockedThemePackIds(row.unlockedThemePackIds || []),
    authProvider: 'local',
  };
  writeAccountSession(session);
  writeJson(LEGACY_PACK_KEY, session.unlockedThemePackIds);
  return { ok: true, session };
}

function patchDirectory(userId, patch) {
  const row = findDirectoryUser(userId);
  if (!row) return;
  upsertDirectoryRow({ ...row, ...patch });
}

/**
 * Demo checkout: sets subscription tier locally (replace with real payment provider).
 * This function is disabled in production builds unless VITE_ENABLE_DEMO_BILLING="true".
 * @returns {{ ok: true, session: object } | { ok: false, error: string }}
 */
export function purchaseTierDemo(userId, nextTierId) {
  if (!isDemoBillingEnabled()) {
    return {
      ok: false,
      error: 'Demo purchases are disabled in production. Please use the real payment flow.',
    };
  }
  const order = [TIER_FIBBER, TIER_LOCAL_LIAR, TIER_SUSPECT, TIER_HOST_MOST];
  const row = findDirectoryUser(userId);
  if (!row) return { ok: false, error: 'Account not found.' };
  const current = String(row.tierId || TIER_FIBBER);
  const curIdx = order.indexOf(current);
  const nextIdx = order.indexOf(nextTierId);
  if (nextIdx === -1) return { ok: false, error: 'Unknown tier.' };
  if (nextIdx <= curIdx) return { ok: false, error: 'You already own this tier or higher.' };
  const nextRow = { ...row, tierId: nextTierId };
  upsertDirectoryRow(nextRow);
  const session = {
    userId: row.userId,
    displayName: String(row.displayName || '').trim(),
    tierId: nextTierId,
    addonTwistTruth: Boolean(row.addonTwistTruth),
    unlockedThemePackIds: normalizeUnlockedThemePackIds(row.unlockedThemePackIds || []),
    authProvider: 'local',
  };
  writeAccountSession(session);
  writeJson(LEGACY_PACK_KEY, session.unlockedThemePackIds);
  return { ok: true, session };
}

/**
 * Demo addon purchase for Twist the Truth.
 * Disabled in production unless VITE_ENABLE_DEMO_BILLING="true".
 * @returns {{ ok: true, session: object } | { ok: false, error: string }}
 */
export function purchaseAddonTwistTruthDemo(userId) {
  if (!isDemoBillingEnabled()) {
    return {
      ok: false,
      error: 'Demo purchases are disabled in production. Please use the real payment flow.',
    };
  }
  const row = findDirectoryUser(userId);
  if (!row) return { ok: false, error: 'Account not found.' };
  if (String(row.tierId) === TIER_HOST_MOST) {
    return { ok: false, error: 'Host with the Most already includes the category editor.' };
  }
  if (row.addonTwistTruth) return { ok: false, error: 'Twist the Truth is already unlocked.' };
  const nextRow = { ...row, addonTwistTruth: true };
  upsertDirectoryRow(nextRow);
  const session = {
    userId: row.userId,
    displayName: String(row.displayName || '').trim(),
    tierId: String(row.tierId || TIER_FIBBER),
    addonTwistTruth: true,
    unlockedThemePackIds: normalizeUnlockedThemePackIds(row.unlockedThemePackIds || []),
    authProvider: 'local',
  };
  writeAccountSession(session);
  return { ok: true, session };
}

/**
 * Demo DLC pack purchase.
 * Disabled in production unless VITE_ENABLE_DEMO_BILLING="true".
 * @returns {{ ok: true, session: object } | { ok: false, error: string }}
 */
export function purchaseDlcPackDemo(userId, packId) {
  if (!isDemoBillingEnabled()) {
    return {
      ok: false,
      error: 'Demo purchases are disabled in production. Please use the real payment flow.',
    };
  }
  const row = findDirectoryUser(userId);
  if (!row) return { ok: false, error: 'Account not found.' };
  if (String(row.tierId) === TIER_HOST_MOST) {
    return { ok: false, error: 'Every DLC pack is already included with Host with the Most.' };
  }
  const nextIds = normalizeUnlockedThemePackIds([...(row.unlockedThemePackIds || []), packId]);
  const nextRow = { ...row, unlockedThemePackIds: nextIds };
  upsertDirectoryRow(nextRow);
  const session = {
    userId: row.userId,
    displayName: String(row.displayName || '').trim(),
    tierId: String(row.tierId || TIER_FIBBER),
    addonTwistTruth: Boolean(row.addonTwistTruth),
    unlockedThemePackIds: nextIds,
    authProvider: 'local',
  };
  writeAccountSession(session);
  writeJson(LEGACY_PACK_KEY, nextIds);
  return { ok: true, session };
}

export function syncSessionPackIds(unlockedThemePackIds) {
  const sess = readAccountSession();
  if (!sess || sess.authProvider === 'supabase') return;
  const next = {
    ...sess,
    unlockedThemePackIds: normalizeUnlockedThemePackIds(unlockedThemePackIds),
  };
  writeAccountSession(next);
  patchDirectory(sess.userId, { unlockedThemePackIds: next.unlockedThemePackIds });
  writeJson(LEGACY_PACK_KEY, next.unlockedThemePackIds);
}
