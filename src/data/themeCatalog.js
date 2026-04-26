import { THEME_META } from './themes';
import { WORST_LIARS_IN_HISTORY_THEME_PACK } from './dlc/themePacks/worst-liars-in-history/themePack';
import { HIGH_STAKES_CASES_THEME_PACK } from './dlc/themePacks/high-stakes-cases/themePack';
import { FUTURE_AND_FANTASY_THEME_PACK } from './dlc/themePacks/future-and-fantasy/themePack';
import { STAGE_AND_SPECTACLE_THEME_PACK } from './dlc/themePacks/stage-and-spectacle/themePack';

export const CORE_THEME_NAMES = [
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
];

export const DLC_THEME_PACKS = [
  WORST_LIARS_IN_HISTORY_THEME_PACK,
  HIGH_STAKES_CASES_THEME_PACK,
  FUTURE_AND_FANTASY_THEME_PACK,
  STAGE_AND_SPECTACLE_THEME_PACK,
];

export const DLC_THEME_NAMES = [
  ...new Set(DLC_THEME_PACKS.flatMap((pack) => pack.themes || [])),
];

export const ALL_THEME_NAMES = [...new Set([...CORE_THEME_NAMES, ...DLC_THEME_NAMES])];

export const THEME_DLC_PACK_BY_THEME = Object.fromEntries(
  DLC_THEME_PACKS.flatMap((pack) => (pack.themes || []).map((themeName) => [themeName, pack.id]))
);

export function normalizeUnlockedThemePackIds(rawPackIds) {
  const validPackIds = new Set(DLC_THEME_PACKS.map((pack) => pack.id));
  return [...new Set((rawPackIds || []).filter((packId) => validPackIds.has(packId)))];
}

export function getThemeOptions(unlockedThemePackIds = []) {
  const unlocked = new Set(normalizeUnlockedThemePackIds(unlockedThemePackIds));
  const options = CORE_THEME_NAMES.map((themeName) => ({
    name: themeName,
    isDlc: false,
    isUnlocked: true,
    packId: null,
  }));
  DLC_THEME_PACKS.forEach((pack) => {
    const packUnlocked = unlocked.has(pack.id);
    (pack.themes || []).forEach((themeName) => {
      if (!THEME_META[themeName]) return;
      options.push({
        name: themeName,
        isDlc: true,
        isUnlocked: packUnlocked,
        packId: pack.id,
      });
    });
  });
  return options;
}
