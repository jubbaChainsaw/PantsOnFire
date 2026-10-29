import cors from 'cors';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { AccessToken } from 'livekit-server-sdk';
import { createLobbyStore, toClientSnapshot } from './storage/index.js';
import { mountEntitlementsRoutes } from './entitlementsRoutes.js';
import { mountStripeBillingRoutes, mountStripeWebhook } from './stripeBillingRoutes.js';
import { mountPoFAuthRoutes } from './pofAuthRoutes.js';
import {
  createPoFAccountStore,
  ensurePoFAccountSchema,
} from './pofAccountStore.js';
import {
  createPostgresEntitlementsStore,
  ensurePoFEntitlementsSchema,
} from './pofEntitlementsStore.js';
import {
  createPostgresPlayerProfileStore,
  ensurePoFPlayerProfileSchema,
} from './pofPlayerProfileStore.js';
import {
  createMemoryReferralStore,
  createPostgresReferralStore,
  ensurePoFReferralSchema,
} from './pofReferralStore.js';
import { mountPlayerProfileRoutes } from './playerProfileRoutes.js';
import { mountReferralRoutes } from './referralRoutes.js';
import { createReferralHooks } from './referralService.js';
import { mountAltCardUnlockRoutes } from './altCardUnlockRoutes.js';
import { resolveAuthUserFromBearer } from './resolveAuthUser.js';

const PORT = Number(process.env.LOBBY_SERVER_PORT || process.env.PORT || 8787);
const CLIENT_ORIGINS_RAW = String(
  process.env.LOBBY_CLIENT_ORIGINS || process.env.LOBBY_CLIENT_ORIGIN || '*'
).trim();
const MIN_PLAYERS = 3;
const SESSION_TOKEN_TTL_MS = Number(process.env.LOBBY_SESSION_TOKEN_TTL_MS || 1000 * 60 * 60 * 12);
const DISCONNECT_GRACE_MS = Math.max(5000, Number(process.env.LOBBY_DISCONNECT_GRACE_MS || 60_000) || 60_000);
const LIVEKIT_URL = String(process.env.LIVEKIT_URL || '').trim();
const LIVEKIT_API_KEY = String(process.env.LIVEKIT_API_KEY || '').trim();
const LIVEKIT_API_SECRET = String(process.env.LIVEKIT_API_SECRET || '').trim();
const LIVEKIT_ROOM_PREFIX = String(process.env.LIVEKIT_ROOM_PREFIX || 'pof-lobby').trim() || 'pof-lobby';

function parseClientOrigins(rawValue) {
  const normalized = String(rawValue || '').trim();
  if (!normalized) return ['*'];
  const parts = normalized
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .map((part) => {
      const withoutQuotes = part.replace(/^['"]+|['"]+$/g, '');
      // Guard against accidental value formats like "LOBBY_CLIENT_ORIGINS=https://foo"
      // that can happen when pasting env vars from docs/dashboards.
      return withoutQuotes.replace(/^[A-Z0-9_]+\s*=\s*/i, '').trim();
    })
    .filter(Boolean);
  return parts.length ? parts : ['*'];
}

const CLIENT_ORIGINS = parseClientOrigins(CLIENT_ORIGINS_RAW);
const ALLOW_ALL_ORIGINS = CLIENT_ORIGINS.includes('*');

function escapeRegex(rawValue = '') {
  return String(rawValue).replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function originMatchesRule(origin, rule) {
  const normalizedOrigin = String(origin || '').trim();
  const normalizedRule = String(rule || '').trim();
  if (!normalizedOrigin || !normalizedRule) return false;
  if (normalizedRule === '*') return true;
  if (!normalizedRule.includes('*')) return normalizedOrigin === normalizedRule;
  const regexPattern = `^${normalizedRule.split('*').map(escapeRegex).join('.*')}$`;
  try {
    return new RegExp(regexPattern).test(normalizedOrigin);
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (ALLOW_ALL_ORIGINS) return true;
  if (!origin) return true;
  return CLIENT_ORIGINS.some((rule) => originMatchesRule(origin, rule));
}

function corsOriginHandler(origin, callback) {
  callback(null, isAllowedOrigin(origin));
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

const { store, kind: storeKind, close: closeStore, redisClient } = await createLobbyStore({
  sessionTokenTtlMs: SESSION_TOKEN_TTL_MS,
});

// Minimal fixed-window rate limiter (per IP) so lobby-code guessing and join
// spam cannot run unthrottled. Swap for a shared-store limiter if the server
// is ever scaled to multiple instances.
function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);
  cleanupTimer.unref?.();
  return (req, res, next) => {
    const key = String(req.ip || req.socket?.remoteAddress || 'unknown');
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429).json({ error: 'rate-limited' });
      return;
    }
    next();
  };
}

const createLobbyLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });
const joinLobbyLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
const resumeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
const lookupLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const voiceTokenLimiter = createRateLimiter({ windowMs: 60_000, max: 12 });

