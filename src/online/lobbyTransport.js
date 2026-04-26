import { io } from 'socket.io-client';

const LOBBY_SERVER_URL = String(import.meta?.env?.VITE_LOBBY_SERVER_URL || '').trim();
const LOBBY_API_BASE = `${LOBBY_SERVER_URL ? LOBBY_SERVER_URL.replace(/\/$/, '') : ''}/api`;

function randomId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCode(lobbyCode) {
  return String(lobbyCode || '').trim().toUpperCase();
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

export function createOnlinePlayer({ name, clientId, isHost = false }) {
  return {
    id: randomId('opl'),
    name: String(name || '').trim() || 'Player',
    clientId: String(clientId || ''),
    isHost: Boolean(isHost),
    joinedAt: nowIso(),
  };
}

export async function createLobbyOnServer({ hostName, hostPlayer }) {
  const payload = await requestJson('/lobbies', {
    method: 'POST',
    body: { hostName, hostPlayer },
  });
  return {
    lobby: payload?.lobby || null,
    player: payload?.player || null,
    sessionToken: payload?.sessionToken || '',
  };
}

export async function readLobbySnapshot(lobbyCode) {
  const normalizedCode = normalizeCode(lobbyCode);
  if (!normalizedCode) return null;
  try {
    const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}`);
    return payload?.lobby || null;
  } catch (error) {
    if (error?.status === 404 || error?.code === 'lobby-not-found') return null;
    throw error;
  }
}

export async function joinLobbyOnServer(lobbyCode, player) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/join`, {
    method: 'POST',
    body: { player },
  });
  return {
    lobby: payload?.lobby || null,
    player: payload?.player || null,
    sessionToken: payload?.sessionToken || '',
  };
}

export async function leaveLobbyOnServer(lobbyCode, { role, playerId } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/leave`, {
    method: 'POST',
    body: { role, playerId },
  });
  return payload?.lobby || null;
}

export async function resumeLobbySessionOnServer(lobbyCode, { playerId, sessionToken, clientId } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/resume`, {
    method: 'POST',
    body: { playerId, sessionToken, clientId },
  });
  return {
    lobby: payload?.lobby || null,
    player: payload?.player || null,
    sessionToken: payload?.sessionToken || '',
    role: payload?.role || null,
  };
}

export async function startLobbyOnServer(lobbyCode, { hostClientId, sessionToken } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/start`, {
    method: 'POST',
    body: { hostClientId, sessionToken },
  });
  return {
    lobby: payload?.lobby || null,
    rotatedSessionToken: payload?.rotatedSessionToken || '',
  };
}

export async function readCurrentRoundOnServer(lobbyCode) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/round`);
  return {
    round: payload?.round || null,
    activeRoundRevision: payload?.activeRoundRevision || null,
  };
}

export async function readPrivateRoundOnServer(lobbyCode, { playerId, sessionToken } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const query = new URLSearchParams({
    playerId: String(playerId || ''),
    sessionToken: String(sessionToken || ''),
  });
  const payload = await requestJson(
    `/lobbies/${encodeURIComponent(normalizedCode)}/round/private?${query.toString()}`
  );
  return {
    round: payload?.round || null,
  };
}

export async function createNextRoundOnServer(lobbyCode, { hostClientId, sessionToken } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/rounds/next`, {
    method: 'POST',
    body: { hostClientId, sessionToken },
  });
  return {
    lobby: payload?.lobby || null,
    round: payload?.round || null,
    rotatedSessionToken: payload?.rotatedSessionToken || '',
  };
}

export async function advanceRoundPhaseOnServer(lobbyCode, { playerId, sessionToken } = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/round/phase/advance`, {
    method: 'POST',
    body: { playerId, sessionToken },
  });
  return {
    lobby: payload?.lobby || null,
    round: payload?.round || null,
    phase: payload?.phase || '',
    rotatedSessionToken: payload?.rotatedSessionToken || '',
  };
}

export async function submitRoundVotesOnServer(
  lobbyCode,
  { playerId, sessionToken, votesByPlayerId } = {}
) {
  const normalizedCode = normalizeCode(lobbyCode);
  const normalizedVotes = votesByPlayerId && typeof votesByPlayerId === 'object'
    ? votesByPlayerId
    : {};
  const targetId = String(normalizedVotes[playerId] || '').trim();
  const payload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/round/votes`, {
    method: 'POST',
    body: { playerId, targetId, sessionToken },
  });
  return {
    lobby: payload?.lobby || null,
    round: payload?.round || null,
    phase: payload?.phase || '',
    rotatedSessionToken: payload?.rotatedSessionToken || '',
    votingComplete: Boolean(payload?.votingComplete),
    results: payload?.results || null,
  };
}

export function toGamePlayers(onlinePlayers = []) {
  return onlinePlayers.map((player) => {
    const nextPlayer = {
      id: player.id,
      name: player.name,
      score: Math.max(0, Number(player?.score || 0)),
    };
    if (player && typeof player.color === 'string') nextPlayer.color = player.color;
    if (player && typeof player.personaId === 'string') nextPlayer.personaId = player.personaId;
    if (player && typeof player.personaBio === 'string') nextPlayer.personaBio = player.personaBio;
    if (player && typeof player.personaImageSrc === 'string') nextPlayer.personaImageSrc = player.personaImageSrc;
    return nextPlayer;
  });
}

export function createLobbyTransport({ lobbyCode, onSnapshot = () => {}, onEvent = () => {} }) {
  if (typeof window === 'undefined' || !lobbyCode) {
    return {
      getSnapshot: () => null,
      syncSnapshot: async () => null,
      close: () => {},
    };
  }

  const normalizedCode = normalizeCode(lobbyCode);
  let closed = false;
  let lastSnapshot = null;
  const socket = io(LOBBY_SERVER_URL || undefined, {
    transports: ['websocket', 'polling'],
  });

  const pushSnapshot = (snapshot, source = 'socket') => {
    if (!snapshot || closed) return;
    lastSnapshot = snapshot;
    onSnapshot(snapshot, source);
  };

  const syncSnapshot = async () => {
    if (closed) return;
    try {
      const snapshot = await readLobbySnapshot(normalizedCode);
      if (!snapshot) {
        lastSnapshot = null;
        onSnapshot(null, 'sync');
        return null;
      }
      pushSnapshot(snapshot, 'sync');
      return snapshot;
    } catch (error) {
      onEvent({ type: 'sync-error', error }, 'sync');
      throw error;
    }
  };

  socket.on('connect', () => {
    if (closed) return;
    socket.emit('lobby:subscribe', { code: normalizedCode });
    onEvent({ type: 'socket-connected', code: normalizedCode }, 'socket');
  });
  socket.on('connect_error', (error) => {
    if (closed) return;
    onEvent({ type: 'connect-error', error }, 'socket');
  });
  socket.on('lobby:snapshot', (snapshot) => {
    if (closed) return;
    if (!snapshot) {
      lastSnapshot = null;
      onSnapshot(null, 'socket');
      return;
    }
    pushSnapshot(snapshot, 'socket');
  });
  socket.emit('lobby:subscribe', { code: normalizedCode });
  syncSnapshot().catch(() => {});

  return {
    getSnapshot: () => lastSnapshot,
    syncSnapshot,
    close: () => {
      if (closed) return;
      closed = true;
      socket.emit('lobby:unsubscribe', { code: normalizedCode });
      socket.off('connect');
      socket.off('connect_error');
      socket.off('lobby:snapshot');
      socket.disconnect();
    },
  };
}
