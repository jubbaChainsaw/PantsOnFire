import { Room, RoomEvent } from 'livekit-client';

const LOBBY_SERVER_URL = String(import.meta?.env?.VITE_LOBBY_SERVER_URL || '').trim();
const LOBBY_API_BASE = `${LOBBY_SERVER_URL ? LOBBY_SERVER_URL.replace(/\/$/, '') : ''}/api`;

function normalizeCode(rawCode = '') {
  return String(rawCode || '').trim().toUpperCase();
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${LOBBY_API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const code = payload?.error || 'request-failed';
    const error = new Error(code);
    error.code = code;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function createVoicePartyTransport({
  lobbyCode,
  playerId,
  sessionToken,
  onEvent = () => {},
} = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedSessionToken = String(sessionToken || '').trim();
  if (!normalizedCode) throw new Error('lobby-code-required');
  if (!normalizedPlayerId) throw new Error('player-id-required');
  if (!normalizedSessionToken) throw new Error('session-token-required');

  const voicePayload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/voice/token`, {
    method: 'POST',
    body: {
      playerId: normalizedPlayerId,
      sessionToken: normalizedSessionToken,
    },
  });
  const livekitUrl = String(voicePayload?.url || '').trim();
  const token = String(voicePayload?.token || '').trim();
  const roomName = String(voicePayload?.roomName || '').trim();
  if (!livekitUrl || !token || !roomName) {
    const error = new Error('voice-token-invalid');
    error.code = 'voice-token-invalid';
    throw error;
  }

  const room = new Room({ adaptiveStream: true, dynacast: true });
  let closed = false;

  room.on(RoomEvent.Connected, () => {
    if (closed) return;
    onEvent({ type: 'connected', roomName });
  });
  room.on(RoomEvent.Reconnecting, () => {
    if (closed) return;
    onEvent({ type: 'reconnecting', roomName });
  });
  room.on(RoomEvent.Reconnected, () => {
    if (closed) return;
    onEvent({ type: 'reconnected', roomName });
  });
  room.on(RoomEvent.Disconnected, (reason) => {
    if (closed) return;
    onEvent({ type: 'disconnected', reason, roomName });
  });
  room.on(RoomEvent.MediaDevicesError, (error) => {
    if (closed) return;
    onEvent({ type: 'media-devices-error', error, roomName });
  });

  await room.connect(livekitUrl, token);
  await room.localParticipant.setMicrophoneEnabled(true);

  return {
    async setMuted(nextMuted = false) {
      if (closed) return;
      await room.localParticipant.setMicrophoneEnabled(!Boolean(nextMuted));
    },
    async disconnect() {
      if (closed) return;
      closed = true;
      room.disconnect();
    },
  };
}
