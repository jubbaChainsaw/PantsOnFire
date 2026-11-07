import { createAppInstallToken } from './appInstallToken.js';
import {
  APP_PLATFORM_HEADER,
  assertMayMintAppInstallToken,
  SHELL_VERSION_HEADER,
} from './hostingGate.js';

export function mountAppInstallRoutes(app, { rateLimiter } = {}) {
  const limiter = rateLimiter || ((req, res, next) => next());

  app.post('/api/app/install-token', limiter, (req, res) => {
    if (!assertMayMintAppInstallToken(req, res)) return;
    const platform = String(req.headers[APP_PLATFORM_HEADER] || req.body?.platform || 'unknown')
      .trim()
      .slice(0, 32);
    const installId = String(req.body?.installId || '').trim();
    const shellVersion = String(req.headers[SHELL_VERSION_HEADER] || '').trim();
    const issued = createAppInstallToken({ installId, platform });
    if (issued.error) {
      res.status(503).json({ error: issued.error });
      return;
    }
    res.json({
      installToken: issued.installToken,
      installId: issued.installId,
      platform: issued.platform,
      expiresAt: issued.expiresAt,
      shellVersion: shellVersion || undefined,
    });
  });
}
