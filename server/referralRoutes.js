import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { syncInviterReferralSecretThemes, getReferralSummary, attributeReferralSignup } from './referralService.js';
import { buildReferralInviteUrl, referralThemeNamesForConvertedCount, FEVER_DREAM_1_THEME_NAME, FEVER_DREAM_2_THEME_NAME } from './referralConstants.js';

const SECRET_REFERRAL_THEME_NAMES = new Set([
  FEVER_DREAM_1_THEME_NAME,
  FEVER_DREAM_2_THEME_NAME,
]);

function normalizeDeviceId(raw) {
  return String(raw || '').trim().slice(0, 128);
}

export function mountReferralRoutes(app, { referralStore, playerProfileStore } = {}) {
  if (!referralStore) {
    throw new Error('referralStore-required');
  }

  app.get('/api/referral/invite/:code', async (req, res) => {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ error: 'invalid-code' });
      return;
    }
    const row = await referralStore.getCodeRowByCode(code);
    if (!row) {
      res.status(404).json({ error: 'invalid-code', valid: false });
      return;
    }
    res.json({
      valid: true,
      code: row.code,
      message: 'Sign up for Pants on Fire with this invite link.',
    });
  });

  app.get('/api/me/referral', async (req, res) => {
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
    const deviceId = normalizeDeviceId(req.headers['x-pof-device-id']);
    try {
      const summary = await getReferralSummary(
        referralStore,
        resolved.userId,
        deviceId,
      );
      let unlockedSecretThemeNames = referralThemeNamesForConvertedCount(
        summary.stats?.converted,
      );
      if (playerProfileStore) {
        const synced = await syncInviterReferralSecretThemes(
          playerProfileStore,
          referralStore,
          resolved.userId,
        );
        if (synced?.achievementUnlockedThemeNames?.length) {
          unlockedSecretThemeNames = synced.achievementUnlockedThemeNames.filter(
            (name) => SECRET_REFERRAL_THEME_NAMES.has(name),
          );
        }
      }
      res.json({
        code: summary.code,
        inviteUrl: buildReferralInviteUrl(summary.code),
        stats: summary.stats,
        unlockedSecretThemeNames,
      });
    } catch (err) {
      res.status(500).json({ error: 'referral-summary-failed', detail: String(err?.message || err) });
    }
  });

  app.post('/api/me/referral/attribute', async (req, res) => {
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
    const code = String(req.body?.code || '').trim();
    const deviceId = normalizeDeviceId(req.body?.deviceId || req.headers['x-pof-device-id']);
    const result = await attributeReferralSignup(referralStore, {
      inviteeUserId: resolved.userId,
      code,
      inviteeDeviceId: deviceId,
    });
    if (!result.ok) {
      const status =
        result.error === 'self-referral' || result.error === 'self-referral-device'
          ? 409
          : result.error === 'invalid-code'
            ? 404
            : 400;
      res.status(status).json({ error: result.error || 'attribute-failed' });
      return;
    }
    res.json({ ok: true, alreadyAttributed: Boolean(result.alreadyAttributed) });
  });
}