// Entitlements: Postgres when DATABASE_URL is set; else Redis; else in-memory (local dev).
const entitlementsRedisPrefix = String(process.env.ENTITLEMENTS_REDIS_KEY_PREFIX || 'pof:entitlements').trim() || 'pof:entitlements';
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
let pgPool = null;
if (databaseUrl) {
  const { default: pg } = await import('pg');
  pgPool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
  await ensurePoFAccountSchema(pgPool);
  await ensurePoFEntitlementsSchema(pgPool);
  await ensurePoFPlayerProfileSchema(pgPool);
  await ensurePoFReferralSchema(pgPool);
}

const accountStore = createPoFAccountStore(pgPool);

let entitlementsStore;
if (pgPool) {
  entitlementsStore = createPostgresEntitlementsStore(pgPool);
} else if (redisClient) {
  entitlementsStore = {
    get: async (userId) => {
      const raw = await redisClient.get(`${entitlementsRedisPrefix}:${userId}`);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    set: async (userId, row) => {
      await redisClient.set(`${entitlementsRedisPrefix}:${userId}`, JSON.stringify(row));
    },
  };
} else {
  entitlementsStore = new Map();
}

const profileRedisPrefix =
  String(process.env.PROFILE_REDIS_KEY_PREFIX || 'pof:profile').trim() || 'pof:profile';
let playerProfileStore;
if (pgPool) {
  playerProfileStore = createPostgresPlayerProfileStore(pgPool);
} else if (redisClient) {
  playerProfileStore = {
    get: async (userId) => {
      const raw = await redisClient.get(`${profileRedisPrefix}:${userId}`);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    },
    set: async (userId, profile) => {
      await redisClient.set(`${profileRedisPrefix}:${userId}`, JSON.stringify(profile));
      return profile;
    },
  };
} else {
  playerProfileStore = new Map();
}

let referralStore;
if (pgPool) {
  referralStore = createPostgresReferralStore(pgPool);
} else {
  referralStore = createMemoryReferralStore();
}

const referralHooks = createReferralHooks({ referralStore, playerProfileStore });

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: corsOriginHandler }));
mountStripeWebhook(app, { store: entitlementsStore, referralHooks });
app.use(express.json({ limit: '3mb' }));
mountPoFAuthRoutes(app, { accountStore });
mountEntitlementsRoutes(app, { store: entitlementsStore, referralHooks });
mountPlayerProfileRoutes(app, { store: playerProfileStore });
mountReferralRoutes(app, { referralStore });
mountAltCardUnlockRoutes(app, { store: playerProfileStore, lobbyStore: store });
mountStripeBillingRoutes(app, { store: entitlementsStore, referralHooks });

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

const disconnectTimersByLobbyCode = new Map();
const activeSocketSubscriptionsByLobbyCode = new Map();

function clearDisconnectGraceTimer(code, playerId) {
  const normalizedCode = normalizeCode(code);
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedCode || !normalizedPlayerId) return;
  const lobbyTimers = disconnectTimersByLobbyCode.get(normalizedCode);
  if (!lobbyTimers) return;
  const existingTimer = lobbyTimers.get(normalizedPlayerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    lobbyTimers.delete(normalizedPlayerId);
  }
  if (!lobbyTimers.size) {
    disconnectTimersByLobbyCode.delete(normalizedCode);
  }
}

