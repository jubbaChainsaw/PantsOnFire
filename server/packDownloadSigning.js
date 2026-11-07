import { createHmac, timingSafeEqual } from 'node:crypto';

function signingSecret() {
  return (
    String(process.env.CONTENT_PACK_DOWNLOAD_SECRET || '').trim() ||
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

export function createSignedPackDownloadToken({ userId, packId, ttlMs = 5 * 60 * 1000 } = {}) {
  const secret = signingSecret();
  if (!secret) return { error: 'download-signing-not-configured' };
  const uid = String(userId || '').trim();
  const pid = String(packId || '').trim();
  if (!uid || !pid) return { error: 'invalid-token-params' };
  const exp = Date.now() + Math.max(30_000, Number(ttlMs) || 0);
  const payload = `${uid}|${pid}|${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  const token = `${base64UrlEncode(payload)}.${sig}`;
  return { token, expiresAt: exp };
}

export function verifySignedPackDownloadToken(token) {
  const secret = signingSecret();
  if (!secret) return { error: 'download-signing-not-configured' };
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
  const [userId, packId, expRaw] = payload.split('|');
  const exp = Number(expRaw);
  if (!userId || !packId || !Number.isFinite(exp)) return { error: 'invalid-payload' };
  if (Date.now() > exp) return { error: 'token-expired' };
  return { userId, packId, expiresAt: exp };
}

export function buildSignedPackDownloadPath(token, { apiPublicOrigin } = {}) {
  const origin = String(apiPublicOrigin || '').trim().replace(/\/+$/, '');
  const path = `/api/content-packs/signed-download?token=${encodeURIComponent(token)}`;
  return origin ? `${origin}${path}` : path;
}
