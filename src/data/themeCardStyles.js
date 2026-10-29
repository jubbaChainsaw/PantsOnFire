import { toCanonicalThemeName } from './themeAliases';

export const THEME_CARD_STYLE_CLASSIC = 'classic';
export const THEME_CARD_STYLE_ALT = 'alt';

export const THEME_ALT_CARD_UNLOCKS_STORAGE_KEY = 'imposter-theme-alt-card-unlocks-v1';
export const THEME_CARD_STYLE_BY_THEME_STORAGE_KEY = 'imposter-theme-card-style-by-theme-v1';

export const THEME_CARD_STYLE_LABELS = {
  [THEME_CARD_STYLE_CLASSIC]: 'Classic',
  [THEME_CARD_STYLE_ALT]: 'Alt',
};

export function normalizeThemeCardStyle(value) {
  return value === THEME_CARD_STYLE_ALT ? THEME_CARD_STYLE_ALT : THEME_CARD_STYLE_CLASSIC;
}

export function themeKeyForCardProgress(themeName = 'Default') {
  return toCanonicalThemeName(themeName) || 'Default';
}

export function normalizeUnlockedAltCardThemeKeys(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((entry) => themeKeyForCardProgress(entry)).filter(Boolean))];
}

export function isAltCardStyleUnlocked(themeName, unlockedKeys = []) {
  const key = themeKeyForCardProgress(themeName);
  return normalizeUnlockedAltCardThemeKeys(unlockedKeys).includes(key);
}

export function unlockAltCardStyleForTheme(unlockedKeys = [], themeName = 'Default') {
  const key = themeKeyForCardProgress(themeName);
  const next = normalizeUnlockedAltCardThemeKeys(unlockedKeys);
  if (next.includes(key)) {
    return { unlockedKeys: next, newlyUnlocked: false };
  }
  return { unlockedKeys: [...next, key], newlyUnlocked: true };
}

export function normalizeThemeCardStyleByTheme(raw) {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw).map(([themeName, style]) => [
      themeKeyForCardProgress(themeName),
      normalizeThemeCardStyle(style),
    ]),
  );
}

export function getSelectedThemeCardStyle(themeName, styleByTheme = {}) {
  const key = themeKeyForCardProgress(themeName);
  const map = normalizeThemeCardStyleByTheme(styleByTheme);
  return normalizeThemeCardStyle(map[key] || THEME_CARD_STYLE_CLASSIC);
}

export function resolveActiveThemeCardStyle(themeName, styleByTheme = {}, unlockedKeys = []) {
  const selected = getSelectedThemeCardStyle(themeName, styleByTheme);
  if (selected === THEME_CARD_STYLE_ALT && !isAltCardStyleUnlocked(themeName, unlockedKeys)) {
    return THEME_CARD_STYLE_CLASSIC;
  }
  return selected;
}
