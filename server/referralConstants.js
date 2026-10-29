export const ULTIMATE_LIAR_THEME_NAME = 'Ultimate Liar';

export function referralInviteBaseUrl() {
  const raw = String(process.env.REFERRAL_INVITE_BASE_URL || '').trim();
  if (raw) return raw.replace(/\/+$/, '');
  return 'https://www.pantsonfire.app/invite';
}

export function buildReferralInviteUrl(code) {
  const base = referralInviteBaseUrl();
  const normalized = String(code || '').trim();
  return `${base}/${encodeURIComponent(normalized)}`;
}
