export const FEVER_DREAM_1_THEME_NAME = 'Fever Dream Vol. 1';
export const FEVER_DREAM_2_THEME_NAME = 'Fever Dream Vol. 2';

export const REFERRAL_VOL1_CONVERTED_REQUIRED = 1;
export const REFERRAL_VOL2_CONVERTED_REQUIRED = 3;

export function referralThemeNamesForConvertedCount(converted) {
  const count = Math.max(0, Number(converted) || 0);
  const names = [];
  if (count >= REFERRAL_VOL1_CONVERTED_REQUIRED) {
    names.push(FEVER_DREAM_1_THEME_NAME);
  }
  if (count >= REFERRAL_VOL2_CONVERTED_REQUIRED) {
    names.push(FEVER_DREAM_2_THEME_NAME);
  }
  return names;
}

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
