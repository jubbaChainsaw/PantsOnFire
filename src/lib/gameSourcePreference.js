const STORAGE_KEY = 'pof-game-source-mode-v1';
const DEV_TOOLS_KEY = 'pof-dev-tools-unlocked-v1';

export const GAME_SOURCE_OPTIONS = [
  { value: 'auto', label: 'Auto (newest compatible)' },
  { value: 'bundled', label: 'Bundled (APK copy)' },
  { value: 'live', label: 'Live website' },
];

export function readGameSourceMode() {
  try {
    const raw = String(localStorage.getItem(STORAGE_KEY) || '').trim().toLowerCase();
    if (raw === 'bundled' || raw === 'live' || raw === 'auto') return raw;
  } catch {
    /* ignore */
  }
  return 'auto';
}

export function writeGameSourceMode(mode) {
  const next = String(mode || 'auto').trim().toLowerCase();
  const safe = next === 'bundled' || next === 'live' ? next : 'auto';
  try {
    localStorage.setItem(STORAGE_KEY, safe);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== 'undefined' && window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'POF_SET_GAME_SOURCE', mode: safe }),
      );
    }
  } catch {
    /* ignore */
  }
  return safe;
}

export function isDevToolsUnlocked() {
  try {
    return localStorage.getItem(DEV_TOOLS_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlockDevTools() {
  try {
    localStorage.setItem(DEV_TOOLS_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export function canShowGameSourceControls() {
  if (import.meta.env.DEV) return true;
  return isDevToolsUnlocked();
}

export function readActiveGameSourceLabel() {
  const host =
    typeof window !== 'undefined' ? window.__POF_NATIVE_HOST__ : null;
  const source = String(host?.gameSource || '').trim();
  if (source) return source;
  return import.meta.env.DEV ? 'web-dev' : '';
}
