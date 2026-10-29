import { FEVER_DREAM_1_THEME_PACK } from './dlc/themePacks/fever-dream-1/themePack.js';
import { FEVER_DREAM_2_THEME_PACK } from './dlc/themePacks/fever-dream-2/themePack.js';

import { toCanonicalThemeName } from './themeAliases.js';

/** UI + unlock config — never expose theme names in locked mystery copy. */
export const REFERRAL_SECRET_THEME_UNLOCKS = [
  {
    id: 'referral-fever-dream-1',
    pack: FEVER_DREAM_1_THEME_PACK,
    themeName: 'Fever Dream Vol. 1',
    conversionsRequired: 1,
    mysteryDeckLabel: 'Secret deck · ?',
    achievementTitle: 'Secret theme: invite a friend who joins and upgrades',
  },
  {
    id: 'referral-fever-dream-2',
    pack: FEVER_DREAM_2_THEME_PACK,
    themeName: 'Fever Dream Vol. 2',
    conversionsRequired: 3,
    mysteryDeckLabel: 'Secret deck · ?',
    achievementTitle: 'Secret theme: invite 3 friends who join and upgrade',
  },
];

export function referralSecretThemeUnlocked(profile, themeName) {
  const key = toCanonicalThemeName(themeName) || themeName;
  return (profile?.achievementUnlockedThemeNames || []).some(
    (entry) => (toCanonicalThemeName(entry) || entry) === key,
  );
}

export function referralConvertedProgress(referralStats, conversionsRequired) {
  const converted = Math.max(0, Number(referralStats?.converted) || 0);
  const target = Math.max(1, Number(conversionsRequired) || 1);
  return {
    current: Math.min(converted, target),
    target,
    ratio: Math.min(1, converted / target),
    unlocked: converted >= target,
  };
}
