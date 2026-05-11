#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'exports');

const STYLE_GUIDE_NOTES = [
  'Style guide: 1990s gritty adult-animation cartoon bust portrait (MTV-era rude-toon energy: deliberately awkward, angular, and "ugly-cool", not polished Disney).',
  'Line art: thick, bold, slightly irregular black outlines with hand-inked wobble.',
  'Color: saturated but grimy cel shading—flat fills plus simple hard-edged shadow shapes, muted urban palette with occasional loud accent (neon hair, loud print, brass, blood-red lip).',
  'Proportions: caricature exaggeration—when a tailored character block is present in this prompt, follow THAT body type, neck length, weight, and posture (do not default every portrait to the same lanky neck or same face template).',
  'Eyes: very large bulging eyes with tiny black pin-prick pupils for manic, vacant, or intense stares.',
  'Hair: big messy clumps, spikes, mullets, unnatural accent colors where it fits the character.',
  'Clothing: subculture costume to mid-chest only—faded graphic tees (no readable logos), punk/metal/streetwear, studs, chains, weathered jackets, theme-appropriate garb.',
  'Mood: rebellious, edgy, party-game suspicion; expressive mouths with gums/teeth okay when it sells the expression.',
  'Avoid cute, pretty, soft, doll-like, kawaii, chibi, anime sparkle eyes, children’s-book, glossy mobile-game, or generic influencer glam.',
  'Use one consistent portrait system for every persona: same camera distance, same body scale, same lighting angle, same line weight family.',
  'Original character art only (no logos, no text, no watermark, no recognizable real-person likeness, no copyrighted character).',
].join(' ');

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
const NAME_DETAIL_HINTS = [
  [/side[-\s]?eye/i, 'one eyebrow cocked, eyes cutting sideways suspiciously'],
  [/nightshift/i, 'tired eye bags and a battered takeaway coffee cup tucked close to the chest'],
  [/double[-\s]?check/i, 'two small checklist ticks tattooed on one wrist'],
  [/not impressed/i, 'deep frown lines and unimpressed downturned mouth'],
  [/mullet/i, 'dramatic scruffy mullet silhouette'],
  [/leopard/i, 'leopard-print jacket collar'],
  [/overthink/i, 'tense forehead wrinkles and bitten fingernails'],
  [/two[-\s]?buns/i, 'two messy hair buns'],
  [/low battery/i, 'tired drooping eyelids and tiny low-battery pin badge'],
  [/glance[-\s]?back/i, 'head slightly turned while eyes still face camera'],
  [/probably fine/i, 'forced grin with a tiny plaster on one cheek'],
  [/specs/i, 'oversized glasses with thick frames'],
  [/headphones/i, 'chunky headphones around the neck'],
  [/pink[-\s]?fur/i, 'loud pink faux-fur collar'],
  [/stoneface/i, 'stony blank expression and rigid jaw'],
  [/seen it all/i, 'world-weary eyelids and knowing stare'],
  [/grumble/i, 'muttering mouth shape and heavy brow'],
  [/greenhair/i, 'bright green hair'],
  [/curious/i, 'leaning-in eyes and inquisitive raised brow'],
  [/whisper/i, 'one finger near lips but still inside the bust crop'],
  [/watchful/i, 'wide watchful eyes with tiny crow’s-feet'],
  [/precision/i, 'neat razor-straight haircut and tidy collar'],
  [/backwards cap/i, 'backwards baseball cap'],
  [/red blazer/i, 'bright red blazer'],
  [/old tricks/i, 'older face, sly wrinkles, vintage waistcoat'],
  [/highlighter/i, 'neon highlighter clipped to jacket pocket'],
  [/last[-\s]?minute/i, 'messy rushed hair and crooked collar'],
  [/sticker/i, 'small sticker patches on jacket'],
  [/soft launch/i, 'phone-shaped pin badge and secretive smirk'],
  [/checkmate/i, 'chess-piece lapel pin'],
  [/half truths/i, 'one side of smile lifted, one eye squinting'],
  [/late reply/i, 'tired eyes and phone notification badge on jacket'],
  [/overfriendly/i, 'too-wide grin and intense eye contact'],
  [/plot twist/i, 'dramatic raised eyebrow and theatre-like collar'],
  [/pocket alibi/i, 'folded paper note peeking from jacket pocket'],
];

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
  const bio = String(persona?.bio || '').trim();
  const haystack = `${name} ${bio}`;
  const matches = NAME_DETAIL_HINTS
    .filter(([pattern]) => pattern.test(haystack))
    .map(([, detail]) => detail);
  const themeDetail = `${String(themeName || 'Default').trim()} theme influence in clothing color and attitude only, not background`;
  const seed = `${themeName}:${persona?.id || ''}:${persona?.name || ''}:details`;
  const fallback = [
    `${pickFrom(['small scar through one eyebrow', 'chipped tooth', 'asymmetrical grin', 'heavy under-eye shadows', 'sharp hooked nose', 'freckled cheeks', 'crooked ears', 'prominent chin'], seed, 'facial-mark')}`,
    `${pickFrom(['jacket pin', 'frayed collar', 'torn sleeve cuff', 'patched shoulder', 'scuffed lapel', 'loose neck scarf', 'worn hoodie strings', 'creased shirt pocket'], seed, 'name-detail')} inspired by the name`,
  ];
  return [...matches.slice(0, 3), themeDetail, ...fallback].slice(0, 5).join('; ');
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

