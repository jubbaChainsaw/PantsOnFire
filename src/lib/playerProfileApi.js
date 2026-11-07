import { getLobbyApiBase } from '../lib/lobbyApiEnv.js';
import { normalizePlayerProfile } from '../data/playerProfile/profileModel.js';

export async function fetchRemotePlayerProfile(accessToken) {
  if (!accessToken) return null;
  const res = await fetch(`${getLobbyApiBase()}/api/me/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (res.status === 404) {
    return normalizePlayerProfile(null);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `profile-http-${res.status}`);
  }
  const payload = await res.json();
  return normalizePlayerProfile(payload?.profile || payload);
}

export async function pushRemotePlayerProfile(accessToken, profile) {
  if (!accessToken) return null;
  const res = await fetch(`${getLobbyApiBase()}/api/me/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile: normalizePlayerProfile(profile) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `profile-http-${res.status}`);
  }
  const payload = await res.json();
  return normalizePlayerProfile(payload?.profile || payload);
}
