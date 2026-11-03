import { toCanonicalThemeName } from '../../data/themeAliases.js';

/** Theme display name → `public/assets/themes/<slug>/` folder (when different from kebab name). */
const CONTENT_THEME_SLUG_BY_NAME = {
  'Cops and Robbers': 'gangsters',
  'Ghosts and Ghouls': 'ghosts-and-ghouls',
};

export function themeNameToContentSlug(themeName) {
  const canonical = toCanonicalThemeName(themeName);
  if (CONTENT_THEME_SLUG_BY_NAME[canonical]) {
    return CONTENT_THEME_SLUG_BY_NAME[canonical];
  }
  return String(canonical || themeName || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @param {{ themes?: string[] }} dlcPack
 * @param {{ packs?: { id: string, themeSlug?: string }[] }} manifest
 */
export function contentPackIdsForDlcPack(dlcPack, manifest) {
  const packs = manifest?.packs || [];
  const slugs = new Set(
    (dlcPack?.themes || []).map((name) => themeNameToContentSlug(name)),
  );
  return packs
    .filter((pack) => pack.themeSlug && slugs.has(pack.themeSlug))
    .map((pack) => pack.id);
}

export function coreThemeContentPackId(themeName, manifest) {
  const slug = themeNameToContentSlug(themeName);
  const pack = (manifest?.packs || []).find((row) => row.themeSlug === slug);
  return pack?.id || null;
}
