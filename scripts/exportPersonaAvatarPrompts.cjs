#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'exports');

const STYLE_GUIDE_NOTES = [
  'Use polished digital illustration, clean comic-influenced linework, soft studio-style lighting, and rich but balanced color.',
  'Use one consistent portrait system for every persona: same camera distance, same body scale, same lighting angle, same clean edge treatment.',
  'Aim for expressive faces, strong silhouette readability, and smooth cel-shaded rendering suitable for party game persona cards.',
  'Keep it original artwork (no logos, no text, no recognizable real person likeness).',
].join(' ');

const FACE_SHAPES = ['square jaw', 'round face', 'long narrow face', 'heart-shaped face', 'broad cheekbones', 'soft oval face', 'angular cheekbones', 'wide friendly face'];
const HAIR_STYLES = ['short cropped hair', 'messy medium hair', 'curly shoulder-length hair', 'sleek bob', 'high ponytail', 'shaved sides with textured top', 'wavy side part', 'long tied-back hair'];
const HAIR_COLORS = ['black', 'dark brown', 'warm brown', 'auburn', 'copper red', 'ash blonde', 'platinum blonde', 'deep blue-black'];
const SKIN_TONES = ['deep brown skin', 'rich dark skin', 'medium brown skin', 'olive skin', 'warm tan skin', 'light brown skin', 'fair skin with freckles', 'pale skin with rosy cheeks'];
const BODY_TYPES = ['slim build', 'broad-shouldered build', 'stocky build', 'tall lanky build', 'compact athletic build', 'soft rounded build', 'strong square build', 'petite build'];
const CLOTHING = ['sharp blazer over a plain tee', 'oversized hoodie', 'patterned bomber jacket', 'button-up shirt with rolled sleeves', 'leather jacket', 'chunky knit jumper', 'denim jacket', 'bright tracksuit top'];
const ACCESSORIES = ['round glasses', 'small hoop earrings', 'thick eyebrows and no accessories', 'thin rectangular glasses', 'single ear cuff', 'neat scarf at the neck', 'baseball cap worn forward', 'statement necklace'];
const EXPRESSIONS = ['side-eye suspicion', 'wide-eyed innocence', 'smug half-smile', 'nervous grin', 'deadpan stare', 'raised-eyebrow doubt', 'playful smirk', 'caught-in-the-act surprise'];

