/**
 * Public files live under `public/assets/`. Vite `base` is `./` for mobile/APK builds
 * and `/` for normal web — always prefix with import.meta.env.BASE_URL.
 */
export function publicAssetUrl(relativePath = '') {
  const rel = String(relativePath || '').replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  const joined = `${base}assets/${rel}`;
  return joined.replace(/([^:]\/)\/+/g, '$1');
}

/** Normalizes `/assets/...`, `./assets/...`, or `assets/...` for web and bundled WebView. */
export function resolveBundledAssetSrc(src = '') {
  const normalized = String(src || '').trim();
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('./assets/')) return normalized;
  if (normalized.startsWith('assets/')) {
    return `${import.meta.env.BASE_URL || '/'}${normalized}`.replace(
      /([^:]\/)\/+/g,
      '$1',
    );
  }
  const match = normalized.match(/^\/?assets\/(.+)$/);
  if (match) return publicAssetUrl(match[1]);
  return normalized;
}
