import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { AccessToken } from 'livekit-server-sdk';
import { createLobbyStore, toClientSnapshot } from './storage/index.js';

const PORT = Number(process.env.LOBBY_SERVER_PORT || process.env.PORT || 8787);
const CLIENT_ORIGINS_RAW = String(
  process.env.LOBBY_CLIENT_ORIGINS || process.env.LOBBY_CLIENT_ORIGIN || '*'
).trim();
const MIN_PLAYERS = 3;
const SESSION_TOKEN_TTL_MS = Number(process.env.LOBBY_SESSION_TOKEN_TTL_MS || 1000 * 60 * 60 * 12);
const LIVEKIT_URL = String(process.env.LIVEKIT_URL || '').trim();
const LIVEKIT_API_KEY = String(process.env.LIVEKIT_API_KEY || '').trim();
const LIVEKIT_API_SECRET = String(process.env.LIVEKIT_API_SECRET || '').trim();
const LIVEKIT_ROOM_PREFIX = String(process.env.LIVEKIT_ROOM_PREFIX || 'pof-lobby').trim() || 'pof-lobby';

function parseClientOrigins(rawValue) {
  const normalized = String(rawValue || '').trim();
  if (!normalized) return ['*'];
  const parts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : ['*'];
}

const CLIENT_ORIGINS = parseClientOrigins(CLIENT_ORIGINS_RAW);
const ALLOW_ALL_ORIGINS = CLIENT_ORIGINS.includes('*');

function isAllowedOrigin(origin) {
  if (ALLOW_ALL_ORIGINS) return true;
  if (!origin) return true;
  return CLIENT_ORIGINS.includes(origin);
}

function corsOriginHandler(origin, callback) {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('origin-not-allowed'));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCode(raw = '') {
  return String(raw).trim().toUpperCase();
}

function isLiveKitConfigured() {
  return Boolean(LIVEKIT_URL && LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}

function resolveVoiceRoomName(code) {
  return `${LIVEKIT_ROOM_PREFIX}-${normalizeCode(code)}`;
}

function validateLobbyPlayerSession(lobby, playerId, sessionToken) {
  if (!lobby) return { error: 'lobby-not-found' };
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedSessionToken = String(sessionToken || '').trim();
  if (!normalizedPlayerId) return { error: 'player-id-required' };
  if (!normalizedSessionToken) return { error: 'session-token-required' };
  const player = Array.isArray(lobby.players)
    ? lobby.players.find((entry) => String(entry?.id || '') === normalizedPlayerId)
    : null;
  if (!player) return { error: 'session-player-missing' };
  const sessionEntry = lobby.playerSessions?.[normalizedPlayerId] || null;
  if (!sessionEntry?.token || sessionEntry.token !== normalizedSessionToken) {
    return { error: 'invalid-session-token' };
  }
  if (Number(sessionEntry.expiresAt) <= Date.now()) {
    return { error: 'session-token-expired' };
  }
  return { player };
}

const { store, kind: storeKind, close: closeStore } = await createLobbyStore({
  sessionTokenTtlMs: SESSION_TOKEN_TTL_MS,
});

const app = express();
app.use(cors({ origin: corsOriginHandler }));
app.use(express.json({ limit: '1mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOriginHandler, methods: ['GET', 'POST'] },
});

function roomName(code) {
  return `lobby:${normalizeCode(code)}`;
}

function broadcastSnapshot(code, lobby) {
  io.to(roomName(code)).emit('lobby:snapshot', toClientSnapshot(lobby));
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'lobby-server',
    now: nowIso(),
    store: storeKind,
    voice: { enabled: isLiveKitConfigured() },
  });
});

