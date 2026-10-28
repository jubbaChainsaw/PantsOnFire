import { getLobbyApiBase } from './lobbyApiEnv.js';

const STORAGE_KEY = 'pof-cloud-auth-v1';

export function readPoFCloudAuth() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = String(parsed?.access_token || '').trim();
    if (!token) return null;
    return {
      access_token: token,
      user: parsed.user || null,
    };
  } catch {
    return null;
  }
}

export function writePoFCloudAuth(session) {
  if (typeof window === 'undefined') return;
  if (!session?.access_token) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      access_token: session.access_token,
      user: session.user || null,
    }),
  );
}

export function clearPoFCloudAuth() {
  writePoFCloudAuth(null);
}

function toSessionShape(payload) {
  const user = payload?.user || {};
  const displayName = String(user.display_name || user.displayName || '').trim();
  const email = String(user.email || '').trim();
  return {
    access_token: String(payload.access_token || '').trim(),
    token_type: payload.token_type || 'bearer',
    user: {
      id: String(user.id || '').trim(),
      email,
      user_metadata: {
        full_name: displayName || (email ? email.split('@')[0] : 'Player'),
      },
    },
  };
}

export async function fetchPoFAuthStatus() {
  const res = await fetch(`${getLobbyApiBase()}/auth/status`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return { configured: false, provider: 'pof' };
  return res.json();
}

export async function loginPoFCloud({ email, password }) {
  const res = await fetch(`${getLobbyApiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: new Error(body.error || `login-http-${res.status}`) };
  }
  const session = toSessionShape(body);
  writePoFCloudAuth(session);
  return { data: { session }, error: null };
}

export async function registerPoFCloud({ email, password, displayName }) {
  const res = await fetch(`${getLobbyApiBase()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: new Error(body.error || `register-http-${res.status}`) };
  }
  const session = toSessionShape(body);
  writePoFCloudAuth(session);
  return { data: { session }, error: null };
}

export async function validatePoFCloudSession(session) {
  const token = String(session?.access_token || '').trim();
  if (!token) return null;
  const res = await fetch(`${getLobbyApiBase()}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    clearPoFCloudAuth();
    return null;
  }
  const user = await res.json();
  return toSessionShape({ access_token: token, user });
}
