/**
 * Shared lobby HTTP + Socket.IO origin resolution for Vite builds.
 * - Local dev: empty origin → relative `/api` and same-origin Socket.IO (Vite proxy).
 * - Production: set VITE_LOBBY_SERVER_URL to your Railway URL, e.g. https://your-service.up.railway.app
 */

const DEFAULT_PUBLIC_LOBBY_FALLBACK = 'https://api.pantsonfire.app';

function trimOrigin(raw) {
  return String(raw || '').trim().replace(/\/$/, '');
}

export function getLobbyServerOrigin() {
  const fromEnv = trimOrigin(import.meta.env?.VITE_LOBBY_SERVER_URL);
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return '';
  const host = String(window.location?.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return '';
  const fallback = trimOrigin(
    import.meta.env?.VITE_LOBBY_SERVER_FALLBACK_URL || DEFAULT_PUBLIC_LOBBY_FALLBACK,
  );
  return fallback || '';
}

/** @returns {string} e.g. "/api" or "https://host/api" */
export function getLobbyApiBase() {
  const origin = getLobbyServerOrigin();
  return origin ? `${origin}/api` : '/api';
}
