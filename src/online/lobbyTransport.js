const LOBBY_STORAGE_PREFIX = 'imposter-online-lobby-v1::';
const LOBBY_EVENT_PREFIX = 'imposter-online-lobby-event-v1::';
const LOBBY_CHANNEL_PREFIX = 'imposter-online-lobby-channel-v1::';

function randomId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getLobbyStorageKey(lobbyCode) {
  return `${LOBBY_STORAGE_PREFIX}${String(lobbyCode || '').toUpperCase()}`;
}

function getLobbyEventKey(lobbyCode) {
  return `${LOBBY_EVENT_PREFIX}${String(lobbyCode || '').toUpperCase()}`;
}

function parseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

export function readLobbySnapshot(lobbyCode) {
  if (typeof window === 'undefined') return null;
  const storageKey = getLobbyStorageKey(lobbyCode);
  return parseJson(window.localStorage.getItem(storageKey));
}

export function writeLobbySnapshot(snapshot) {
  if (typeof window === 'undefined' || !snapshot?.code) return;
  const normalized = {
    ...snapshot,
    code: String(snapshot.code).toUpperCase(),
    updatedAt: snapshot.updatedAt || nowIso(),
  };
  const storageKey = getLobbyStorageKey(normalized.code);
  window.localStorage.setItem(storageKey, JSON.stringify(normalized));
}

export function clearLobbySnapshot(lobbyCode) {
  if (typeof window === 'undefined') return;
  const storageKey = getLobbyStorageKey(lobbyCode);
  window.localStorage.removeItem(storageKey);
}

export function createLobbySnapshot({ lobbyCode, hostPlayer, hostName }) {
  const code = String(lobbyCode || '').toUpperCase();
  const createdAt = nowIso();
  return {
    code,
    status: 'waiting',
    hostName: hostName || hostPlayer?.name || 'Host',
    hostClientId: hostPlayer?.clientId || '',
    createdAt,
    updatedAt: createdAt,
    startedAt: null,
    startedRevision: null,
    players: hostPlayer ? [{ ...hostPlayer, isHost: true }] : [],
  };
}

export function upsertLobbyPlayer(snapshot, nextPlayer) {
  if (!snapshot || !nextPlayer) return snapshot;
  const existingByClient = (snapshot.players || []).find((player) => player.clientId === nextPlayer.clientId);
  const existingById = existingByClient || (snapshot.players || []).find((player) => player.id === nextPlayer.id);
  const playerId = existingById?.id || nextPlayer.id || randomId('opl');
  const updatedPlayer = {
    ...nextPlayer,
    id: playerId,
    isHost: existingById?.isHost || Boolean(nextPlayer.isHost),
    joinedAt: existingById?.joinedAt || nextPlayer.joinedAt || nowIso(),
  };
  const withoutOld = (snapshot.players || []).filter((player) => player.id !== playerId && player.clientId !== nextPlayer.clientId);
  return {
    ...snapshot,
    players: [...withoutOld, updatedPlayer],
    updatedAt: nowIso(),
  };
}

export function removeLobbyPlayer(snapshot, playerId) {
  if (!snapshot || !playerId) return snapshot;
  return {
    ...snapshot,
    players: (snapshot.players || []).filter((player) => player.id !== playerId),
    updatedAt: nowIso(),
  };
}

export function markLobbyStarted(snapshot, hostClientId) {
  if (!snapshot || snapshot.hostClientId !== hostClientId) return snapshot;
  const startedAt = nowIso();
  return {
    ...snapshot,
    status: 'started',
    startedAt,
    startedRevision: randomId('start'),
    updatedAt: startedAt,
  };
}

export function toGamePlayers(onlinePlayers = []) {
  return onlinePlayers.map((player) => ({
    id: player.id,
    name: player.name,
    score: 0,
  }));
}

export function createLobbyTransport({ lobbyCode, onSnapshot = () => {}, onEvent = () => {} }) {
  if (typeof window === 'undefined') {
    return {
      getSnapshot: () => null,
      publishSnapshot: () => {},
      emitEvent: () => {},
      syncSnapshot: () => {},
      close: () => {},
    };
  }

  const normalizedCode = String(lobbyCode || '').toUpperCase();
  const lobbyStorageKey = getLobbyStorageKey(normalizedCode);
  const lobbyEventKey = getLobbyEventKey(normalizedCode);
  const channelName = `${LOBBY_CHANNEL_PREFIX}${normalizedCode}`;

  let channel = null;
  let closed = false;

  const pushSnapshot = (snapshot, source = 'unknown') => {
    if (!snapshot || closed) return;
    onSnapshot(snapshot, source);
  };

  const syncSnapshot = () => {
    if (closed) return;
    const snapshot = readLobbySnapshot(normalizedCode);
    pushSnapshot(snapshot, 'sync');
  };

  const emitEvent = (type, payload = {}) => {
    if (closed) return;
    const event = {
      id: randomId('evt'),
      code: normalizedCode,
      type,
      payload,
      sentAt: nowIso(),
    };
    if (channel) channel.postMessage(event);
    window.localStorage.setItem(lobbyEventKey, JSON.stringify(event));
    onEvent(event, 'local');
  };

  const publishSnapshot = (snapshot) => {
    if (closed || !snapshot) return;
    writeLobbySnapshot(snapshot);
    pushSnapshot(snapshot, 'local');
    emitEvent('snapshot-updated', { updatedAt: snapshot.updatedAt || nowIso() });
  };

  const onStorage = (event) => {
    if (closed) return;
    if (event.key === lobbyStorageKey) {
      const next = parseJson(event.newValue);
      pushSnapshot(next, 'storage');
      return;
    }
    if (event.key === lobbyEventKey) {
      const nextEvent = parseJson(event.newValue);
      if (!nextEvent) return;
      onEvent(nextEvent, 'storage');
      if (nextEvent.type !== 'heartbeat') syncSnapshot();
    }
  };

  window.addEventListener('storage', onStorage);
  if (typeof window.BroadcastChannel !== 'undefined') {
    channel = new window.BroadcastChannel(channelName);
    channel.onmessage = (message) => {
      if (closed) return;
      const incoming = message?.data;
      if (!incoming) return;
      onEvent(incoming, 'broadcast');
      if (incoming.type !== 'heartbeat') syncSnapshot();
    };
  }

  pushSnapshot(readLobbySnapshot(normalizedCode), 'initial');

  return {
    getSnapshot: () => readLobbySnapshot(normalizedCode),
    publishSnapshot,
    emitEvent,
    syncSnapshot,
    close: () => {
      if (closed) return;
      closed = true;
      window.removeEventListener('storage', onStorage);
      if (channel) {
        channel.close();
        channel = null;
      }
    },
  };
}
