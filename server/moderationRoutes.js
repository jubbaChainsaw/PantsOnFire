import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { recentLobbyChatMessages } from './lobbyChatContext.js';

const REPORT_REASONS = new Set([
  'harassment',
  'hate',
  'sexual',
  'spam',
  'other',
]);

function normalizeCode(raw = '') {
  return String(raw || '').trim().toUpperCase();
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

export function mountModerationRoutes(app, { moderationStore, lobbyStore, io, broadcastSnapshot } = {}) {
  if (!moderationStore || !lobbyStore) return;

  app.post('/api/lobbies/:code/report', async (req, res) => {
    const code = normalizeCode(req.params.code);
    const reporterPlayerId = String(req.body?.playerId || '').trim();
    const sessionToken = String(req.body?.sessionToken || '').trim();
    const reportedPlayerId = String(req.body?.reportedPlayerId || '').trim();
    const reason = String(req.body?.reason || 'other').trim().toLowerCase();
    const note = String(req.body?.note || '').trim();
    if (!code || !reporterPlayerId || !sessionToken || !reportedPlayerId) {
      res.status(400).json({ error: 'missing-fields' });
      return;
    }
    if (!REPORT_REASONS.has(reason)) {
      res.status(400).json({ error: 'invalid-reason' });
      return;
    }
    const lobby = await lobbyStore.getLobby(code);
    const validation = validateLobbyPlayerSession(lobby, reporterPlayerId, sessionToken);
    if (validation.error) {
      const status = validation.error === 'lobby-not-found' ? 404 : 401;
      res.status(status).json({ error: validation.error });
      return;
    }
    let reporterAuthUserId = '';
    const auth = await resolveAuthUserFromBearer(req);
    if (!auth.error) reporterAuthUserId = auth.userId;

    const chatContext = recentLobbyChatMessages(code, 20);
    const saved = await moderationStore.saveReport({
      lobbyCode: code,
      reporterPlayerId,
      reporterAuthUserId,
      reportedPlayerId,
      reason,
      note,
      chatContext,
    });
    res.status(201).json({ ok: true, reportId: saved.id });
  });

  app.post('/api/lobbies/:code/kick', async (req, res) => {
    const code = normalizeCode(req.params.code);
    const hostPlayerId = String(req.body?.hostPlayerId || '').trim();
    const sessionToken = String(req.body?.sessionToken || '').trim();
    const targetPlayerId = String(req.body?.targetPlayerId || '').trim();
    if (!code || !hostPlayerId || !sessionToken || !targetPlayerId) {
      res.status(400).json({ error: 'missing-fields' });
      return;
    }
    const lobby = await lobbyStore.getLobby(code);
    const validation = validateLobbyPlayerSession(lobby, hostPlayerId, sessionToken);
    if (validation.error) {
      const status = validation.error === 'lobby-not-found' ? 404 : 401;
      res.status(status).json({ error: validation.error });
      return;
    }
    if (!validation.player?.isHost) {
      res.status(403).json({ error: 'host-only' });
      return;
    }
    if (targetPlayerId === hostPlayerId) {
      res.status(400).json({ error: 'cannot-kick-self' });
      return;
    }
    const removed = await lobbyStore.removePlayer(code, targetPlayerId);
    if (removed.error === 'not-found') {
      res.status(404).json({ error: 'lobby-not-found' });
      return;
    }
    if (io) {
      io.to(`lobby:${code}`).emit('lobby:player-kicked', {
        lobbyCode: code,
        playerId: targetPlayerId,
        reason: 'host-kick',
      });
    }
    if (removed.lobby) {
      broadcastSnapshot?.(code, removed.lobby);
      res.json({ ok: true, lobby: removed.lobby });
      return;
    }
    broadcastSnapshot?.(code, null);
    res.json({ ok: true, lobby: null });
  });

  app.get('/api/me/blocks', async (req, res) => {
    const auth = await resolveAuthUserFromBearer(req);
    if (auth.error) {
      res.status(401).json({ error: auth.error });
      return;
    }
    const blocked = await moderationStore.listBlocks(auth.userId);
    res.json({ blockedPlayerKeys: blocked });
  });

  app.put('/api/me/blocks', async (req, res) => {
    const auth = await resolveAuthUserFromBearer(req);
    if (auth.error) {
      res.status(401).json({ error: auth.error });
      return;
    }
    const blockedPlayerKey = String(req.body?.blockedPlayerKey || '').trim();
    const action = String(req.body?.action || 'block').trim().toLowerCase();
    if (!blockedPlayerKey) {
      res.status(400).json({ error: 'missing-blocked-key' });
      return;
    }
    const next =
      action === 'unblock'
        ? await moderationStore.removeBlock(auth.userId, blockedPlayerKey)
        : await moderationStore.addBlock(auth.userId, blockedPlayerKey);
    res.json({ blockedPlayerKeys: next });
  });
}
