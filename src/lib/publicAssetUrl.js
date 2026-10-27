/**
 * Public files live under `public/assets/`. Vite `base` is `./` for mobile/APK builds
 * and `/` for normal web — always prefix with import.meta.env.BASE_URL.
 */
function viteBaseUrl() {
  return (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
}

export function publicAssetUrl(relativePath = '') {
  const rel = String(relativePath || '').replace(/^\/+/, '');
  const base = viteBaseUrl();
  const joined = `${base}assets/${rel}`;
  return joined.replace(/([^:]\/)\/+/g, '$1');
}

/** Normalizes `/assets/...`, `./assets/...`, or `assets/...` for web and bundled WebView. */
function applyMobileRasterExtension(url = '') {
  const value = String(url || '');
  const rasterExt =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_UI_RASTER_EXT
      : '';
  if (rasterExt !== 'webp') return value;
  return value.replace(/\.(png|jpe?g)(?=($|\?|#))/i, '.webp');
}

export function resolveBundledAssetSrcCore(src = '') {
  const normalized = String(src || '').trim();
  if (!normalized) return '';
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('./assets/')) {
    return applyMobileRasterExtension(normalized);
  }
  if (normalized.startsWith('assets/')) {
    return applyMobileRasterExtension(
      `${viteBaseUrl()}${normalized}`.replace(/([^:]\/)\/+/g, '$1'),
    );
  }
  const match = normalized.match(/^\/?assets\/(.+)$/);
  if (match) return applyMobileRasterExtension(publicAssetUrl(match[1]));
  return applyMobileRasterExtension(normalized);
}

export { resolveBundledAssetSrc } from './contentPacks/resolveAsset.js';
