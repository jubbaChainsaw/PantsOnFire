const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_LENGTH = 6;

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function randomSessionToken() {
  return randomId('sess');
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

function hydrateLobby(rawLobby) {
  if (!rawLobby || typeof rawLobby !== 'object') return null;
  const code = normalizeCode(rawLobby.code);
  if (!code) return null;
  const createdAt = rawLobby.createdAt || nowIso();
  const players = Array.isArray(rawLobby.players) ? rawLobby.players : [];
  const playerSessions = rawLobby.playerSessions && typeof rawLobby.playerSessions === 'object'
    ? rawLobby.playerSessions
    : {};
  return {
    code,
    status: rawLobby.status === 'started' ? 'started' : 'waiting',
    hostName: String(rawLobby.hostName || 'Host'),
    hostClientId: String(rawLobby.hostClientId || ''),
    createdAt,
    updatedAt: rawLobby.updatedAt || createdAt,
    startedAt: rawLobby.startedAt || null,
    startedRevision: rawLobby.startedRevision || null,
    players,
    playerSessions,
  };
}

function createStoreHelpers({ sessionTokenTtlMs }) {
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

  function findPlayerIdBySessionToken(lobby, sessionToken) {
    if (!lobby?.playerSessions || !sessionToken) return null;
    return Object.keys(lobby.playerSessions)
      .find((playerId) => lobby.playerSessions[playerId]?.token === sessionToken) || null;
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

  function getRoleForPlayer(lobby, playerId) {
    if (!lobby || !playerId) return 'player';
    const player = lobby.players.find((entry) => entry.id === playerId);
    return player?.isHost ? 'host' : 'player';
  }

  return {
    issueOrReuseSessionToken,
    findPlayerIdBySessionToken,
    rotateSessionTokenForPlayer,
    getRoleForPlayer,
  };
}

export function toClientSnapshot(lobby) {
  if (!lobby) return null;
  return {
    code: lobby.code,
    status: lobby.status,
    hostName: lobby.hostName,
    hostClientId: lobby.hostClientId,
    createdAt: lobby.createdAt,
    updatedAt: lobby.updatedAt,
    startedAt: lobby.startedAt || null,
    startedRevision: lobby.startedRevision || null,
    players: lobby.players,
  };
}

export function createInMemoryLobbyStore({ sessionTokenTtlMs = 1000 * 60 * 60 * 12 } = {}) {
  const helpers = createStoreHelpers({ sessionTokenTtlMs });
  const lobbies = new Map();

  function ensureUniqueCode() {
    let attempts = 0;
    while (attempts < 50) {
      const code = generateLobbyCode();
      if (!lobbies.has(code)) return code;
      attempts += 1;
    }
    throw new Error('Unable to generate unique lobby code');
  }

  async function getLobby(code) {
    return lobbies.get(normalizeCode(code)) || null;
  }

  async function saveLobby(nextLobby) {
    const lobby = hydrateLobby(nextLobby);
    if (!lobby) return null;
    lobby.updatedAt = nowIso();
    lobbies.set(lobby.code, lobby);
    return lobby;
  }

  async function deleteLobby(code) {
    return lobbies.delete(normalizeCode(code));
  }

  async function createLobby({ hostPlayer, hostName }) {
    const code = ensureUniqueCode();
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
    lobbies.set(code, lobby);
    return {
      lobby,
      player: host,
      sessionToken: lobby.playerSessions[host.id].token,
    };
  }

  async function upsertPlayer(code, playerInput) {
    const lobby = await getLobby(code);
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
    await saveLobby(lobby);
    return { lobby, player: merged, sessionToken: helpers.issueOrReuseSessionToken(lobby, merged.id) };
  }

  async function removePlayer(code, playerId) {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.playerSessions) delete lobby.playerSessions[playerId];
    lobby.players = lobby.players.filter((player) => player.id !== playerId);
    if (!lobby.players.length) {
      await deleteLobby(code);
      return { lobby: null };
    }
    const hostStillPresent = lobby.players.some((player) => player.clientId === lobby.hostClientId && player.isHost);
    if (!hostStillPresent) {
      await deleteLobby(code);
      return { lobby: null };
    }
    await saveLobby(lobby);
    return { lobby };
  }

  async function resumePlayer(code, sessionToken, clientId = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    const token = String(sessionToken || '').trim();
    if (!token) return { error: 'session-token-required' };
    const playerId = helpers.findPlayerIdBySessionToken(lobby, token);
    if (!playerId) return { error: 'invalid-session-token' };
    const sessionEntry = lobby.playerSessions?.[playerId] || null;
    if (!sessionEntry || Number(sessionEntry.expiresAt) <= Date.now()) {
      if (lobby.playerSessions) delete lobby.playerSessions[playerId];
      await saveLobby(lobby);
      return { error: 'lobby-session-expired' };
    }
    const player = lobby.players.find((entry) => entry.id === playerId);
    if (!player) {
      if (lobby.playerSessions) delete lobby.playerSessions[playerId];
      await saveLobby(lobby);
      return { error: 'session-player-missing' };
    }
    if (clientId && player.clientId !== clientId) {
      player.clientId = clientId;
      if (player.isHost) lobby.hostClientId = clientId;
    }
    const nextToken = helpers.rotateSessionTokenForPlayer(lobby, playerId);
    await saveLobby(lobby);
    return { lobby, player, sessionToken: nextToken };
  }

  async function startLobby(code, hostClientId, sessionToken = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
    const hostPlayer = lobby.players.find((player) => player.isHost);
    if (!hostPlayer) return { error: 'host-only' };
    const expectedHostToken = helpers.issueOrReuseSessionToken(lobby, hostPlayer.id);
    const providedToken = String(sessionToken || '').trim();
    if (!providedToken) return { error: 'host-session-token-required' };
    if (providedToken !== expectedHostToken) return { error: 'token-rotation-required' };
    const hostSession = lobby.playerSessions?.[hostPlayer.id] || null;
    if (!hostSession || Number(hostSession.expiresAt) <= Date.now()) {
      if (lobby.playerSessions) delete lobby.playerSessions[hostPlayer.id];
      await saveLobby(lobby);
      return { error: 'session-token-expired' };
    }
    if (lobby.players.length < 3) return { error: 'not-enough-players' };
    if (lobby.status !== 'started') {
      lobby.status = 'started';
      lobby.startedAt = nowIso();
      lobby.startedRevision = randomId('start');
    }
    const rotatedHostToken = helpers.rotateSessionTokenForPlayer(lobby, hostPlayer.id);
    await saveLobby(lobby);
    return { lobby, sessionToken: rotatedHostToken };
  }

  return {
    kind: 'memory',
    getLobby,
    createLobby,
    upsertPlayer,
    removePlayer,
    resumePlayer,
    startLobby,
    deleteLobby,
    getRoleForPlayer: helpers.getRoleForPlayer,
    shutdown: async () => {},
  };
}

export function createRedisLobbyStore({ redis, keyPrefix = 'pof:lobby', sessionTokenTtlMs = 1000 * 60 * 60 * 12 } = {}) {
  if (!redis) throw new Error('Redis client is required');
  const helpers = createStoreHelpers({ sessionTokenTtlMs });

  function lobbyKey(code) {
    return `${keyPrefix}:${normalizeCode(code)}`;
  }

  async function listActiveCodes() {
    const pattern = `${keyPrefix}:*`;
    const keys = await redis.keys(pattern);
    return keys
      .map((key) => key.slice(`${keyPrefix}:`.length))
      .map((code) => normalizeCode(code))
      .filter(Boolean);
  }

  async function ensureUniqueCode() {
    let attempts = 0;
    const existingCodes = new Set(await listActiveCodes());
    while (attempts < 50) {
      const code = generateLobbyCode();
      if (!existingCodes.has(code)) return code;
      attempts += 1;
    }
    throw new Error('Unable to generate unique lobby code');
  }

  async function getLobby(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    const raw = await redis.get(lobbyKey(normalized));
    if (!raw) return null;
    try {
      return hydrateLobby(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async function saveLobby(nextLobby) {
    const lobby = hydrateLobby(nextLobby);
    if (!lobby) return null;
    lobby.updatedAt = nowIso();
    await redis.set(lobbyKey(lobby.code), JSON.stringify(lobby));
    return lobby;
  }

  async function deleteLobby(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return false;
    const removed = await redis.del(lobbyKey(normalized));
    return removed > 0;
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
    await redis.set(lobbyKey(code), JSON.stringify(lobby));
    return {
      lobby,
      player: host,
      sessionToken: lobby.playerSessions[host.id].token,
    };
  }

  async function upsertPlayer(code, playerInput) {
    const lobby = await getLobby(code);
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
    await saveLobby(lobby);
    return { lobby, player: merged, sessionToken: helpers.issueOrReuseSessionToken(lobby, merged.id) };
  }

  async function removePlayer(code, playerId) {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.playerSessions) delete lobby.playerSessions[playerId];
    lobby.players = lobby.players.filter((player) => player.id !== playerId);
    if (!lobby.players.length) {
      await deleteLobby(code);
      return { lobby: null };
    }
    const hostStillPresent = lobby.players.some((player) => player.clientId === lobby.hostClientId && player.isHost);
    if (!hostStillPresent) {
      await deleteLobby(code);
      return { lobby: null };
    }
    await saveLobby(lobby);
    return { lobby };
  }

  async function resumePlayer(code, sessionToken, clientId = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    const token = String(sessionToken || '').trim();
    if (!token) return { error: 'session-token-required' };
    const playerId = helpers.findPlayerIdBySessionToken(lobby, token);
    if (!playerId) return { error: 'invalid-session-token' };
    const sessionEntry = lobby.playerSessions?.[playerId] || null;
    if (!sessionEntry || Number(sessionEntry.expiresAt) <= Date.now()) {
      if (lobby.playerSessions) delete lobby.playerSessions[playerId];
      await saveLobby(lobby);
      return { error: 'lobby-session-expired' };
    }
    const player = lobby.players.find((entry) => entry.id === playerId);
    if (!player) {
      if (lobby.playerSessions) delete lobby.playerSessions[playerId];
      await saveLobby(lobby);
      return { error: 'session-player-missing' };
    }
    if (clientId && player.clientId !== clientId) {
      player.clientId = clientId;
      if (player.isHost) lobby.hostClientId = clientId;
    }
    const nextToken = helpers.rotateSessionTokenForPlayer(lobby, playerId);
    await saveLobby(lobby);
    return { lobby, player, sessionToken: nextToken };
  }

  async function startLobby(code, hostClientId, sessionToken = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
    const hostPlayer = lobby.players.find((player) => player.isHost);
    if (!hostPlayer) return { error: 'host-only' };
    const expectedHostToken = helpers.issueOrReuseSessionToken(lobby, hostPlayer.id);
    const providedToken = String(sessionToken || '').trim();
    if (!providedToken) return { error: 'host-session-token-required' };
    if (providedToken !== expectedHostToken) return { error: 'token-rotation-required' };
    const hostSession = lobby.playerSessions?.[hostPlayer.id] || null;
    if (!hostSession || Number(hostSession.expiresAt) <= Date.now()) {
      if (lobby.playerSessions) delete lobby.playerSessions[hostPlayer.id];
      await saveLobby(lobby);
      return { error: 'session-token-expired' };
    }
    if (lobby.players.length < 3) return { error: 'not-enough-players' };
    if (lobby.status !== 'started') {
      lobby.status = 'started';
      lobby.startedAt = nowIso();
      lobby.startedRevision = randomId('start');
    }
    const rotatedHostToken = helpers.rotateSessionTokenForPlayer(lobby, hostPlayer.id);
    await saveLobby(lobby);
    return { lobby, sessionToken: rotatedHostToken };
  }

  return {
    kind: 'redis',
    getLobby,
    createLobby,
    upsertPlayer,
    removePlayer,
    resumePlayer,
    startLobby,
    deleteLobby,
    getRoleForPlayer: helpers.getRoleForPlayer,
    shutdown: async () => {
      try {
        await redis.quit();
      } catch {}
    },
  };
}

