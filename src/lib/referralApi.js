import { getLobbyApiBase } from './lobbyApiEnv.js';
import { getOrCreateDeviceId } from './deviceId.js';

function deviceHeaders() {
  return { 'X-PoF-Device-Id': getOrCreateDeviceId() };
}

export async function fetchMyReferral(accessToken) {
  if (!accessToken) return null;
  const res = await fetch(`${getLobbyApiBase()}/api/me/referral`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...deviceHeaders(),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `referral-http-${res.status}`);
  }
  return res.json();
}

export async function attributeReferralCode(accessToken, code) {
  if (!accessToken || !code) return null;
  const res = await fetch(`${getLobbyApiBase()}/api/me/referral/attribute`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...deviceHeaders(),
    },
    body: JSON.stringify({
      code: String(code).trim(),
      deviceId: getOrCreateDeviceId(),
    }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    return { ok: false, error: payload?.error || `referral-http-${res.status}` };
  }
  return res.json();
}
