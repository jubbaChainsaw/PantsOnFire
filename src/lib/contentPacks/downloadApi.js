import { getLobbyApiBase } from '../lobbyApiEnv.js';

export async function fetchShellConfig() {
  try {
    const res = await fetch(`${getLobbyApiBase()}/shell-config`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Resolve a download URL for a pack. Protected packs always go through the lobby API.
 * @param {string} packId
 * @param {string} accessToken Bearer token (required for protected packs)
 */
export async function fetchPackDownloadGrant(packId, accessToken) {
  const id = String(packId || '').trim();
  const token = String(accessToken || '').trim();
  if (!id) throw new Error('pack-id-required');
  if (!token) throw new Error('auth-required');

  const res = await fetch(`${getLobbyApiBase()}/me/packs/${encodeURIComponent(id)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const error = new Error(payload?.error || `download-http-${res.status}`);
    error.code = payload?.error;
    error.status = res.status;
    throw error;
  }
  return payload;
}
