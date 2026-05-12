#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'exports');

/**
 * Fixed positive prompt for fal WAN edit (style ref is separate image_urls).
 * Only {{CHARACTER_NAME}}, {{THEME}}, and {{PERSONALITY_DESCRIPTION}} are substituted per persona.
 */
const MTV_PARTY_GAME_POSITIVE_TEMPLATE = `Create a stylised 2D 90s adult MTV style cartoon bust portrait for a social bluffing party game with a pure white background. Use the supplied reference image as the STRICT primary style reference. Match its linework, proportions, exaggeration, shading, colour intensity, facial style and overall visual language.

Name: "{{CHARACTER_NAME}}"
Theme: "{{THEME}}"
Personality: "{{PERSONALITY_DESCRIPTION}}"

The character MUST visually reflect the name, theme and personality. Interpret meaningful words in the name as visual traits, hairstyle, clothing, colours, accessories, patterns or attitude. Use the first name to strongly influence gender presentation and age style.

Theme elements must clearly influence outfit, styling and persona. Personality must strongly influence expression, eyes, mouth, posture and energy.

Bust portrait ONLY. Show head, shoulders and upper chest only. Character facing mostly toward camera. Entire head and hair fully inside frame. No hands, legs or full body.

Randomise ethnicity, facial structure, age, hairstyle and accessories while keeping the same art style universe.

STYLE RULES:
thick black outlines, bold silhouette, exaggerated cartoon features, expressive face, cel shading, clean shapes, high contrast, edgy modern party-game style, no realism, no text, no logos, no scenery, no extra objects.`;

/** Keep quoted fields JSON/CSV-safe: no raw double-quotes inside the outer "Name: \"...\"" pair. */
function escapeForPromptQuotedField(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/"/g, "'")
    .trim();
}

function buildPersonaAvatarPrompt(persona, themeName) {
  const name = escapeForPromptQuotedField(persona?.name || 'Unknown Persona');
  const theme = escapeForPromptQuotedField(themeName || 'Default');
  const bio = escapeForPromptQuotedField(persona?.bio || '');
  return MTV_PARTY_GAME_POSITIVE_TEMPLATE
    .replace('{{CHARACTER_NAME}}', name)
    .replace('{{THEME}}', theme)
    .replace('{{PERSONALITY_DESCRIPTION}}', bio);
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

function buildRows(themeName, personas, { batchLabel = 'all-themes' } = {}) {
  const themeFolder = themeSlug(themeName) || 'default';
  return (personas || []).map((persona, index) => {
    const personaId = String(persona?.id || `${themeFolder}-${index + 1}`).trim();
    const imageSrc = String(persona?.imageSrc || '').trim();
    const filename = filenameFromImageSrc(imageSrc, personaId);
    const outputPath = path.posix.join('/assets/themes', themeFolder, 'personas', filename);
    const prompt = buildPersonaAvatarPrompt(persona, themeName);
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
      wanPrompt: prompt,
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
