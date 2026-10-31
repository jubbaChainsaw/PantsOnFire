/** Visible build label for bundled web (set in CI via VITE_*). */
export function getWebBuildStamp() {
  const explicit = String(import.meta.env.VITE_APP_BUILD_STAMP || '').trim();
  if (explicit) return explicit;
  const sha = String(import.meta.env.VITE_APP_BUILD_SHA || '').trim();
  const ver = String(import.meta.env.VITE_APP_VERSION || '0.1.0').trim();
  if (sha) return `${ver} · ${sha.slice(0, 7)}`;
  return ver;
}

export function formatNativeShellBuildLabel(host = null) {
  const h =
    host ||
    (typeof window !== 'undefined' ? window.__POF_NATIVE_HOST__ : null);
  if (!h || typeof h !== 'object') return '';
  const code = String(h.androidVersionCode || '').trim();
  const shell = String(h.shellVersion || '').trim();
  const surface = String(h.gameSurface || '').trim();
  const parts = [];
  if (shell) parts.push(`shell ${shell}`);
  if (code) parts.push(`apk ${code}`);
  if (surface) parts.push(surface);
  return parts.join(' · ');
}