function registerActiveSocketSubscription(code, playerId, socketId) {
  const normalizedCode = normalizeCode(code);
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedSocketId = String(socketId || '').trim();
  if (!normalizedCode || !normalizedPlayerId || !normalizedSocketId) return;
  let lobbySubscriptions = activeSocketSubscriptionsByLobbyCode.get(normalizedCode);
  if (!lobbySubscriptions) {
    lobbySubscriptions = new Map();
    activeSocketSubscriptionsByLobbyCode.set(normalizedCode, lobbySubscriptions);
  }
  let playerSockets = lobbySubscriptions.get(normalizedPlayerId);
  if (!playerSockets) {
    playerSockets = new Set();
    lobbySubscriptions.set(normalizedPlayerId, playerSockets);
  }
  playerSockets.add(normalizedSocketId);
}

function unregisterActiveSocketSubscription(code, playerId, socketId) {
  const normalizedCode = normalizeCode(code);
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedSocketId = String(socketId || '').trim();
  if (!normalizedCode || !normalizedPlayerId || !normalizedSocketId) return;
  const lobbySubscriptions = activeSocketSubscriptionsByLobbyCode.get(normalizedCode);
  if (!lobbySubscriptions) return;
  const playerSockets = lobbySubscriptions.get(normalizedPlayerId);
  if (!playerSockets) return;
  playerSockets.delete(normalizedSocketId);
  if (!playerSockets.size) {
    lobbySubscriptions.delete(normalizedPlayerId);
  }
  if (!lobbySubscriptions.size) {
    activeSocketSubscriptionsByLobbyCode.delete(normalizedCode);
  }
}

function hasActiveSocketSubscription(code, playerId) {
  const normalizedCode = normalizeCode(code);
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedCode || !normalizedPlayerId) return false;
  const lobbySubscriptions = activeSocketSubscriptionsByLobbyCode.get(normalizedCode);
  if (!lobbySubscriptions) return false;
  const playerSockets = lobbySubscriptions.get(normalizedPlayerId);
  return Boolean(playerSockets && playerSockets.size > 0);
}

function scheduleDisconnectGraceTimer(code, playerId) {
  const normalizedCode = normalizeCode(code);
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedCode || !normalizedPlayerId) return;
  clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
  let lobbyTimers = disconnectTimersByLobbyCode.get(normalizedCode);
  if (!lobbyTimers) {
    lobbyTimers = new Map();
    disconnectTimersByLobbyCode.set(normalizedCode, lobbyTimers);
  }
  const timeoutRef = setTimeout(async () => {
    try {
      if (hasActiveSocketSubscription(normalizedCode, normalizedPlayerId)) {
        clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
        return;
      }
      const lobby = await store.getLobby(normalizedCode);
      if (!lobby) {
        clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
        return;
      }
      const stillPresent = Array.isArray(lobby.players)
        ? lobby.players.some((entry) => String(entry?.id || '') === normalizedPlayerId)
        : false;
      if (!stillPresent) {
        clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
        return;
      }
      const removed = await store.removePlayer(normalizedCode, normalizedPlayerId);
      if (removed?.error === 'not-found') {
        clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
        return;
      }
      if (removed?.lobby) {
        broadcastSnapshot(normalizedCode, removed.lobby);
        return;
      }
      broadcastSnapshot(normalizedCode, null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[lobby-server] disconnect grace removal failed', {
        code: normalizedCode,
        playerId: normalizedPlayerId,
        error,
      });
    } finally {
      clearDisconnectGraceTimer(normalizedCode, normalizedPlayerId);
    }
  }, DISCONNECT_GRACE_MS);
  lobbyTimers.set(normalizedPlayerId, timeoutRef);
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

