import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { grantAltCardUnlockForTheme, getAltCardUnlockKeys } from './altCardUnlockService.js';

export function mountAltCardUnlockRoutes(app, { store, lobbyStore } = {}) {
  const profileStore = store || new Map();
  if (!lobbyStore) {
    throw new Error('lobbyStore-required');
  }

  app.get('/api/me/alt-card-unlocks', async (req, res) => {
    const resolved = await resolveAuthUserFromBearer(req);
    if (resolved.error) {
      const status =
        resolved.error === 'missing-token'
          ? 401
          : resolved.error === 'server-auth-not-configured'
            ? 503
            : 401;
      res.status(status).json({ error: resolved.error });
      return;
    }
    const keys = await getAltCardUnlockKeys(profileStore, resolved.userId);
    res.json({ unlockedThemeKeys: keys });
  });

  app.post('/api/lobbies/:code/complete-hosted-online-game', async (req, res) => {
    const resolved = await resolveAuthUserFromBearer(req);
    if (resolved.error) {
      const status =
        resolved.error === 'missing-token'
          ? 401
          : resolved.error === 'server-auth-not-configured'
            ? 503
            : 401;
      res.status(status).json({ error: resolved.error });
      return;
    }
    const code = String(req.params.code || '').trim();
    const playerId = String(req.body?.playerId || '').trim();
    const sessionToken = String(req.body?.sessionToken || '').trim();
    const result = await lobbyStore.completeHostedOnlineGame(code, playerId, sessionToken);
    if (result.error === 'not-found') {
      res.status(404).json({ error: 'lobby-not-found' });
      return;
    }
    if (result.error === 'host-required' || result.error === 'host-auth-mismatch') {
      res.status(403).json({ error: result.error });
      return;
    }
    if (result.error === 'game-not-complete') {
      res.status(409).json({ error: result.error });
      return;
    }
    if (result.error === 'host-not-linked') {
      res.status(409).json({ error: result.error });
      return;
    }
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    const hostAuthUserId = String(result.hostAuthUserId || '').trim();
    if (hostAuthUserId !== resolved.userId) {
      res.status(403).json({ error: 'host-auth-mismatch' });
      return;
    }
    if (!result.themeName) {
      res.json({ ok: true, skipped: 'missing-theme' });
      return;
    }
    const grant = await grantAltCardUnlockForTheme(
      profileStore,
      hostAuthUserId,
      result.themeName,
    );
    res.json({
      ok: true,
      themeName: result.themeName,
      themeKey: grant.themeKey,
      newlyUnlocked: grant.newlyUnlocked,
      unlockedThemeKeys: grant.unlockedThemeKeys,
      alreadyRecorded: Boolean(result.alreadyRecorded),
    });
  });
}