function hashString(value = '') {
  let hash = 2166136261;
  const input = String(value || '');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFrom(list, hash, salt = 0) {
  return list[(hash + salt) % list.length];
}

function buildUniqueAppearance(persona, themeName) {
  const seed = `${themeName}:${persona?.id || ''}:${persona?.name || ''}:${persona?.bio || ''}`;
  const hash = hashString(seed);
  return [
    `${pickFrom(SKIN_TONES, hash, 3)}, ${pickFrom(FACE_SHAPES, hash, 11)}`,
    `${pickFrom(HAIR_COLORS, hash, 19)} ${pickFrom(HAIR_STYLES, hash, 29)}`,
    `${pickFrom(BODY_TYPES, hash, 37)}`,
    `wearing a ${pickFrom(CLOTHING, hash, 43)}`,
    `${pickFrom(ACCESSORIES, hash, 53)}`,
    `expression: ${pickFrom(EXPRESSIONS, hash, 61)}`,
  ].join('; ');
}

function csvEscape(value) {
  return `"${String(value || '').replaceAll('"', '""')}"`;
}

function themeSlug(themeName) {
  return String(themeName || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function filenameFromImageSrc(imageSrc, fallbackId) {
  const file = path.basename(String(imageSrc || '').trim());
  if (file && file.endsWith('.png')) return file;
  const safeFallback = String(fallbackId || 'persona')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${safeFallback || 'persona'}.png`;
}

function buildAvatarPrompt(persona, themeName) {
  const name = String(persona?.name || 'Unknown Persona').trim();
  const bio = String(persona?.bio || '').trim();
  const canonicalThemeName = String(themeName || 'Default').trim();
  const uniqueAppearance = buildUniqueAppearance(persona, canonicalThemeName);
  return [
    'Create one standardized transparent PNG persona portrait for a social-deduction party game.',
    STYLE_GUIDE_NOTES,
    'Output must be a 1024x1024 square transparent-background PNG.',
    'Single character only, centered, facing camera in the same relaxed front-facing bust pose for every persona.',
    'Pose must be consistent: shoulders square to camera, head upright, arms and hands out of frame, no action pose, no full body.',
    'Consistent framing for every persona: head and upper torso visible, top of head around 10% from the top edge, shoulder line around 62%, torso ending around 85% from the top edge.',
    'Use transparent empty padding around the character; no environment, no props that extend outside the safe area, no colored backdrop, no shadows on a floor.',
    'No text, no logo, no watermark, no border, no frame.',
    `Unique visual design for this persona: ${uniqueAppearance}.`,
    'Do not reuse the same face, hair, clothing, body type, or expression from other personas.',
    'Expressive face with readable personality and silhouette-friendly shape language.',
    'Avoid realistic photo style; prefer vivid illustration/rendered-comic hybrid.',
    'Do not include copyrighted characters or recognizable real people.',
    `Theme: ${canonicalThemeName}.`,
    `Character name: ${name}.`,
    `Character vibe: ${bio}`,
  ].join(' ');
}

function buildRows(themeName, personas, { batchLabel = 'all-themes' } = {}) {
  const themeFolder = themeSlug(themeName) || 'default';
  return (personas || []).map((persona, index) => {
    const personaId = String(persona?.id || `${themeFolder}-${index + 1}`).trim();
    const imageSrc = String(persona?.imageSrc || '').trim();
    const filename = filenameFromImageSrc(imageSrc, personaId);
    const outputPath = path.posix.join('/assets/themes', themeFolder, 'personas', filename);
    const prompt = buildAvatarPrompt(persona, themeName);
    return {
      batchLabel,
      themeName,
      personaId,
      name: String(persona?.name || '').trim(),
      bio: String(persona?.bio || '').trim(),
      imageSrc,
      filename,
      outputPath,
      prompt,
      avatarPrompt: prompt,
      id: personaId,
    };
  });
}

function writeExportFiles(baseName, rows) {
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const csvPath = path.join(outputDir, `${baseName}.csv`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

  const csvHeader = [
    'batch',
    'theme',
    'persona_id',
    'name',
    'bio',
    'existing_image_src',
    'filename',
    'output_path',
    'prompt',
  ].join(',');
  const csvRows = rows.map((row) => [
    csvEscape(row.batchLabel),
    csvEscape(row.themeName),
    csvEscape(row.personaId),
    csvEscape(row.name),
    csvEscape(row.bio),
    csvEscape(row.imageSrc),
    csvEscape(row.filename),
    csvEscape(row.outputPath),
    csvEscape(row.prompt),
  ].join(','));
  fs.writeFileSync(csvPath, `${csvHeader}\n${csvRows.join('\n')}\n`, 'utf8');

  return { jsonPath, csvPath };
}

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const personasModule = await import(pathToFileURL(path.join(repoRoot, 'src', 'data', 'themePersonas.js')).href);
  const catalogModule = await import(pathToFileURL(path.join(repoRoot, 'src', 'data', 'themeCatalog.js')).href);

  const { getThemePersonas } = personasModule;
  const { ALL_THEME_NAMES = [], CORE_THEME_NAMES = [] } = catalogModule;
  if (typeof getThemePersonas !== 'function') {
    throw new Error('getThemePersonas export not found in src/data/themePersonas.js');
  }

  const allThemeNames = [...new Set(ALL_THEME_NAMES)];
  const coreThemeNames = [...new Set(CORE_THEME_NAMES)];

  const allRows = allThemeNames.flatMap((themeName) => {
    const personas = getThemePersonas(themeName);
    return buildRows(themeName, personas, { batchLabel: 'all-themes' });
  });

  const coreRows = coreThemeNames.flatMap((themeName) => {
    const personas = getThemePersonas(themeName);
    return buildRows(themeName, personas, { batchLabel: 'core-themes' });
  });

  const allFiles = writeExportFiles('persona-avatar-prompts', allRows);
  const coreFiles = writeExportFiles('persona-avatar-prompts-core-themes', coreRows);

  console.log(`[exportPersonaAvatarPrompts] Wrote ${allRows.length} prompts across ${allThemeNames.length} themes.`);
  console.log(`- JSON: ${allFiles.jsonPath}`);
  console.log(`- CSV:  ${allFiles.csvPath}`);
  console.log(`[exportPersonaAvatarPrompts] Wrote ${coreRows.length} prompts for core/non-DLC first batch.`);
  console.log(`- JSON: ${coreFiles.jsonPath}`);
  console.log(`- CSV:  ${coreFiles.csvPath}`);
}

main().catch((error) => {
  console.error(`[exportPersonaAvatarPrompts] ${error.message}`);
  process.exit(1);
});