app.post('/api/lobbies/:code/voice/token', async (req, res) => {
  if (!isLiveKitConfigured()) {
    res.status(503).json({ error: 'voice-not-configured' });
    return;
  }
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const lobby = await store.getLobby(code);
  if (!lobby) {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  const validation = validateLobbyPlayerSession(lobby, playerId, sessionToken);
  if (validation.error === 'player-id-required' || validation.error === 'session-token-required') {
    res.status(400).json({ error: validation.error });
    return;
  }
  if (validation.error === 'invalid-session-token' || validation.error === 'session-token-expired') {
    res.status(401).json({ error: validation.error });
    return;
  }
  if (validation.error === 'session-player-missing') {
    res.status(410).json({ error: validation.error });
    return;
  }
  const roomName = resolveVoiceRoomName(code);
  try {
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: playerId,
      name: String(validation.player?.name || 'Player'),
    });
    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await accessToken.toJwt();
    res.json({
      token,
      url: LIVEKIT_URL,
      roomName,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[lobby-server][voice] failed to issue token', error);
    res.status(500).json({ error: 'livekit-token-failed' });
  }
});

app.post('/api/lobbies', async (req, res) => {
  const hostName = String(req.body?.hostName || '').trim() || 'Host';
  const hostPlayer = req.body?.hostPlayer || {};
  const created = await store.createLobby({ hostPlayer, hostName });
  broadcastSnapshot(created.lobby.code, created.lobby);
  res.status(201).json({
    lobby: toClientSnapshot(created.lobby),
    player: created.player,
    sessionToken: created.sessionToken,
  });
});

app.get('/api/lobbies/:code', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const lobby = await store.getLobby(code);
  if (!lobby) {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  res.json({ lobby: toClientSnapshot(lobby) });
});

app.post('/api/lobbies/:code/join', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const incoming = req.body?.player || {};
  const joined = await store.upsertPlayer(code, incoming);
  if (joined.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (joined.error === 'already-started') {
    res.status(409).json({ error: 'lobby-already-started' });
    return;
  }
  if (joined.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  broadcastSnapshot(code, joined.lobby);
  res.json({
    lobby: toClientSnapshot(joined.lobby),
    player: joined.player,
    sessionToken: joined.sessionToken,
  });
});

app.post('/api/lobbies/:code/resume', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const sessionToken = String(req.body?.sessionToken || '');
  const clientId = String(req.body?.clientId || '');
  const result = await store.resumePlayer(code, sessionToken, clientId);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'session-token-required') {
    res.status(400).json({ error: 'session-token-required' });
    return;
  }
  if (result.error === 'invalid-session-token') {
    res.status(401).json({ error: 'invalid-session-token' });
    return;
  }
  if (result.error === 'session-player-missing') {
    res.status(410).json({ error: 'session-player-missing' });
    return;
  }
  if (result.error === 'lobby-session-expired') {
    res.status(410).json({ error: 'lobby-session-expired' });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({
    lobby: toClientSnapshot(result.lobby),
    player: result.player,
    role: result.player?.isHost ? 'host' : 'player',
    sessionToken: result.sessionToken,
  });
});

app.post('/api/lobbies/:code/leave', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const role = String(req.body?.role || '');
  if (!playerId) {
    res.status(400).json({ error: 'player-id-required' });
    return;
  }
  const result = await store.removePlayer(code, playerId);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  if (!result.lobby) {
    broadcastSnapshot(code, null);
    res.json({ lobby: null, removed: true });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({ lobby: toClientSnapshot(result.lobby) });
});

app.post('/api/lobbies/:code/start', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const hostClientId = String(req.body?.hostClientId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const result = await store.startLobby(code, hostClientId, sessionToken);
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
  if (result.error === 'host-session-token-required') {
    res.status(400).json({ error: 'host-session-token-required' });
    return;
  }
  if (result.error === 'token-rotation-required') {
    res.status(401).json({ error: 'token-rotation-required' });
    return;
  }
  if (result.error === 'session-token-expired') {
    res.status(401).json({ error: 'session-token-expired' });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({
    lobby: toClientSnapshot(result.lobby),
    rotatedSessionToken: result.sessionToken || '',
  });
});

app.get('/api/lobbies/:code/round', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const result = await store.getCurrentRound(code);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-not-started') {
    res.status(409).json({ error: 'lobby-not-started' });
    return;
  }
  if (result.error === 'round-not-found') {
    res.status(404).json({ error: 'round-not-found' });
    return;
  }
  res.json({
    round: result.round || null,
    activeRoundRevision: result.round?.id || null,
  });
});

app.get('/api/lobbies/:code/round/private', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.query?.playerId || '');
  const sessionToken = String(req.query?.sessionToken || '');
  const result = await store.getPlayerRoundView(code, playerId, sessionToken);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-not-started') {
    res.status(409).json({ error: 'lobby-not-started' });
    return;
  }
  if (result.error === 'round-not-found') {
    res.status(404).json({ error: 'round-not-found' });
    return;
  }
  if (result.error === 'player-id-required') {
    res.status(400).json({ error: 'player-id-required' });
    return;
  }
  if (result.error === 'session-token-required') {
    res.status(400).json({ error: 'session-token-required' });
    return;
  }
  if (result.error === 'invalid-session-token') {
    res.status(401).json({ error: 'invalid-session-token' });
    return;
  }
  if (result.error === 'session-token-expired') {
    res.status(401).json({ error: 'session-token-expired' });
    return;
  }
  if (result.error === 'session-player-missing' || result.error === 'round-player-missing') {
    res.status(410).json({ error: result.error });
    return;
  }
  res.json({
    round: result.round || null,
  });
});

