const DEVICE_ID_STORAGE_KEY = 'pof-device-id-v1';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return '';
  try {
    const existing = String(localStorage.getItem(DEVICE_ID_STORAGE_KEY) || '').trim();
    if (existing) return existing;
    const next = randomId();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}

export { DEVICE_ID_STORAGE_KEY };
