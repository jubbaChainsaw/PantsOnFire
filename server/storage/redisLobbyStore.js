const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_LENGTH = 6;

function randomId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function randomSessionToken() {
  return randomId('sess');
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCode(raw = '') {
  return String(raw).trim().toUpperCase();
}

function generateLobbyCode() {
  let code = '';
  for (let i = 0; i < LOBBY_CODE_LENGTH; i += 1) {
    code += LOBBY_CODE_CHARS[Math.floor(Math.random() * LOBBY_CODE_CHARS.length)];
  }
  return code;
}

function sanitizePlayer(raw = {}, { fallbackName = 'Player', forceHost = false } = {}) {
  return {
    id: String(raw.id || randomId('opl')),
    name: String(raw.name || fallbackName).trim() || fallbackName,
    clientId: String(raw.clientId || ''),
    isHost: forceHost ? true : Boolean(raw.isHost),
    joinedAt: raw.joinedAt || nowIso(),
  };
}

function normalizeLobby(lobby) {
  if (!lobby || typeof lobby !== 'object') return null;
  return {
    code: normalizeCode(lobby.code),
    status: lobby.status === 'started' ? 'started' : 'waiting',
    hostName: String(lobby.hostName || 'Host'),
    hostClientId: String(lobby.hostClientId || ''),
    createdAt: lobby.createdAt || nowIso(),
    updatedAt: lobby.updatedAt || nowIso(),
    startedAt: lobby.startedAt || null,
    startedRevision: lobby.startedRevision || null,
    players: Array.isArray(lobby.players) ? lobby.players : [],
    playerSessions: lobby.playerSessions && typeof lobby.playerSessions === 'object' ? lobby.playerSessions : {},
  };
}

export function createRedisLobbyStore(redisClient, {
  sessionTokenTtlMs,
  namespace = 'pof:lobby',
} = {}) {
  if (!redisClient) throw new Error('redis-client-required');
  const client = redisClient;

  const lockPrefix = `${namespace}:lock`;
  const lobbyPrefix = `${namespace}:data`;
  const indexKey = `${namespace}:codes`;

  const keyForLobby = (code) => `${lobbyPrefix}:${normalizeCode(code)}`;
  const keyForLock = (code) => `${lockPrefix}:${normalizeCode(code)}`;
  const acquireLock = async (code, ttlMs = 3000) => {
    const lockKey = keyForLock(code);
    const token = randomId('lock');
    const ok = await client.set(lockKey, token, { NX: true, PX: ttlMs });
    if (ok !== 'OK') return null;
    return { lockKey, token };
  };
  const releaseLock = async (lock) => {
    if (!lock) return;
    try {
      const current = await client.get(lock.lockKey);
      if (current === lock.token) await client.del(lock.lockKey);
    } catch {}
  };

  const readLobby = async (code) => {
    const raw = await client.get(keyForLobby(code));
    if (!raw) return null;
    try {
      return normalizeLobby(JSON.parse(raw));
    } catch {
      return null;
    }
  };

  const writeLobby = async (lobby) => {
    const normalized = normalizeLobby(lobby);
    if (!normalized) return null;
    normalized.updatedAt = nowIso();
    await client.set(keyForLobby(normalized.code), JSON.stringify(normalized));
    await client.sAdd(indexKey, normalized.code);
    return normalized;
  };

  const deleteLobby = async (code) => {
    const normalizedCode = normalizeCode(code);
    const lock = await acquireLock(normalizedCode);
    if (!lock) return false;
    try {
      const deleted = await client.del(keyForLobby(normalizedCode));
      await client.sRem(indexKey, normalizedCode);
      return deleted > 0;
    } finally {
      await releaseLock(lock);
    }
  };

  async function ensureUniqueCode() {
    let attempts = 0;
    while (attempts < 80) {
      const code = generateLobbyCode();
      const exists = await client.exists(keyForLobby(code));
      if (!exists) return code;
      attempts += 1;
    }
    throw new Error('unable-to-generate-unique-lobby-code');
  }

  function issueOrReuseSessionToken(lobby, playerId) {
    if (!lobby.playerSessions) lobby.playerSessions = {};
    const existing = lobby.playerSessions[playerId];
    if (existing?.token && Number(existing.expiresAt) > Date.now()) return existing.token;
    const token = randomSessionToken();
    lobby.playerSessions[playerId] = {
      token,
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionTokenTtlMs,
    };
    return token;
  }

  function rotateSessionTokenForPlayer(lobby, playerId) {
    if (!lobby?.playerSessions || !playerId) return '';
    const token = randomSessionToken();
    lobby.playerSessions[playerId] = {
      token,
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionTokenTtlMs,
    };
    return token;
  }

  function findPlayerIdBySessionToken(lobby, sessionToken) {
    if (!lobby?.playerSessions || !sessionToken) return null;
    return Object.keys(lobby.playerSessions).find((playerId) => lobby.playerSessions[playerId]?.token === sessionToken) || null;
  }

  async function withLobbyLock(code, callback) {
    const normalizedCode = normalizeCode(code);
    let attempts = 0;
    while (attempts < 15) {
      const lock = await acquireLock(normalizedCode);
      if (!lock) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, 30));
        continue;
      }
      try {
        const lobby = await readLobby(normalizedCode);
        const result = await callback(lobby);
        return result;
      } finally {
        await releaseLock(lock);
      }
    }
    return { error: 'lock-timeout' };
  }

  async function createLobby({ hostPlayer, hostName }) {
    const code = await ensureUniqueCode();
    const createdAt = nowIso();
    const host = sanitizePlayer(hostPlayer, { fallbackName: hostName || 'Host', forceHost: true });
    const lobby = {
      code,
      status: 'waiting',
      hostName: hostName || host.name || 'Host',
      hostClientId: host.clientId || '',
      createdAt,
      updatedAt: createdAt,
      startedAt: null,
      startedRevision: null,
      players: [host],
      playerSessions: {},
    };
    lobby.playerSessions[host.id] = {
      token: randomSessionToken(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionTokenTtlMs,
    };
    const savedLobby = await writeLobby(lobby);
    return {
      lobby: savedLobby,
      player: host,
      sessionToken: lobby.playerSessions[host.id].token,
    };
  }

  async function getLobby(code) {
    return readLobby(code);
  }

  async function upsertPlayer(code, playerInput) {
    return withLobbyLock(code, async (lobby) => {
      if (!lobby) return { error: 'not-found' };
      if (lobby.status === 'started') return { error: 'already-started' };
      const incoming = sanitizePlayer(playerInput);
      const existingByClient = lobby.players.find((player) => player.clientId && player.clientId === incoming.clientId);
      const existingById = existingByClient || lobby.players.find((player) => player.id === incoming.id);
      const playerId = existingById?.id || incoming.id;
      const merged = {
        ...incoming,
        id: playerId,
        isHost: existingById?.isHost || Boolean(incoming.isHost),
        joinedAt: existingById?.joinedAt || incoming.joinedAt || nowIso(),
      };
      lobby.players = lobby.players.filter((player) => player.id !== playerId && player.clientId !== incoming.clientId);
      lobby.players.push(merged);
      const sessionToken = issueOrReuseSessionToken(lobby, merged.id);
      const saved = await writeLobby(lobby);
      return { lobby: saved, player: merged, sessionToken };
    });
  }

  async function removePlayer(code, playerId) {
    return withLobbyLock(code, async (lobby) => {
      if (!lobby) return { error: 'not-found' };
      if (lobby.playerSessions) delete lobby.playerSessions[playerId];
      lobby.players = lobby.players.filter((player) => player.id !== playerId);
      if (!lobby.players.length) {
        await client.del(keyForLobby(lobby.code));
        await client.sRem(indexKey, lobby.code);
        return { lobby: null };
      }
      const hostStillPresent = lobby.players.some((player) => player.clientId === lobby.hostClientId && player.isHost);
      if (!hostStillPresent) {
        await client.del(keyForLobby(lobby.code));
        await client.sRem(indexKey, lobby.code);
        return { lobby: null };
      }
      const saved = await writeLobby(lobby);
      return { lobby: saved };
    });
  }

  async function resumePlayer(code, sessionToken, clientId = '') {
    return withLobbyLock(code, async (lobby) => {
      if (!lobby) return { error: 'not-found' };
      const token = String(sessionToken || '').trim();
      if (!token) return { error: 'session-token-required' };
      const playerId = findPlayerIdBySessionToken(lobby, token);
      if (!playerId) return { error: 'invalid-session-token' };
      const sessionEntry = lobby.playerSessions?.[playerId] || null;
      if (!sessionEntry || Number(sessionEntry.expiresAt) <= Date.now()) {
        if (lobby.playerSessions) delete lobby.playerSessions[playerId];
        await writeLobby(lobby);
        return { error: 'lobby-session-expired' };
      }
      const player = lobby.players.find((entry) => entry.id === playerId);
      if (!player) {
        if (lobby.playerSessions) delete lobby.playerSessions[playerId];
        await writeLobby(lobby);
        return { error: 'session-player-missing' };
      }
      if (clientId && player.clientId !== clientId) {
        player.clientId = clientId;
        if (player.isHost) lobby.hostClientId = clientId;
      }
      const nextToken = rotateSessionTokenForPlayer(lobby, playerId);
      const saved = await writeLobby(lobby);
      return { lobby: saved, player, sessionToken: nextToken };
    });
  }

  async function startLobby(code, hostClientId, hostSessionToken = '') {
    return withLobbyLock(code, async (lobby) => {
      if (!lobby) return { error: 'not-found' };
      if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
      const hostPlayer = lobby.players.find((player) => player.isHost);
      if (!hostPlayer) return { error: 'host-only' };
      const normalizedHostToken = String(hostSessionToken || '').trim();
      if (!normalizedHostToken) return { error: 'host-session-token-required' };
      const hostSession = lobby.playerSessions?.[hostPlayer.id] || null;
      if (
        !hostSession
        || hostSession.token !== normalizedHostToken
        || Number(hostSession.expiresAt) <= Date.now()
      ) {
        return { error: 'token-rotation-required' };
      }
      if (lobby.players.length < MIN_PLAYERS) return { error: 'not-enough-players' };
      if (lobby.status !== 'started') {
        lobby.status = 'started';
        lobby.startedAt = nowIso();
        lobby.startedRevision = randomId('start');
      }
      const rotatedHostToken = rotateSessionTokenForPlayer(lobby, hostPlayer.id);
      const saved = await writeLobby(lobby);
      return { lobby: saved, sessionToken: rotatedHostToken };
    });
  }

  return {
    type: 'redis',
    createLobby,
    getLobby,
    deleteLobby,
    upsertPlayer,
    removePlayer,
    resumePlayer,
    startLobby,
  };
}
