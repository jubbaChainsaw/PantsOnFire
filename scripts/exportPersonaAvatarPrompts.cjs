#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { extractDisplayNameVisualSteer, formatNameVisualMandateBlock } = require('./personaNameVisualCues.cjs');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'exports');

/** Single style line for compact prompts (hosted reference carries most look). */
const REF_STYLE_ONE_LINER =
  'Cel-shaded rude-toon bust (1990s adult-animation party-game energy): thick black ink, big pin-prick eyes, readable colors — not filthy, not cute, not anime; match hosted style reference for line weight and shading only, never its character identity.';

const FACE_SHAPES = ['heavy square jaw', 'long narrow face', 'crooked nose and pointed chin', 'broad cheekbones with sunken cheeks', 'round face with intense eyes', 'sharp triangular face', 'wide jaw with thick neck', 'gaunt face with deep eye bags'];
const HAIR_STYLES = ['short spiked hair', 'messy medium punk hair', 'shaggy mullet', 'buzzed sides with jagged top', 'greasy side part', 'wild curly hair', 'two messy buns', 'long tied-back hair with loose strands'];
const HAIR_COLORS = ['jet black', 'dirty blonde', 'copper red', 'bleached yellow', 'dark brown', 'blue-black', 'bottle green', 'silver grey'];
const SKIN_TONES = ['deep brown skin', 'rich dark skin', 'medium brown skin', 'olive skin', 'warm tan skin', 'light brown skin', 'fair freckled skin', 'pale skin with flushed cheeks'];
const BODY_TYPES = ['skinny wiry build', 'broad-shouldered build', 'stocky pub-bouncer build', 'tall lanky build', 'compact athletic build', 'soft rounded build', 'strong square build', 'short wiry build'];
const CLOTHING = ['scuffed leather jacket over a black tee', 'oversized hoodie with frayed cuffs', 'loud patterned bomber jacket', 'creased button-up shirt with rolled sleeves', 'ripped denim jacket with pins', 'chunky knit jumper with stretched collar', 'bright tracksuit top with worn zip', 'sharp blazer over a faded band-style tee'];
const ACCESSORIES = ['round cracked glasses', 'small hoop earrings', 'thick eyebrows and no accessories', 'thin rectangular glasses', 'single ear cuff', 'scruffy scarf at the neck', 'backwards baseball cap', 'chunky chain necklace'];
const EXPRESSIONS = ['hard side-eye suspicion', 'wide-eyed panic', 'smug half-smile', 'nervous teeth-baring grin', 'deadpan stare', 'raised-eyebrow doubt', 'crooked playful smirk', 'caught-in-the-act shock'];
const MALE_NAME_HINTS = new Set([
  'barry', 'marvin', 'callum', 'gregor', 'leon', 'dave', 'malik', 'ronan', 'colin', 'yusuf',
  'kyle', 'arthur', 'nico', 'marco', 'oscar', 'dex', 'jules', 'freddie', 'owen', 'sergeant',
  'kev', 'ricky', 'tony', 'mick', 'davey', 'lenny', 'omar', 'pete', 'ronnie', 'dan',
  'reginald', 'arthur', 'thomas', 'harold', 'bernard', 'doyle', 'cedric', 'douglas',
  'leonard', 'victor', 'rupert', 'captain', 'count', 'eddie', 'barry', 'stu', 'bill',
  'topper', 'alaric', 'voss', 'jester', 'hollow', 'grizzlehook', 'len', 'bill', 'garrick',
  'tom', 'redd', 'jenkins', 'burke', 'rami', 'dreg', 'harlan', 'silas', 'donny', 'kaito'
]);
const FEMALE_NAME_HINTS = new Set([
  'nina', 'edith', 'tasha', 'pixie', 'zara', 'penny', 'chloe', 'rachel', 'jett', 'amy',
  'ingrid', 'bianca', 'harper', 'sadie', 'cleo', 'lena', 'priya', 'naomi', 'carmen',
  'agatha', 'lillian', 'margaret', 'vivian', 'clara', 'mabel', 'beatrice', 'nora',
  'winifred', 'evelyn', 'helena', 'mildred', 'maeve', 'nyx', 'lira', 'elin', 'nettles',
  'zuri', 'bride', 'annie', 'mel', 'beth', 'hilda', 'mourne', 'sadie', 'floe', 'fang'
]);
const NON_BINARY_NAME_HINTS = new Set(['jules', 'rio', 'reefspawn', 'glim', 'void', 'rook']);

