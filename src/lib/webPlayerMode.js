/**
 * Production website (www.pantsonfire.app) is join + shop only.
 * Native apps host games and use downloaded theme content.
 * UI hides host flows when join-only; lobby server rejects create/host without
 * a native app install token (see hostingGate.js).
 */

const PRODUCTION_WEB_HOSTS = new Set(['pantsonfire.app', 'www.pantsonfire.app']);

export function isWebJoinOnlyMode() {
  const fromEnv = String(import.meta.env?.VITE_WEB_JOIN_ONLY ?? '')
    .trim()
    .toLowerCase();
  if (fromEnv === 'true' || fromEnv === '1') return true;
  if (fromEnv === 'false' || fromEnv === '0') return false;
  if (typeof window === 'undefined') return false;
  const host = String(window.location?.hostname || '').toLowerCase();
  return PRODUCTION_WEB_HOSTS.has(host);
}

export function parseJoinCodeFromLocation(locationLike = window.location) {
  try {
    const params = new URLSearchParams(locationLike?.search || '');
    const raw =
      params.get('join') ||
      params.get('lobby') ||
      params.get('code') ||
      '';
    const cleaned = String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (cleaned.length >= 4) return cleaned;
    const path = String(locationLike?.pathname || '');
    const joinPath = path.match(/\/join\/([A-Za-z0-9]+)/i);
    if (joinPath?.[1]) {
      return joinPath[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
  } catch {
    /* ignore */
  }
  return '';
}

export const MOBILE_STORE_LINKS = {
  android:
    String(import.meta.env?.VITE_PLAY_STORE_URL || '').trim() ||
    'https://play.google.com/store/apps/details?id=app.pantsonfire.findtheliar',
  ios:
    String(import.meta.env?.VITE_APP_STORE_URL || '').trim() ||
    'https://apps.apple.com/app/pants-on-fire/id0000000000',
};
