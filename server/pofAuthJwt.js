import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

function base64UrlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(str) {
  const padded = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

function getSecret() {
  const secret = String(process.env.POF_AUTH_JWT_SECRET || '').trim();
  if (!secret) return null;
  return secret;
}

/**
 * Minimal HS256 JWT for PoF cloud accounts (no external auth vendor).
 * @param {{ sub: string, email?: string, displayName?: string }} payload
 */
export function signPoFAccessToken(payload, { ttlSec = DEFAULT_TTL_SEC } = {}) {
  const secret = getSecret();
  if (!secret) throw new Error('POF_AUTH_JWT_SECRET-not-configured');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    sub: String(payload.sub || '').trim(),
    email: String(payload.email || '').trim(),
    displayName: String(payload.displayName || '').trim(),
    iat: now,
    exp: now + ttlSec,
  };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encBody = base64UrlEncode(JSON.stringify(body));
  const data = `${encHeader}.${encBody}`;
  const sig = createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64UrlEncode(sig)}`;
}

/**
 * @returns {{ userId: string, email: string, displayName: string } | null}
 */
export function verifyPoFAccessToken(token) {
  const secret = getSecret();
  if (!secret || !token) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encBody, encSig] = parts;
  const data = `${encHeader}.${encBody}`;
  const expected = createHmac('sha256', secret).update(data).digest();
  let actual;
  try {
    actual = base64UrlDecode(encSig);
  } catch {
    return null;
  }
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encBody).toString('utf8'));
  } catch {
    return null;
  }
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const userId = String(payload.sub || '').trim();
  if (!userId) return null;
  return {
    userId,
    email: String(payload.email || '').trim(),
    displayName: String(payload.displayName || '').trim(),
  };
}

export function isPoFAuthConfigured() {
  return Boolean(getSecret());
}

export function newUserId() {
  if (typeof randomBytes === 'function') {
    return randomBytes(16).toString('hex');
  }
  return `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
