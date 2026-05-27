import { toCanonicalThemeName } from './themeAliases.js';
import { getThemePersonas } from './themePersonas.js';

const THEME_SLUG_BY_CANONICAL_NAME = Object.freeze({
  Default: 'default',
  'Murder Mystery': 'murder-mystery',
  Pirates: 'pirates',
  'Cops and Robbers': 'cops-and-robbers',
  'Ghosts and Ghouls': 'ghosts-and-ghouls',
  Cowboys: 'cowboys',
  Gangsters: 'gangsters',
  Wrestlers: 'wrestlers',
});

function getLaunchThemeSlug(themeName = 'Default') {
  const canonical = toCanonicalThemeName(themeName);
  return THEME_SLUG_BY_CANONICAL_NAME[canonical] || 'default';
}

/** Themes shipping at beta (core + Wanted: Better Alibis). */
export const HOST_PERSONA_CALLOUT_THEME_NAMES = Object.freeze([
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
  'Cowboys',
  'Gangsters',
  'Wrestlers',
]);

const HOST_PERSONA_CALLOUT_THEME_SET = new Set(HOST_PERSONA_CALLOUT_THEME_NAMES);

/**
 * Spoken form of a persona display name (TTS / line_text).
 * Strips decorative quotes; keeps nicknames as words.
 */
export function buildPersonaCalloutSpokenLine(displayName = '') {
  return String(displayName || '')
    .replace(/[""]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isHostPersonaCalloutTheme(themeName = 'Default') {
  return HOST_PERSONA_CALLOUT_THEME_SET.has(toCanonicalThemeName(themeName));
}

/**
 * Stable key for filenames: barry-side-eye-collins from id default-barry-side-eye-collins.
 */
export function getPersonaCalloutKey(themeSlug = 'default', personaId = '') {
  const slug = String(themeSlug || 'default').trim();
  const id = String(personaId || '').trim();
  if (!id) return '';
  const prefix = `${slug}-`;
  if (id.startsWith(prefix)) return id.slice(prefix.length);
  return id.replace(/^[^a-z0-9]+/i, '').replace(/\s+/g, '-').toLowerCase();
}

export function buildPersonaCalloutFilename(themeSlug = 'default', personaId = '') {
  const prefix = themeSlug === 'default' ? 'default' : themeSlug;
  const key = getPersonaCalloutKey(themeSlug, personaId);
  if (!key) return '';
  return `${prefix}_persona_${key}.mp3`;
}

export function getPersonaCalloutLineTextForPlayer(player = {}, themeName = 'Default') {
  const personaId = String(player?.personaId || '').trim();
  if (!personaId) return '';
  const canonical = toCanonicalThemeName(themeName);
  if (!isHostPersonaCalloutTheme(canonical)) return '';
  const pool = getThemePersonas(canonical);
  const match = pool.find((entry) => entry.id === personaId);
  const spoken = buildPersonaCalloutSpokenLine(match?.name || player?.name || '');
  return spoken;
}

export function shouldPlayPersonaCalloutForPlayer(player = {}, themeName = 'Default', personaOnlyMode = false) {
  if (!personaOnlyMode) return false;
  if (!String(player?.personaId || '').trim()) return false;
  return isHostPersonaCalloutTheme(themeName);
}

/** Rows for export + hostVoiceLineMap registration. */
export function getPersonaCalloutEntriesForTheme(themeName = 'Default') {
  const canonical = toCanonicalThemeName(themeName);
  if (!isHostPersonaCalloutTheme(canonical)) return [];
  const themeSlug = getLaunchThemeSlug(canonical);
  return getThemePersonas(canonical)
    .map((persona) => {
      const lineText = buildPersonaCalloutSpokenLine(persona.name);
      const filename = buildPersonaCalloutFilename(themeSlug, persona.id);
      if (!lineText || !filename) return null;
      return {
        themeName: canonical,
        themeSlug,
        personaId: persona.id,
        personaName: persona.name,
        lineText,
        filename,
        variant: getPersonaCalloutKey(themeSlug, persona.id),
      };
    })
    .filter(Boolean);
}
