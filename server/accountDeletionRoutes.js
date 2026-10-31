import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { deleteAccountAndPersonalData } from './accountDeletionService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mountAccountDeletionRoutes(
  app,
  { accountStore, profileStore, entitlementsStore, moderationStore, pgPool } = {},
) {
  app.post('/api/me/delete-account', async (req, res) => {
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
    const password = String(req.body?.password || '');
    if (resolved.provider === 'pof') {
      if (!password) {
        res.status(400).json({ error: 'password-required' });
        return;
      }
      const user = await accountStore.getUserById(resolved.userId);
      if (!user?.email) {
        res.status(401).json({ error: 'invalid-token' });
        return;
      }
      const auth = await accountStore.authenticate({ email: user.email, password });
      if (!auth.ok) {
        res.status(401).json({ error: 'invalid-credentials' });
        return;
      }
    }

    const result = await deleteAccountAndPersonalData({
      userId: resolved.userId,
      provider: resolved.provider,
      accountStore,
      profileStore,
      entitlementsStore,
      pgPool,
    });
    if (!result.ok) {
      res.status(500).json({ error: result.error || 'delete-failed' });
      return;
    }
    res.json({ ok: true, deleted: true });
  });

  app.post('/api/public/account-deletion-request', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const note = String(req.body?.note || '').trim();
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'invalid-email' });
      return;
    }
    if (moderationStore?.saveDeletionRequest) {
      await moderationStore.saveDeletionRequest({ email, note });
    }
    res.status(202).json({
      ok: true,
      message:
        'Request received. We will process account deletion within 30 days. You can also email jubbamhc@gmail.com from your account email.',
    });
  });
}