app.post('/api/lobbies/:code/voice/token', voiceTokenLimiter, async (req, res) => {
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
      // Short-lived join window; the token only gates room entry, not an
      // established session, so this does not cut off active calls.
      ttl: '15m',
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

app.post('/api/lobbies', createLobbyLimiter, async (req, res) => {
  const hostName = String(req.body?.hostName || '').trim() || 'Host';
  const hostPlayer = req.body?.hostPlayer || {};
  const maxPlayers = Number(req.body?.maxPlayers);
  const settings = req.body?.settings && typeof req.body.settings === 'object'
    ? req.body.settings
    : {};
  let hostAuthUserId = '';
  const auth = await resolveAuthUserFromBearer(req);
  if (!auth.error) {
    hostAuthUserId = auth.userId;
  }
  const created = await store.createLobby({
    hostPlayer,
    hostName,
    maxPlayers,
    settings,
    hostAuthUserId,
  });
  broadcastSnapshot(created.lobby.code, created.lobby);
  res.status(201).json({
    lobby: toClientSnapshot(created.lobby),
    player: created.player,
    sessionToken: created.sessionToken,
  });
});

app.get('/api/lobbies/:code', lookupLimiter, async (req, res) => {
  const code = normalizeCode(req.params.code);
  const lobby = await store.getLobby(code);
  if (!lobby) {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  res.json({ lobby: toClientSnapshot(lobby) });
});

app.post('/api/lobbies/:code/join', joinLobbyLimiter, async (req, res) => {
  const code = normalizeCode(req.params.code);
  const incoming = req.body?.player || {};
  const sessionToken = String(req.body?.sessionToken || '');
  const joined = await store.upsertPlayer(code, incoming, sessionToken);
  if (joined.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (joined.error === 'already-started') {
    res.status(409).json({ error: 'lobby-already-started' });
    return;
  }
  if (joined.error === 'lobby-ended') {
    res.status(409).json({ error: 'lobby-ended' });
    return;
  }
  if (joined.error === 'client-id-in-use') {
    res.status(409).json({ error: 'client-id-in-use' });
    return;
  }
  if (joined.error === 'lobby-full') {
    res.status(409).json({
      error: 'lobby-full',
      maxPlayers: Number(joined.maxPlayers || 0),
    });
    return;
  }
  if (joined.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  broadcastSnapshot(code, joined.lobby);
  if (joined?.player?.id) {
    clearDisconnectGraceTimer(code, joined.player.id);
  }
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
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
    return;
  }
  if (result.error === 'lock-timeout') {
    res.status(503).json({ error: 'lobby-busy' });
    return;
  }
  broadcastSnapshot(code, result.lobby);
  if (result?.player?.id) {
    clearDisconnectGraceTimer(code, result.player.id);
  }
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
    clearDisconnectGraceTimer(code, playerId);
    res.json({ lobby: null, removed: true });
    return;
  }
  clearDisconnectGraceTimer(code, playerId);
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
  if (result.error === 'not-enough-ready-players') {
    res.status(409).json({
      error: 'not-enough-ready-players',
      minPlayers: MIN_PLAYERS,
      readyCount: Number(result.readyCount || 0),
    });
    return;
  }
  if (result.error === 'host-not-ready') {
    res.status(409).json({ error: 'host-not-ready' });
    return;
  }
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
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

app.post('/api/lobbies/:code/ready', async (req, res) => {
  const code = normalizeCode(req.params.code);
  const playerId = String(req.body?.playerId || '');
  const sessionToken = String(req.body?.sessionToken || '');
  const isReady = req.body?.ready !== false;
  const result = await store.setPlayerReady(code, playerId, sessionToken, isReady);
  if (result.error === 'not-found') {
    res.status(404).json({ error: 'lobby-not-found' });
    return;
  }
  if (result.error === 'lobby-already-started') {
    res.status(409).json({ error: 'lobby-already-started' });
    return;
  }
  if (result.error === 'lobby-ended') {
    res.status(409).json({ error: 'lobby-ended', lobby: toClientSnapshot(result.lobby || null) });
    return;
  }
  if (result.error === 'player-id-required' || result.error === 'session-token-required') {
    res.status(400).json({ error: result.error });
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
  broadcastSnapshot(code, result.lobby);
  res.json({
    lobby: toClientSnapshot(result.lobby),
    playerId: result.player?.id || '',
    playerReadyState: Boolean(result.player?.isReady),
    allPlayersReady: Boolean(result.allPlayersReady),
    rotatedSessionToken: result.sessionToken || '',
    readyCount: Number(result.readyCount || 0),
    totalCount: Number(result.totalCount || 0),
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
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
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
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
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
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
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
  if (result.error === 'lobby-ended') {
    res.status(409).json({
      error: 'lobby-ended',
      lobby: toClientSnapshot(result.lobby || null),
    });
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
  const subscriptions = new Map();

  socket.on('lobby:subscribe', async ({ code, playerId = '', sessionToken = '' }) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    socket.join(roomName(normalized));
    const normalizedPlayerId = String(playerId || '').trim();
    const normalizedSessionToken = String(sessionToken || '').trim();
    const previousSubscription = subscriptions.get(normalized);
    if (previousSubscription?.playerId) {
      unregisterActiveSocketSubscription(normalized, previousSubscription.playerId, socket.id);
    }
    if (normalizedPlayerId && normalizedSessionToken) {
      subscriptions.set(normalized, {
        playerId: normalizedPlayerId,
        sessionToken: normalizedSessionToken,
      });
      registerActiveSocketSubscription(normalized, normalizedPlayerId, socket.id);
      clearDisconnectGraceTimer(normalized, normalizedPlayerId);
    }
    const lobby = await store.getLobby(normalized);
    socket.emit('lobby:snapshot', toClientSnapshot(lobby));
  });

  socket.on('party-chat:message', async ({ code, playerId, sessionToken, text }) => {
    const normalizedCode = normalizeCode(code);
    const normalizedPlayerId = String(playerId || '').trim();
    const normalizedToken = String(sessionToken || '').trim();
    const normalizedText = String(text || '').trim().slice(0, 280);
    if (!normalizedCode || !normalizedPlayerId || !normalizedToken || !normalizedText) return;
    const lobby = await store.getLobby(normalizedCode);
    if (!lobby) return;
    const sessionEntry = lobby.playerSessions?.[normalizedPlayerId] || null;
    if (!sessionEntry?.token || sessionEntry.token !== normalizedToken) return;
    if (Number(sessionEntry.expiresAt) <= Date.now()) return;
    const player = Array.isArray(lobby.players)
      ? lobby.players.find((entry) => String(entry?.id || '') === normalizedPlayerId)
      : null;
    if (!player) return;
    io.to(roomName(normalizedCode)).emit('party-chat:message', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lobbyCode: normalizedCode,
      playerId: normalizedPlayerId,
      playerName: String(player.name || 'Player'),
      text: normalizedText,
      createdAt: nowIso(),
    });
  });

  socket.on('party-voice:activity', async ({ code, playerId, sessionToken, isTalking }) => {
    const normalizedCode = normalizeCode(code);
    const normalizedPlayerId = String(playerId || '').trim();
    const normalizedToken = String(sessionToken || '').trim();
    if (!normalizedCode || !normalizedPlayerId || !normalizedToken) return;
    const lobby = await store.getLobby(normalizedCode);
    if (!lobby) return;
    const validation = validateLobbyPlayerSession(lobby, normalizedPlayerId, normalizedToken);
    if (validation.error) return;
    io.to(roomName(normalizedCode)).emit('party-voice:activity', {
      lobbyCode: normalizedCode,
      playerId: normalizedPlayerId,
      isTalking: Boolean(isTalking),
      updatedAt: nowIso(),
    });
  });

  socket.on('lobby:unsubscribe', ({ code }) => {
    const normalized = normalizeCode(code);
    if (!normalized) return;
    socket.leave(roomName(normalized));
    const existingSubscription = subscriptions.get(normalized);
    if (existingSubscription?.playerId) {
      unregisterActiveSocketSubscription(normalized, existingSubscription.playerId, socket.id);
    }
    subscriptions.delete(normalized);
  });

  socket.on('disconnect', async () => {
    const entries = Array.from(subscriptions.entries());
    subscriptions.clear();
    for (const [code, subscription] of entries) {
      const normalizedPlayerId = String(subscription?.playerId || '').trim();
      const normalizedSessionToken = String(subscription?.sessionToken || '').trim();
      if (!code || !normalizedPlayerId || !normalizedSessionToken) continue;
      unregisterActiveSocketSubscription(code, normalizedPlayerId, socket.id);
      if (hasActiveSocketSubscription(code, normalizedPlayerId)) continue;
      try {
        const lobby = await store.getLobby(code);
        if (!lobby) continue;
        const validation = validateLobbyPlayerSession(lobby, normalizedPlayerId, normalizedSessionToken);
        if (validation.error) continue;
        scheduleDisconnectGraceTimer(code, normalizedPlayerId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[lobby-server] disconnect handling failed', {
          code,
          playerId: normalizedPlayerId,
          error,
        });
      }
    }
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
