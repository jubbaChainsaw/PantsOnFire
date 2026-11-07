import { toCanonicalThemeName } from '../src/data/themeAliases.js';
import {
  normalizeUnlockedAltCardThemeKeys,
  themeKeyForCardProgress,
} from '../src/data/themeCardStyles.js';
import { normalizePlayerProfile } from '../src/data/playerProfile/profileModel.js';

export async function getAltCardUnlockKeys(profileStore, userId) {
  const profile = normalizePlayerProfile(
    await Promise.resolve(profileStore.get(userId)),
  );
  return normalizeUnlockedAltCardThemeKeys(profile.unlockedAltCardThemeKeys);
}

export async function grantAltCardUnlockForTheme(profileStore, userId, themeName) {
  const id = String(userId || '').trim();
  const key = themeKeyForCardProgress(toCanonicalThemeName(themeName) || themeName);
  if (!id || !key) {
    return { unlockedThemeKeys: [], newlyUnlocked: false, themeKey: key };
  }
  const prev = normalizePlayerProfile(await Promise.resolve(profileStore.get(id)));
  const merged = new Set([
    ...normalizeUnlockedAltCardThemeKeys(prev.unlockedAltCardThemeKeys),
  ]);
  if (merged.has(key)) {
    return {
      unlockedThemeKeys: [...merged],
      newlyUnlocked: false,
      themeKey: key,
    };
  }
  merged.add(key);
  const next = normalizePlayerProfile({
    ...prev,
    unlockedAltCardThemeKeys: [...merged],
  });
  await Promise.resolve(profileStore.set(id, next));
  return {
    unlockedThemeKeys: [...merged],
    newlyUnlocked: true,
    themeKey: key,
  };
}
