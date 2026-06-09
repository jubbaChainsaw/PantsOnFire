/**
 * Shared lobby HTTP + Socket.IO origin resolution for Vite builds.
 *
 * Local dev  : no env vars needed → relative `/api` and same-origin Socket.IO (Vite proxy).
 * Production : set VITE_LOBBY_SERVER_URL to your server URL (e.g. https://your-service.up.railway.app).
 *              Optionally set VITE_LOBBY_SERVER_FALLBACK_URL as a secondary origin.
 *
 * In production builds, if neither URL is set, a visible error is shown instead of
 * silently using a hardcoded fallback.
 */

function trimOrigin(raw) {
  return String(raw || '')
    .trim()
    .replace(/\/$/, '');
}

function isProductionBuild() {
  return typeof import.meta !== 'undefined' && import.meta.env?.PROD === true;
}

function isLocalHost() {
  if (typeof window === 'undefined') return true;
  const host = String(window.location?.hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '';
}

export function getLobbyServerOrigin() {
  const fromEnv = trimOrigin(import.meta.env?.VITE_LOBBY_SERVER_URL);
  if (fromEnv) return fromEnv;

  // Always allow relative (proxy) in local dev.
  if (!isProductionBuild() || isLocalHost()) return '';

  const fallback = trimOrigin(import.meta.env?.VITE_LOBBY_SERVER_FALLBACK_URL);
  if (fallback) return fallback;

  // Production build with no server URL configured — return a sentinel value so
  // callers can detect the misconfiguration rather than silently hitting a wrong URL.
  return '__LOBBY_SERVER_UNCONFIGURED__';
}

/** @returns {string} e.g. "/api" or "https://host/api" */
export function getLobbyApiBase() {
  const origin = getLobbyServerOrigin();
  if (origin === '__LOBBY_SERVER_UNCONFIGURED__') return '__LOBBY_SERVER_UNCONFIGURED__/api';
  return origin ? `${origin}/api` : '/api';
}

/**
 * Returns a user-visible error message if the lobby server is not configured
 * in a production build, or null if everything looks fine.
 */
export function getLobbyConfigError() {
  if (!isProductionBuild()) return null;
  if (isLocalHost()) return null;
  const origin = getLobbyServerOrigin();
  if (!origin || origin === '__LOBBY_SERVER_UNCONFIGURED__') {
    return (
      'Lobby server is not configured. ' +
      'Set VITE_LOBBY_SERVER_URL in your production environment variables.'
    );
  }
  return null;
}