function buildAvatarPrompt(persona, themeName, personaIndex = 0, tailoredSegments = {}) {
  const name = String(persona?.name || 'Unknown Persona').trim();
  const bio = String(persona?.bio || '').trim();
  const canonicalThemeName = String(themeName || 'Default').trim();
  const personaId = String(persona?.id || '').trim();
  const tailoredLook = typeof tailoredSegments[personaId] === 'string' ? tailoredSegments[personaId].trim() : '';

  const framing = [
    'Create one standardized 512-square persona illustration for a social-deduction party game.',
    STYLE_GUIDE_NOTES,
    'Background: perfectly flat, uniform SOLID pure white only — #FFFFFF (clean paper white), full-bleed to all edges; no gradients, no texture, no scenery, no floor, no cast shadow on the backdrop.',
    'Bold thick BLACK outer ink outline around the entire character (and costume edges) separating the figure from the white field; outline must be opaque black (no soft grey halation ring).',
    'Single character only, centered, facing camera in the same relaxed front-facing bust pose for every persona.',
    'Pose must be consistent: shoulders square to camera, head upright, arms and hands out of frame, no action pose, no full body.',
    'Consistent framing for every persona: head and upper torso visible, top of head around 10% from the top edge, shoulder line around 62%, torso ending around 85% from the top edge.',
    'Use only flat white (#FFFFFF) outside the black silhouette outline inside the frame; no props or scenery beyond the bust crop.',
    'CRITICAL — zero readable characters in the image: no letters, numbers, nametags, captions, speech bubbles, watermarks, logos, UI, or any written names (including on clothing, badges, or props).',
    'No border or frame beyond the illustration itself.',
  ];

  if (tailoredLook) {
    return [
      ...framing,
      `Specific tailored look for this persona (follow closely; keep them visually distinct from other roster characters): ${tailoredLook}`,
      'The tailored block OVERRIDES any generic one-size-fits-all wording elsewhere in this prompt (including default body/neck proportions).',
      'Match the age, ethnicity cues, and gender presentation implied by the description; obey any GENDER LOCK line literally; do not swap gender or default to a generic young woman.',
      'Do not reuse the same face, hair, clothing, body type, or expression from other personas.',
      'Small name/theme-inspired accessory is allowed only if it stays inside the bust crop; no large props and no background scene.',
      'Expressive face with readable suspicious party-game personality and silhouette-friendly shape language.',
      'Avoid realistic photo style; keep the 1990s adult-animation cartoon / grimy cel comic hybrid.',
      'Negative style constraints: not cute, not pretty doll, not kawaii, not chibi, not anime, not wholesome children’s cartoon, not glamour portrait.',
      'Do not include copyrighted characters or recognizable real people.',
      `Theme context for styling only — never render this theme title as text: ${canonicalThemeName}.`,
      `Figure identity for your reasoning only — never paint as lettering, badges, or captions: ${name}.`,
      `Expression and backstory for mood only — never quote or display as text: ${bio}`,
    ].join(' ');
  }

  const uniqueAppearance = buildUniqueAppearance(persona, canonicalThemeName, personaIndex);
  return [
    ...framing,
    `Unique visual design for this persona: ${uniqueAppearance}.`,
    'The gender must match the gender stated above; do not default every character to female.',
    'Do not reuse the same face, hair, clothing, body type, or expression from other personas.',
    'Small name/theme-inspired accessory is allowed only if it stays inside the bust crop; no large props and no background scene.',
    'Expressive face with readable suspicious party-game personality and silhouette-friendly shape language.',
    'Avoid realistic photo style; prefer gritty adult cartoon / punk comic hybrid.',
    'Negative style constraints: not cute, not pretty doll, not kawaii, not chibi, not anime, not wholesome children’s cartoon, not generic young woman, not glamour portrait.',
    'Do not include copyrighted characters or recognizable real people.',
    `Theme context for styling only — never render this theme title as text: ${canonicalThemeName}.`,
    `Figure identity for your reasoning only — never paint as lettering, badges, or captions: ${name}.`,
    `Expression and backstory for mood only — never quote or display as text: ${bio}`,
  ].join(' ');
}

function buildRows(themeName, personas, { batchLabel = 'all-themes', tailoredSegments = {} } = {}) {
  const themeFolder = themeSlug(themeName) || 'default';
  return (personas || []).map((persona, index) => {
    const personaId = String(persona?.id || `${themeFolder}-${index + 1}`).trim();
    const imageSrc = String(persona?.imageSrc || '').trim();
    const filename = filenameFromImageSrc(imageSrc, personaId);
    const outputPath = path.posix.join('/assets/themes', themeFolder, 'personas', filename);
    const prompt = buildAvatarPrompt(persona, themeName, index, tailoredSegments);
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
