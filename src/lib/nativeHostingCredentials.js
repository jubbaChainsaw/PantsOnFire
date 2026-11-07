/**
 * Credentials injected by the native app shell (App.js) into the WebView.
 * The public join-only website never receives these values.
 */

export function getNativeHostingHeaders() {
  if (typeof window === 'undefined') return {};
  const creds = window.__POF_NATIVE_HOST__;
  if (!creds || typeof creds !== 'object') return {};
  const installToken = String(creds.installToken || '').trim();
  if (!installToken) return {};
  const headers = {
    'X-PoF-Client-Surface': String(creds.surface || 'native-shell').trim(),
    'X-PoF-App-Install-Token': installToken,
  };
  const platform = String(creds.platform || '').trim();
  if (platform) headers['X-PoF-App-Platform'] = platform;
  return headers;
}

export function isNativeShellHostingClient() {
  return Boolean(getNativeHostingHeaders()['X-PoF-App-Install-Token']);
}
