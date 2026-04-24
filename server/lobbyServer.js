import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.LOBBY_SERVER_PORT || process.env.PORT || 8787);
const CLIENT_ORIGIN = process.env.LOBBY_CLIENT_ORIGIN || '*';
const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LOBBY_CODE_LENGTH = 6;
const MIN_PLAYERS = 3;

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
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

function toClientSnapshot(lobby) {
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

function createInMemoryStore() {
  /** @type {Map<string, any>} */
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

  function createLobby({ hostPlayer, hostName }) {
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
    };
    lobbies.set(code, lobby);
    return lobby;
  }

  function getLobby(code) {
    return lobbies.get(normalizeCode(code)) || null;
  }

  function replaceLobby(lobby) {
    if (!lobby?.code) return null;
    lobby.updatedAt = nowIso();
    lobbies.set(lobby.code, lobby);
    return lobby;
  }

  function deleteLobby(code) {
    return lobbies.delete(normalizeCode(code));
  }

  function upsertPlayer(code, playerInput) {
    const lobby = getLobby(code);
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
    replaceLobby(lobby);
    return { lobby, player: merged };
  }

  function removePlayer(code, playerId) {
    const lobby = getLobby(code);
    if (!lobby) return { error: 'not-found' };
    lobby.players = lobby.players.filter((player) => player.id !== playerId);
    if (!lobby.players.length) {
      deleteLobby(code);
      return { lobby: null };
    }
    const hostStillPresent = lobby.players.some((player) => player.clientId === lobby.hostClientId && player.isHost);
    if (!hostStillPresent) {
      deleteLobby(code);
      return { lobby: null };
    }
    replaceLobby(lobby);
    return { lobby };
  }

  function startLobby(code, hostClientId) {
    const lobby = getLobby(code);
    if (!lobby) return { error: 'not-found' };
    if (lobby.hostClientId !== hostClientId) return { error: 'host-only' };
    if (lobby.players.length < MIN_PLAYERS) return { error: 'not-enough-players' };
    if (lobby.status === 'started') return { lobby };
    lobby.status = 'started';
    lobby.startedAt = nowIso();
    lobby.startedRevision = randomId('start');
    replaceLobby(lobby);
    return { lobby };
  }

  return {
    createLobby,
    getLobby,
    deleteLobby,
    upsertPlayer,
    removePlayer,
    startLobby,
  };
}

const store = createInMemoryStore();
const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

function roomName(code) {
  return `lobby:${normalizeCode(code)}`;
}

function broadcastSnapshot(code, lobby) {
  io.to(roomName(code)).emit('lobby:snapshot', toClientSnapshot(lobby));
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'lobby-server', now: nowIso() });
});

app.post('/api/lobbies', (req, res) => {
  const hostName = String(req.body?.hostName || '').trim() || 'Host';
  const hostPlayer = sanitizePlayer(req.body?.hostPlayer || {}, { fallbackName: hostName, forceHost: true });
  const lobby = store.createLobby({ hostPlayer, hostName });
  broadcastSnapshot(lobby.code, lobby);
  res.status(201).json({ lobby: toClientSnapshot(lobby), player: hostPlayer });
});

app.get('/api/lobbies/:code', (req, res) => {
  const code = normalizeCode(req.params.code);
  const lobby = store.getLobby(code);
  if (!lobby) {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  res.json({ lobby: toClientSnapshot(lobby) });
});

app.post('/api/lobbies/:code/join', (req, res) => {
  const code = normalizeCode(req.params.code);
  const incoming = sanitizePlayer(req.body?.player || {});
  const joined = store.upsertPlayer(code, incoming);
  if (joined.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (joined.error === 'already-started') {
    res.status(409).json({ error: 'lobby-already-started' });
    return;
  }
  broadcastSnapshot(code, joined.lobby);
  res.json({ lobby: toClientSnapshot(joined.lobby), player: joined.player });
});

app.post('/api/lobbies/:code/leave', (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const role = String(req.body?.role || '');
  if (!playerId && role !== 'host') {
    res.status(400).json({ error: 'player-id-required' });
    return;
  }
  if (role === 'host') {
    const removed = store.deleteLobby(code);
    broadcastSnapshot(code, null);
    res.json({ removed });
    return;
  }
  const result = store.removePlayer(code, playerId);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({ lobby: toClientSnapshot(result.lobby) });
});

app.post('/api/lobbies/:code/start', (req, res) => {
  const code = normalizeCode(req.params.code);
  const hostClientId = String(req.body?.hostClientId || '');
  const result = store.startLobby(code, hostClientId);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'host-only') {
    res.status(403).json({ error: 'host-only' });
    return;
  }
  if (result.error === 'not-enough-players') {
    res.status(409).json({ error: 'not-enough-players', minPlayers: MIN_PLAYERS });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({ lobby: toClientSnapshot(result.lobby) });
});

io.on('connection', (socket) => {
  socket.on('lobby:subscribe', ({ code }) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    socket.join(roomName(normalized));
    const lobby = store.getLobby(normalized);
    socket.emit('lobby:snapshot', toClientSnapshot(lobby));
  });

  socket.on('lobby:unsubscribe', ({ code }) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    socket.leave(roomName(normalized));
  });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[lobby-server] listening on :${PORT}`);
});