app.post('/api/lobbies/:code/rounds/next', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const hostClientId = String(req.body?.hostClientId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const result = await store.createNextRound(code, hostClientId, sessionToken);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-not-started') {
    res.status(409).json({ error: 'lobby-not-started' });
    return;
  }
  if (result.error === 'host-only') {
    res.status(403).json({ error: 'host-only' });
    return;
  }
  if (result.error === 'host-session-token-required') {
    res.status(400).json({ error: 'host-session-token-required' });
    return;
  }
  if (result.error === 'token-rotation-required') {
    res.status(401).json({ error: 'token-rotation-required' });
    return;
  }
  if (result.error === 'session-token-expired') {
    res.status(401).json({ error: 'session-token-expired' });
    return;
  }
  if (result.error === 'round-generation-failed') {
    res.status(500).json({ error: 'round-generation-failed' });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  res.json({
    lobby: toClientSnapshot(result.lobby),
    round: result.round || null,
    rotatedSessionToken: result.sessionToken || '',
  });
});

app.post('/api/lobbies/:code/round/phase/advance', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const result = await store.advanceRoundPhase(code, playerId, sessionToken);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-not-started') {
    res.status(409).json({ error: 'lobby-not-started' });
    return;
  }
  if (result.error === 'round-not-found') {
    res.status(404).json({ error: 'round-not-found' });
    return;
  }
  if (result.error === 'player-id-required') {
    res.status(400).json({ error: 'player-id-required' });
    return;
  }
  if (result.error === 'session-token-required') {
    res.status(400).json({ error: 'session-token-required' });
    return;
  }
  if (result.error === 'invalid-session-token') {
    res.status(401).json({ error: 'invalid-session-token' });
    return;
  }
  if (result.error === 'session-token-expired') {
    res.status(401).json({ error: 'session-token-expired' });
    return;
  }
  if (result.error === 'session-player-missing') {
    res.status(410).json({ error: 'session-player-missing' });
    return;
  }
  if (result.error === 'phase-advance-not-allowed' || result.error === 'voting-incomplete' || result.error === 'invalid-round-phase') {
    res.status(409).json({ error: 'round-phase-not-advanceable', phase: result.phase || null });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  if (result.lobby) {
    broadcastSnapshot(code, result.lobby);
  }
  res.json({
    lobby: toClientSnapshot(result.lobby),
    round: result.round || null,
    phase: result.phase || result.round?.phase || null,
    rotatedSessionToken: result.sessionToken || '',
  });
});

app.post('/api/lobbies/:code/round/votes', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const targetId = String(req.body?.targetId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const result = await store.submitRoundVote(code, playerId, targetId, sessionToken);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-not-started') {
    res.status(409).json({ error: 'lobby-not-started' });
    return;
  }
  if (result.error === 'round-not-found') {
    res.status(404).json({ error: 'round-not-found' });
    return;
  }
  if (result.error === 'player-id-required') {
    res.status(400).json({ error: 'player-id-required' });
    return;
  }
  if (result.error === 'vote-target-required') {
    res.status(400).json({ error: 'vote-target-required' });
    return;
  }
  if (result.error === 'vote-target-invalid') {
    res.status(409).json({ error: 'invalid-vote-target' });
    return;
  }
  if (result.error === 'voting-not-active') {
    res.status(409).json({ error: 'round-phase-not-voting', phase: result.phase || null });
    return;
  }
  if (result.error === 'session-token-required') {
    res.status(400).json({ error: 'session-token-required' });
    return;
  }
  if (result.error === 'invalid-session-token') {
    res.status(401).json({ error: 'invalid-session-token' });
    return;
  }
  if (result.error === 'session-token-expired') {
    res.status(401).json({ error: 'session-token-expired' });
    return;
  }
  if (result.error === 'session-player-missing') {
    res.status(410).json({ error: 'session-player-missing' });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  if (result.lobby) {
    broadcastSnapshot(code, result.lobby);
  }
  res.json({
    lobby: toClientSnapshot(result.lobby),
    round: result.round || null,
    phase: result.phase || result.round?.phase || null,
    votingComplete: Boolean(result.votingComplete),
    results: result.results || null,
    rotatedSessionToken: result.sessionToken || '',
  });
});

io.on('connection', (socket) => {
  socket.on('lobby:subscribe', async ({ code }) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    socket.join(roomName(normalized));
    const lobby = await store.getLobby(normalized);
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
  console.log(
    `[lobby-server] listening on :${PORT} (store=${storeKind}) origins=${ALLOW_ALL_ORIGINS ? '*' : CLIENT_ORIGINS.join(',')}`
  );
});

const shutdownSignals = ['SIGINT', 'SIGTERM'];
shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    try {
      await closeStore();
    } catch {}
    process.exit(0);
  });
});
