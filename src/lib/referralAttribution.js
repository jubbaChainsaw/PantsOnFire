const PENDING_REFERRAL_CODE_KEY = 'pof-pending-referral-code-v1';

export { PENDING_REFERRAL_CODE_KEY };

export function parseReferralCodeFromLocation(location = window.location) {
  try {
    const path = String(location?.pathname || '');
    const match = path.match(/\/invite\/([^/?#]+)/i);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).trim();
    }
    const params = new URLSearchParams(location?.search || '');
    return String(params.get('invite') || params.get('ref') || '').trim();
  } catch {
    return '';
  }
}

export function storePendingReferralCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized || typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_REFERRAL_CODE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

export function readPendingReferralCode() {
  if (typeof window === 'undefined') return '';
  try {
    return String(localStorage.getItem(PENDING_REFERRAL_CODE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function clearPendingReferralCode() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
  } catch {
    /* ignore */
  }
}
