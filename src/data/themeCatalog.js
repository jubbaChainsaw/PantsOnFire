import { THEME_META } from './themes.js';
import { YE_OLDE_BALONEY_THEME_PACK } from './dlc/themePacks/ye-olde-baloney/themePack.js';
import { MYTH_TAKEN_IDENTITY_THEME_PACK } from './dlc/themePacks/myth-taken-identity/themePack.js';
import { LICENCE_TO_FIB_THEME_PACK } from './dlc/themePacks/licence-to-fib/themePack.js';
import { WANTED_BETTER_ALIBIS_THEME_PACK } from './dlc/themePacks/wanted-better-alibis/themePack.js';
import { RANK_AND_FILE_MOSTLY_FILE_THEME_PACK } from './dlc/themePacks/rank-and-file-mostly-file/themePack.js';
import { BEAST_MODE_DECEIT_THEME_PACK } from './dlc/themePacks/beast-mode-deceit/themePack.js';
import { CTRL_ALT_ELIEVE_THEME_PACK } from './dlc/themePacks/ctrl-alt-elieve/themePack.js';
import { DARK_ARTS_KRAFTY_LIES_THEME_PACK } from './dlc/themePacks/dark-arts-krafty-lies/themePack.js';
import { DRAWN_TO_LIE_THEME_PACK } from './dlc/themePacks/drawn-to-lie/themePack.js';
import { GLITTER_AND_SUSPECTS_THEME_PACK } from './dlc/themePacks/glitter-and-suspects/themePack.js';

export const CORE_THEME_NAMES = [
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
];

export const DLC_THEME_PACKS = [
  YE_OLDE_BALONEY_THEME_PACK,
  MYTH_TAKEN_IDENTITY_THEME_PACK,
  LICENCE_TO_FIB_THEME_PACK,
  WANTED_BETTER_ALIBIS_THEME_PACK,
  RANK_AND_FILE_MOSTLY_FILE_THEME_PACK,
  BEAST_MODE_DECEIT_THEME_PACK,
  CTRL_ALT_ELIEVE_THEME_PACK,
  DARK_ARTS_KRAFTY_LIES_THEME_PACK,
  DRAWN_TO_LIE_THEME_PACK,
  GLITTER_AND_SUSPECTS_THEME_PACK,
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
