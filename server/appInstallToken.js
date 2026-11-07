import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function signingSecret() {
  return (
    String(process.env.POF_APP_INSTALL_SECRET || '').trim() ||
    String(process.env.POF_AUTH_JWT_SECRET || '').trim() ||
    ''
  );
}

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

export function createAppInstallToken({
  installId = '',
  platform = 'unknown',
  ttlMs = DEFAULT_TTL_MS,
} = {}) {
  const secret = signingSecret();
  if (!secret) return { error: 'app-install-signing-not-configured' };
  const id =
    String(installId || '').trim() ||
    randomBytes(16).toString('hex');
  const plat = String(platform || 'unknown').trim().slice(0, 32) || 'unknown';
  const exp = Date.now() + Math.max(60_000, Number(ttlMs) || 0);
  const payload = `${id}|${plat}|${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return {
    installToken: `${base64UrlEncode(payload)}.${sig}`,
    installId: id,
    platform: plat,
    expiresAt: exp,
  };
}

export function verifyAppInstallToken(token) {
  const secret = signingSecret();
  if (!secret) return { error: 'app-install-signing-not-configured' };
  const raw = String(token || '').trim();
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return { error: 'invalid-token' };
  const encodedPayload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const payload = base64UrlDecode(encodedPayload);
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { error: 'invalid-signature' };
  }
  const [installId, platform, expRaw] = payload.split('|');
  const exp = Number(expRaw);
  if (!installId || !platform || !Number.isFinite(exp)) return { error: 'invalid-payload' };
  if (Date.now() > exp) return { error: 'token-expired' };
  return { installId, platform, expiresAt: exp };
}
