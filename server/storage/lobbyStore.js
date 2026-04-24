const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_LENGTH = 6;
const MIN_PLAYERS = 3;
const MAX_RECENT_PROMPT_KEYS = 6;

const SERVER_PROMPT_CATEGORIES = [
  {
    id: 'sports',
    name: 'Sports',
    emoji: '🏅',
    prompts: [
      { hint: 'Sports Showdown', main: 'Basketball', imposter: 'Baseball' },
      { hint: 'Sports Showdown', main: 'Football', imposter: 'Rugby' },
      { hint: 'Sports Showdown', main: 'Tennis', imposter: 'Badminton' },
      { hint: 'Sports Showdown', main: 'Boxing', imposter: 'MMA' },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    emoji: '🍕',
    prompts: [
      { hint: 'Food Face-Off', main: 'Pizza', imposter: 'Calzone' },
      { hint: 'Food Face-Off', main: 'Burger', imposter: 'Hot Dog' },
      { hint: 'Food Face-Off', main: 'Sushi', imposter: 'Poke Bowl' },
      { hint: 'Food Face-Off', main: 'Waffles', imposter: 'Pancakes' },
    ],
  },
  {
    id: 'movies',
    name: 'Movies',
    emoji: '🎬',
    prompts: [
      { hint: 'Movie Clash', main: 'Inception', imposter: 'Memento' },
      { hint: 'Movie Clash', main: 'Titanic', imposter: 'The Notebook' },
      { hint: 'Movie Clash', main: 'The Matrix', imposter: 'Blade Runner' },
      { hint: 'Movie Clash', main: 'Shrek', imposter: 'Toy Story' },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    emoji: '🎵',
    prompts: [
      { hint: 'Music Battle', main: 'Nirvana', imposter: 'Foo Fighters' },
      { hint: 'Music Battle', main: 'Metallica', imposter: 'Megadeth' },
      { hint: 'Music Battle', main: 'Drake', imposter: 'Kendrick Lamar' },
      { hint: 'Music Battle', main: 'Adele', imposter: 'Sam Smith' },
    ],
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🌍',
    prompts: [
      { hint: 'Place Swap', main: 'London', imposter: 'Manchester' },
      { hint: 'Place Swap', main: 'Paris', imposter: 'Berlin' },
      { hint: 'Place Swap', main: 'Airport', imposter: 'Train Station' },
      { hint: 'Place Swap', main: 'Beach', imposter: 'Waterpark' },
    ],
  },
];

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

function shuffle(items = []) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function pickRandom(items = []) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function buildAuthoritativeRound(players = [], roundNumber = 1, recentPromptKeys = []) {
  if (!players.length) return null;
  const category = pickRandom(SERVER_PROMPT_CATEGORIES);
  if (!category?.prompts?.length) return null;
  const promptOptions = category.prompts.map((prompt, index) => ({
    key: `prompt::${category.id}::${index}`,
    prompt,
  }));
  const filteredPromptOptions = promptOptions.filter((option) => !recentPromptKeys.includes(option.key));
  const selected = pickRandom(filteredPromptOptions.length ? filteredPromptOptions : promptOptions);
  if (!selected?.prompt) return null;
  const liarIds = shuffle(players)
    .slice(0, Math.max(1, Math.min(1, players.length - 1)))
    .map((player) => player.id);
  return {
    id: randomId('round'),
    createdAt: nowIso(),
    roundNumber,
    roundTypeId: 'prompt',
    roundTypeName: 'Hot Seat',
    roundTypeTagline: 'Classic clue-slinging. Keep it vague, keep it clean.',
    categoryId: category.id,
    categoryLabel: category.name,
    categoryEmoji: category.emoji,
    promptKey: selected.key,
    hint: selected.prompt.hint,
    commonPrompt: selected.prompt.main,
    imposterPrompt: selected.prompt.imposter,
    aiPrompt: null,
    mediaPreviewLabel: null,
    mediaPackId: null,
    isAdultPrompt: false,
    bannedWords: [],
    mode: 'classic',
    imposterIds: liarIds,
    chooserId: pickRandom(players)?.id || players[0].id,
    leaderId: pickRandom(players)?.id || players[0].id,
    grillData: {
      questionsPerPlayer: 0,
      micEnabled: false,
      ttsEnabled: false,
      transcript: [],
      askedCounts: {},
    },
    mediaByPlayerId: {},
    promptsByPlayerId: Object.fromEntries(
      players.map((player) => [
        player.id,
        liarIds.includes(player.id) ? selected.prompt.imposter : selected.prompt.main,
      ])
    ),
  };
}

function toPublicRound(round) {
  if (!round || typeof round !== 'object') return null;
  const { promptsByPlayerId, mediaByPlayerId, ...publicRound } = round;
  return publicRound;
}

function toPrivateRoundForPlayer(round, playerId) {
  if (!round || !playerId) return null;
  const prompt = round.promptsByPlayerId?.[playerId];
  if (!prompt) return null;
  return {
    roundId: round.id,
    roundNumber: round.roundNumber,
    prompt,
    mediaSrc: round.mediaByPlayerId?.[playerId] || null,
    isImposter: Boolean((round.imposterIds || []).includes(playerId)),
    hint: round.hint,
    roundTypeId: round.roundTypeId,
    roundTypeName: round.roundTypeName,
    categoryLabel: round.categoryLabel,
    categoryEmoji: round.categoryEmoji,
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
  const roundCounterRaw = Number(rawLobby.roundCounter);
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
    activeRound: rawLobby.activeRound && typeof rawLobby.activeRound === 'object' ? rawLobby.activeRound : null,
    roundCounter: Number.isFinite(roundCounterRaw)
      ? Math.max(0, Math.floor(roundCounterRaw))
      : (Number(rawLobby.activeRound?.roundNumber) || 0),
    recentPromptKeys: Array.isArray(rawLobby.recentPromptKeys)
      ? rawLobby.recentPromptKeys.filter(Boolean).slice(-MAX_RECENT_PROMPT_KEYS)
      : [],
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

function buildStoreCore({
  kind,
  sessionTokenTtlMs,
  ensureUniqueCode,
  readLobbyRaw,
  writeLobbyRaw,
  removeLobbyRaw,
  shutdown = async () => {},
}) {
  const helpers = createStoreHelpers({ sessionTokenTtlMs });

  async function getLobby(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return null;
    const raw = await readLobbyRaw(normalized);
    return hydrateLobby(raw);
  }

  async function saveLobby(nextLobby) {
    const lobby = hydrateLobby(nextLobby);
    if (!lobby) return null;
    lobby.updatedAt = nowIso();
    await writeLobbyRaw(lobby.code, lobby);
    return lobby;
  }

  async function deleteLobby(code) {
    const normalized = normalizeCode(code);
    if (!normalized) return false;
    return removeLobbyRaw(normalized);
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
      activeRound: null,
      roundCounter: 0,
      recentPromptKeys: [],
    };
    lobby.playerSessions[host.id] = {
      token: randomSessionToken(),
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionTokenTtlMs,
    };
    await writeLobbyRaw(code, lobby);
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
    const sessionToken = helpers.issueOrReuseSessionToken(lobby, merged.id);
    await saveLobby(lobby);
    return { lobby, player: merged, sessionToken };
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

  function validatePlayerSession(lobby, sessionToken, expectedPlayerId = '') {
    const providedToken = String(sessionToken || '').trim();
    if (!providedToken) return { error: 'session-token-required' };
    const tokenPlayerId = helpers.findPlayerIdBySessionToken(lobby, providedToken);
    if (!tokenPlayerId) return { error: 'invalid-session-token' };
    if (expectedPlayerId && tokenPlayerId !== expectedPlayerId) return { error: 'invalid-session-token' };
    const sessionEntry = lobby.playerSessions?.[tokenPlayerId] || null;
    if (!sessionEntry || Number(sessionEntry.expiresAt) <= Date.now()) {
      if (lobby.playerSessions) delete lobby.playerSessions[tokenPlayerId];
      return { error: 'session-token-expired' };
    }
    const player = lobby.players.find((entry) => entry.id === tokenPlayerId);
    if (!player) return { error: 'session-player-missing' };
    return { playerId: tokenPlayerId, player };
  }

  async function startLobby(code, hostClientId, sessionToken = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
    const hostPlayer = lobby.players.find((player) => player.isHost);
    if (!hostPlayer) return { error: 'host-only' };
    const hostValidation = validatePlayerSession(lobby, sessionToken, hostPlayer.id);
    if (hostValidation.error === 'session-token-required') return { error: 'host-session-token-required' };
    if (hostValidation.error === 'invalid-session-token') return { error: 'token-rotation-required' };
    if (hostValidation.error === 'session-token-expired') {
      await saveLobby(lobby);
      return { error: 'session-token-expired' };
    }
    if (hostValidation.error) return { error: hostValidation.error };
    if (lobby.players.length < MIN_PLAYERS) return { error: 'not-enough-players' };
    if (lobby.status !== 'started') {
      lobby.status = 'started';
      lobby.startedAt = nowIso();
      lobby.startedRevision = randomId('start');
    }
    if (!lobby.activeRound) {
      const firstRound = buildAuthoritativeRound(lobby.players, 1, lobby.recentPromptKeys || []);
      if (!firstRound) return { error: 'round-generation-failed' };
      lobby.activeRound = firstRound;
      lobby.roundCounter = 1;
      lobby.recentPromptKeys = [...(lobby.recentPromptKeys || []), firstRound.promptKey]
        .filter(Boolean)
        .slice(-MAX_RECENT_PROMPT_KEYS);
    }
    const rotatedHostToken = helpers.rotateSessionTokenForPlayer(lobby, hostPlayer.id);
    await saveLobby(lobby);
    return { lobby, sessionToken: rotatedHostToken };
  }

  async function createNextRound(code, hostClientId, sessionToken = '') {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.status !== 'started') return { error: 'lobby-not-started' };
    if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
    const hostPlayer = lobby.players.find((player) => player.isHost);
    if (!hostPlayer) return { error: 'host-only' };
    const hostValidation = validatePlayerSession(lobby, sessionToken, hostPlayer.id);
    if (hostValidation.error === 'session-token-required') return { error: 'host-session-token-required' };
    if (hostValidation.error === 'invalid-session-token') return { error: 'token-rotation-required' };
    if (hostValidation.error === 'session-token-expired') {
      await saveLobby(lobby);
      return { error: 'session-token-expired' };
    }
    if (hostValidation.error) return { error: hostValidation.error };

    const nextRoundNumber = Math.max(1, Number(lobby.roundCounter || 0) + 1);
    const nextRound = buildAuthoritativeRound(lobby.players, nextRoundNumber, lobby.recentPromptKeys || []);
    if (!nextRound) return { error: 'round-generation-failed' };
    lobby.activeRound = nextRound;
    lobby.roundCounter = nextRoundNumber;
    lobby.recentPromptKeys = [...(lobby.recentPromptKeys || []), nextRound.promptKey]
      .filter(Boolean)
      .slice(-MAX_RECENT_PROMPT_KEYS);

    const rotatedHostToken = helpers.rotateSessionTokenForPlayer(lobby, hostPlayer.id);
    await saveLobby(lobby);
    return {
      lobby,
      round: toPublicRound(nextRound),
      sessionToken: rotatedHostToken,
    };
  }

  async function getCurrentRound(code) {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.status !== 'started') return { error: 'lobby-not-started' };
    return {
      lobby,
      round: toPublicRound(lobby.activeRound),
    };
  }

  async function getPlayerRoundView(code, playerId, sessionToken) {
    const lobby = await getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.status !== 'started') return { error: 'lobby-not-started' };
    if (!lobby.activeRound) return { error: 'round-not-found' };
    const normalizedPlayerId = String(playerId || '').trim();
    if (!normalizedPlayerId) return { error: 'player-id-required' };
    const validation = validatePlayerSession(lobby, sessionToken, normalizedPlayerId);
    if (validation.error === 'session-token-expired') {
      await saveLobby(lobby);
      return { error: 'session-token-expired' };
    }
    if (validation.error) return { error: validation.error };
    const privateRound = toPrivateRoundForPlayer(lobby.activeRound, normalizedPlayerId);
    if (!privateRound) return { error: 'round-player-missing' };
    return {
      lobby,
      round: privateRound,
    };
  }

  return {
    kind,
    getLobby,
    createLobby,
    upsertPlayer,
    removePlayer,
    resumePlayer,
    startLobby,
    createNextRound,
    getCurrentRound,
    getPlayerRoundView,
    deleteLobby,
    getRoleForPlayer: helpers.getRoleForPlayer,
    shutdown,
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
    activeRound: toPublicRound(lobby.activeRound),
    activeRoundRevision: lobby.activeRound?.id || null,
    roundCounter: Number(lobby.roundCounter || 0),
  };
}

export function createInMemoryLobbyStore({ sessionTokenTtlMs = 1000 * 60 * 60 * 12 } = {}) {
  const lobbies = new Map();
  async function ensureUniqueCode() {
    let attempts = 0;
    while (attempts < 50) {
      const code = generateLobbyCode();
      if (!lobbies.has(code)) return code;
      attempts += 1;
    }
    throw new Error('Unable to generate unique lobby code');
  }
  return buildStoreCore({
    kind: 'memory',
    sessionTokenTtlMs,
    ensureUniqueCode,
    readLobbyRaw: async (code) => lobbies.get(code) || null,
    writeLobbyRaw: async (code, lobby) => {
      lobbies.set(code, lobby);
    },
    removeLobbyRaw: async (code) => lobbies.delete(code),
    shutdown: async () => {},
  });
}

export function createRedisLobbyStore({ redis, keyPrefix = 'pof:lobby', sessionTokenTtlMs = 1000 * 60 * 60 * 12 } = {}) {
  if (!redis) throw new Error('Redis client is required');
  function lobbyKey(code) {
    return `${keyPrefix}:${normalizeCode(code)}`;
  }
  async function ensureUniqueCode() {
    let attempts = 0;
    while (attempts < 50) {
      const code = generateLobbyCode();
      const exists = await redis.exists(lobbyKey(code));
      if (!exists) return code;
      attempts += 1;
    }
    throw new Error('Unable to generate unique lobby code');
  }
  return buildStoreCore({
    kind: 'redis',
    sessionTokenTtlMs,
    ensureUniqueCode,
    readLobbyRaw: async (code) => {
      const raw = await redis.get(lobbyKey(code));
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    writeLobbyRaw: async (code, lobby) => {
      await redis.set(lobbyKey(code), JSON.stringify(lobby));
    },
    removeLobbyRaw: async (code) => {
      const removed = await redis.del(lobbyKey(code));
      return removed > 0;
    },
    shutdown: async () => {
      try {
        await redis.quit();
      } catch {}
    },
  });
}

