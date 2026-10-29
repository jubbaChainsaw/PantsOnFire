import { ALL_THEME_NAMES } from '../themeCatalog.js';
import {
  REFERRAL_SECRET_THEME_UNLOCKS,
  referralSecretThemeUnlocked,
} from '../referralSecretThemes.js';
import { toCanonicalThemeName } from '../themeAliases.js';
import { getThemeCardAssets, resolveDefaultPromptBackSrc } from '../themeAssets.js';
import unlockableManifest from '../../../public/assets/themes/default/cards/unlockable/index.json';
import { THEME_CARD_STYLE_ALT, THEME_CARD_STYLE_CLASSIC, isAltCardStyleUnlocked } from '../themeCardStyles.js';

const UNLOCKABLE_BACKS = Array.isArray(unlockableManifest) ? unlockableManifest : [];

export function listDefaultUnlockableBacks() {
  return UNLOCKABLE_BACKS.map((entry) => ({
    slug: String(entry.slug || '').trim(),
    name: String(entry.name || entry.slug || 'Back'),
    src: `/assets/themes/default/cards/unlockable/${entry.file || `back-${entry.slug}.png`}`,
  }));
}

export function defaultClassicBackSrc() {
  return resolveDefaultPromptBackSrc('classic');
}

function appendThemeClassicAltEntries(entries, themeName, profile, unlockedAltThemeKeys) {
  const canonical = toCanonicalThemeName(themeName) || themeName;
  const assets = getThemeCardAssets(canonical);
  entries.push({
    id: `${canonical}-classic`,
    kind: 'themeClassic',
    themeName: canonical,
    style: THEME_CARD_STYLE_CLASSIC,
    label: `${canonical} · Classic`,
    src: assets.promptCardBackClassic,
    unlockHint: 'Classic style — default for every theme',
    isUnlocked: true,
  });
  const altUnlocked = isAltCardStyleUnlocked(canonical, unlockedAltThemeKeys);
  entries.push({
    id: `${canonical}-alt`,
    kind: 'themeAlt',
    themeName: canonical,
    style: THEME_CARD_STYLE_ALT,
    label: `${canonical} · Alt`,
    src: assets.promptCardBackAlt,
    unlockHint: altUnlocked
      ? 'Unlocked — host a full game with this theme'
      : 'Host a full game with this theme to unlock Alt',
    isUnlocked: altUnlocked,
  });
}

export function buildDeckCatalogEntries(profile, unlockedAltThemeKeys = []) {
  const entries = [];
  entries.push({
    id: 'default-classic',
    kind: 'defaultClassic',
    themeName: 'Default',
    style: THEME_CARD_STYLE_CLASSIC,
    label: 'Default · Classic',
    src: defaultClassicBackSrc(),
    unlockHint: 'Always available',
    isUnlocked: true,
  });
  for (const back of listDefaultUnlockableBacks()) {
    entries.push({
      id: `default-unlockable-${back.slug}`,
      kind: 'defaultUnlockable',
      themeName: 'Default',
      style: back.slug,
      label: back.name,
      src: back.src,
      unlockHint: 'Earn via Profile achievements',
      isUnlocked: (profile?.unlockedDefaultBackSlugs || []).includes(back.slug),
    });
  }
  for (const themeName of ALL_THEME_NAMES) {
    appendThemeClassicAltEntries(entries, themeName, profile, unlockedAltThemeKeys);
  }
  for (const config of REFERRAL_SECRET_THEME_UNLOCKS) {
    const themeName = config.themeName;
    const pack = config.pack;
    const unlocked = referralSecretThemeUnlocked(profile, themeName);
    if (!unlocked) {
      entries.push({
        id: `${pack.id}-mystery-deck`,
        kind: 'referralSecretMystery',
        themeName: null,
        style: 'secret',
        label: config.mysteryDeckLabel,
        src: pack.mysteryIcon,
        unlockHint: config.achievementTitle,
        isUnlocked: false,
      });
      continue;
    }
    appendThemeClassicAltEntries(entries, themeName, profile, unlockedAltThemeKeys);
  }
  return entries;
}

export function deckCollectionCounts(profile, unlockedAltThemeKeys = []) {
  const entries = buildDeckCatalogEntries(profile, unlockedAltThemeKeys);
  const total = entries.length;
  const unlocked = entries.filter((entry) => entry.isUnlocked).length;
  return { unlocked, total, entries };
}
