import { getLobbyApiBase } from './lobbyApiEnv.js';
import { normalizeUnlockedAltCardThemeKeys } from '../data/themeCardStyles.js';

export async function fetchRemoteAltCardUnlocks(accessToken) {
  if (!accessToken) return [];
  const res = await fetch(`${getLobbyApiBase()}/api/me/alt-card-unlocks`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `alt-unlocks-http-${res.status}`);
  }
  const payload = await res.json();
  return normalizeUnlockedAltCardThemeKeys(payload?.unlockedThemeKeys || []);
}

export async function completeHostedOnlineGameOnServer(
  lobbyCode,
  { playerId, sessionToken, accessToken },
) {
  const code = String(lobbyCode || '').trim().toUpperCase();
  if (!code || !playerId || !sessionToken || !accessToken) return null;
  const res = await fetch(
    `${getLobbyApiBase()}/api/lobbies/${encodeURIComponent(code)}/complete-hosted-online-game`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId, sessionToken }),
    },
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(payload?.error || `alt-complete-http-${res.status}`);
    error.code = payload?.error;
    throw error;
  }
  return payload;
}