function hashString(value = '') {
  let hash = 2166136261;
  const input = String(value || '');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFrom(list, seed, salt = '') {
  const hash = hashString(`${seed}:${salt}`);
  return list[hash % list.length];
}

function pickByIndex(list, personaIndex = 0, multiplier = 1, offset = 0) {
  return list[(Math.max(0, Number(personaIndex) || 0) * multiplier + offset) % list.length];
}

function inferGenderPresentation(persona, hash) {
  const name = String(persona?.name || '').trim().toLowerCase();
  const bio = String(persona?.bio || '').trim().toLowerCase();
  const firstName = name.replace(/["“”'().]/g, '').split(/\s+/).filter(Boolean)[0] || '';
  if (/\b(she|her|hers|woman|girl|lady|queen|bride|mother|mum|granny)\b/.test(bio) || FEMALE_NAME_HINTS.has(firstName)) {
    return 'female';
  }
  if (/\b(he|him|his|man|boy|father|king|captain|sergeant|inspector)\b/.test(bio) || MALE_NAME_HINTS.has(firstName)) {
    return 'male';
  }
  if (/\b(they|them|their|nonbinary|non-binary)\b/.test(bio) || NON_BINARY_NAME_HINTS.has(firstName)) {
    return 'non-binary';
  }
  return ['male', 'female', 'non-binary'][hash % 3];
}

function buildNameSpecificDetails(persona, themeName, hash) {
  const name = String(persona?.name || '').trim();
  const steer = extractDisplayNameVisualSteer(name);
  const fromName = steer.mandateLines.slice(0, 4);
  const themeDetail = `${String(themeName || 'Default').trim()} theme influence in clothing color and attitude only, not background`;
  const seed = `${themeName}:${persona?.id || ''}:${persona?.name || ''}:details`;
  const fallback = [
    `${pickFrom(['small scar through one eyebrow', 'chipped tooth', 'asymmetrical grin', 'heavy under-eye shadows', 'sharp hooked nose', 'freckled cheeks', 'crooked ears', 'prominent chin'], seed, 'facial-mark')}`,
    `${pickFrom(['jacket pin', 'frayed collar', 'torn sleeve cuff', 'patched shoulder', 'scuffed lapel', 'loose neck scarf', 'worn hoodie strings', 'creased shirt pocket'], seed, 'name-detail')} inspired by the name`,
  ];
  return [...fromName, themeDetail, ...fallback].slice(0, 6).join('; ');
}

function buildUniqueAppearance(persona, themeName, personaIndex = 0) {
  const seed = `${themeName}:${personaIndex}:${persona?.id || ''}:${persona?.name || ''}:${persona?.bio || ''}`;
  const hash = hashString(seed);
  const themeOffset = hashString(String(themeName || 'Default'));
  const genderPresentation = inferGenderPresentation(persona, hash);
  const nameSpecificDetails = buildNameSpecificDetails(persona, themeName, hash);
  return [
    `gender: ${genderPresentation}`,
    `${pickByIndex(SKIN_TONES, personaIndex, 1, themeOffset)}, ${pickByIndex(FACE_SHAPES, personaIndex, 3, themeOffset)}`,
    `${pickByIndex(HAIR_COLORS, personaIndex, 5, themeOffset)} ${pickByIndex(HAIR_STYLES, personaIndex, 7, themeOffset)}`,
    `${pickByIndex(BODY_TYPES, personaIndex, 3, themeOffset)}`,
    `wearing a ${pickByIndex(CLOTHING, personaIndex, 5, themeOffset)}`,
    `${pickByIndex(ACCESSORIES, personaIndex, 7, themeOffset)}`,
    `expression: ${pickByIndex(EXPRESSIONS, personaIndex, 3, themeOffset)}`,
    `name/theme-specific details: ${nameSpecificDetails}`,
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

function loadTailoredSegmentMap() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) return {};
  const files = fs
    .readdirSync(dir)
    .filter((filename) => filename.startsWith('personaAvatarTailored') && filename.endsWith('.json'));
  files.sort();
  return files.reduce((acc, filename) => {
    const fullPath = path.join(dir, filename);
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return { ...acc, ...parsed };
  }, {});
}

function betweenMarkers(full, start, end) {
  const s = String(full || '');
  const a = s.indexOf(start);
  if (a === -1) return '';
  if (!end) return s.slice(a).trim();
  const b = s.indexOf(end, a + start.length);
  if (b === -1) return s.slice(a).trim();
  return s.slice(a, b).trim();
}

/** Pull highest-signal clauses from hyperspecific tailored text for short WAN prompts. */
function distillTailoredForWan(tailored, maxLen = 1350) {
  const t = String(tailored || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const faceI = t.indexOf('Face:');
  const head = t.includes('GENDER LOCK')
    ? betweenMarkers(t, 'GENDER LOCK', 'Face:')
    : (faceI > 0 ? t.slice(0, faceI).trim() : '');
  const hairToTheme = betweenMarkers(t, 'Hair:', 'Theme bust costume steer:');
  const parts = [
    head,
    betweenMarkers(t, 'Face:', 'Facial hair:'),
    betweenMarkers(t, 'Facial hair:', 'Hair:'),
    hairToTheme,
    betweenMarkers(t, 'Theme bust costume steer:', 'Silhouette quirk:'),
    betweenMarkers(t, 'Silhouette quirk:', 'Acting vibe from bio'),
  ];
  if (t.includes('Acting vibe from bio')) {
    parts.push(betweenMarkers(t, 'Acting vibe from bio', ''));
  }
  let out = parts.filter(Boolean).join(' ');
  if (out.length > maxLen) out = `${out.slice(0, maxLen - 1).trimEnd()}…`;
  return out;
}

/**
 * WAN-first compact prompt: layout + style + title costume + distilled hero traits (no long guide wall).
 */
function buildCompactPersonaPrompt(persona, themeName, personaIndex = 0, tailoredSegments = {}) {
  const name = String(persona?.name || 'Unknown Persona').trim();
  const bio = String(persona?.bio || '').trim();
  const nameVisualMandate = formatNameVisualMandateBlock(name);
  const canonicalThemeName = String(themeName || 'Default').trim();
  const personaId = String(persona?.id || '').trim();
  const tailoredLook = typeof tailoredSegments[personaId] === 'string' ? tailoredSegments[personaId].trim() : '';

  const layout = [
    'PERSONA BUST — exactly one original character.',
    'LAYOUT: 512 square; head + upper torso; front-facing; shoulders square; arms/hands out of frame.',
    'BACKGROUND: flat pure white #FFFFFF full bleed; bold black outer silhouette ink; no floor shadow on backdrop.',
    'NO TEXT: zero readable letters, numbers, logos, watermarks, nametags, captions, or UI in the image.',
  ].join(' ');

  const hero = tailoredLook
    ? distillTailoredForWan(tailoredLook, 1000)
    : String(buildUniqueAppearance(persona, canonicalThemeName, personaIndex) || '').trim().slice(0, 800);

  const bioShort = bio.length > 160 ? `${bio.slice(0, 160).trim()}…` : bio;

  const chunks = [
    layout,
    `STYLE: ${REF_STYLE_ONE_LINER}`,
    `THEME MOOD (never render this title as text): ${canonicalThemeName}.`,
    nameVisualMandate,
    `HERO LOOK — obey every clause (gender, age, face, hair, clothing, jewelry, expression): ${hero}`,
    bioShort ? `VIBE FROM BIO (mood only; never quote as text): ${bioShort}` : '',
    `ROSTER NAME (reasoning only; never paint as lettering): ${name}.`,
  ].filter(Boolean);
  let body = chunks.join('\n\n');
  // Keep headroom for WAN preamble (~245) + hoisted title mandate so fal’s 2k cap rarely trims at send time.
  if (body.length > 1650) {
    body = `${body.slice(0, 1649).trimEnd()}…`;
  }
  return body;
}

function buildRows(themeName, personas, { batchLabel = 'all-themes', tailoredSegments = {} } = {}) {
  const themeFolder = themeSlug(themeName) || 'default';
  return (personas || []).map((persona, index) => {
    const personaId = String(persona?.id || `${themeFolder}-${index + 1}`).trim();
    const imageSrc = String(persona?.imageSrc || '').trim();
    const filename = filenameFromImageSrc(imageSrc, personaId);
    const outputPath = path.posix.join('/assets/themes', themeFolder, 'personas', filename);
    const prompt = buildCompactPersonaPrompt(persona, themeName, index, tailoredSegments);
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

  const tailoredSegments = loadTailoredSegmentMap();
  console.log(`[exportPersonaAvatarPrompts] Loaded ${Object.keys(tailoredSegments).length} tailored prompt overrides from scripts/data.`);

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
    return buildRows(themeName, personas, { batchLabel: 'all-themes', tailoredSegments });
  });

  const coreRows = coreThemeNames.flatMap((themeName) => {
    const personas = getThemePersonas(themeName);
    return buildRows(themeName, personas, { batchLabel: 'core-themes', tailoredSegments });
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
