/**
 * Per-device Ian host commentary (bundled MP3 narration only). Default ON.
 * Not synced to cloud or lobby (t221u).
 */
const STORAGE_KEY = 'imposter-host-commentary-v1';

export function loadHostCommentaryEnabled() {
  try {
    if (typeof globalThis.localStorage === 'undefined') return true;
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== '0' && raw !== 'false';
  } catch {
    return true;
  }
}

export function saveHostCommentaryEnabled(enabled) {
  try {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* private mode */
  }
  try {
    window.dispatchEvent(
      new CustomEvent('pof-host-commentary', { detail: { enabled } }),
    );
  } catch {
    /* ignore */
  }
}
