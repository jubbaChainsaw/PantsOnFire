import { signPoFAccessToken, isPoFAuthConfigured } from './pofAuthJwt.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientError(res, status, code) {
  res.status(status).json({ error: code });
}

/**
 * @param {import('express').Express} app
 * @param {{ accountStore: ReturnType<import('./pofAccountStore.js').createPoFAccountStore> }} deps
 */
export function mountPoFAuthRoutes(app, { accountStore } = {}) {
  if (!accountStore) return;

  app.get('/api/auth/status', (_req, res) => {
    res.json({
      provider: 'pof',
      configured: isPoFAuthConfigured(),
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    if (!isPoFAuthConfigured()) {
      clientError(res, 503, 'auth-not-configured');
      return;
    }
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const displayName =
      String(req.body?.displayName || req.body?.display_name || '').trim() ||
      email.split('@')[0] ||
      'Player';
    if (!EMAIL_RE.test(email)) {
      clientError(res, 400, 'invalid-email');
      return;
    }
    const created = await accountStore.createAccount({ email, password, displayName });
    if (!created.ok) {
      const status = created.error === 'email-in-use' ? 409 : 400;
      clientError(res, status, created.error || 'register-failed');
      return;
    }
    const token = signPoFAccessToken({
      sub: created.user.id,
      email: created.user.email,
      displayName: created.user.displayName,
    });
    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: created.user.id,
        email: created.user.email,
        display_name: created.user.displayName,
      },
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    if (!isPoFAuthConfigured()) {
      clientError(res, 503, 'auth-not-configured');
      return;
    }
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const auth = await accountStore.authenticate({ email, password });
    if (!auth.ok) {
      clientError(res, 401, 'invalid-credentials');
      return;
    }
    const token = signPoFAccessToken({
      sub: auth.user.id,
      email: auth.user.email,
      displayName: auth.user.displayName,
    });
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: auth.user.id,
        email: auth.user.email,
        display_name: auth.user.displayName,
      },
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!isPoFAuthConfigured()) {
      clientError(res, 503, 'auth-not-configured');
      return;
    }
    const { resolveAuthUserFromBearer } = await import('./resolveAuthUser.js');
    const resolved = await resolveAuthUserFromBearer(req);
    if (resolved.error) {
      const status =
        resolved.error === 'missing-token'
          ? 401
          : resolved.error === 'server-auth-not-configured'
            ? 503
            : 401;
      clientError(res, status, resolved.error);
      return;
    }
    if (resolved.provider !== 'pof') {
      clientError(res, 401, 'invalid-token');
      return;
    }
    const user = await accountStore.getUserById(resolved.userId);
    if (!user) {
      clientError(res, 401, 'invalid-token');
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      display_name: user.displayName,
    });
  });
}
