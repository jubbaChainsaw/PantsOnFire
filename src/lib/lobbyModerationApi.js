import { getLobbyApiBase } from './lobbyApiEnv.js';
import { getNativeHostingHeaders } from './nativeHostingCredentials.js';

async function requestJson(path, { method = 'GET', body, accessToken = '' } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...getNativeHostingHeaders(),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${getLobbyApiBase()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const error = new Error(payload?.error || 'request-failed');
    error.code = payload?.error || 'request-failed';
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function reportLobbyPlayer({
  lobbyCode,
  playerId,
  sessionToken,
  reportedPlayerId,
  reason,
  note = '',
  accessToken = '',
}) {
  const code = String(lobbyCode || '').trim().toUpperCase();
  return requestJson(`/lobbies/${encodeURIComponent(code)}/report`, {
    method: 'POST',
    accessToken,
    body: {
      playerId,
      sessionToken,
      reportedPlayerId,
      reason,
      note,
    },
  });
}

export async function kickLobbyPlayer({
  lobbyCode,
  hostPlayerId,
  sessionToken,
  targetPlayerId,
}) {
  const code = String(lobbyCode || '').trim().toUpperCase();
  return requestJson(`/lobbies/${encodeURIComponent(code)}/kick`, {
    method: 'POST',
    body: { hostPlayerId, sessionToken, targetPlayerId },
  });
}

export async function fetchAccountBlocks(accessToken) {
  const payload = await requestJson('/me/blocks', { accessToken });
  return payload?.blockedPlayerKeys || [];
}

export async function syncAccountBlock({
  accessToken,
  blockedPlayerKey,
  action = 'block',
}) {
  const payload = await requestJson('/me/blocks', {
    method: 'PUT',
    accessToken,
    body: { blockedPlayerKey, action },
  });
  return payload?.blockedPlayerKeys || [];
}
