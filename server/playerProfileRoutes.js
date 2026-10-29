import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { mergePlayerProfiles, normalizePlayerProfile } from '../src/data/playerProfile/profileModel.js';

export function mountPlayerProfileRoutes(app, { store } = {}) {
  const profileStore = store || new Map();

  app.get('/api/me/profile', async (req, res) => {
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
    const userId = resolved.userId;
    const stored = await Promise.resolve(profileStore.get(userId));
    res.json({ profile: normalizePlayerProfile(stored) });
  });

  app.put('/api/me/profile', async (req, res) => {
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
    const userId = resolved.userId;
    const incoming = normalizePlayerProfile(req.body?.profile || req.body);
    const existing = normalizePlayerProfile(
      await Promise.resolve(profileStore.get(userId)),
    );
    const merged = mergePlayerProfiles(existing, incoming);
    await Promise.resolve(profileStore.set(userId, merged));
    res.json({ profile: merged });
  });
}
