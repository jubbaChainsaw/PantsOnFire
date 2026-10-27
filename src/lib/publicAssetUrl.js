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
