#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { applyChromaKeyTransparency, DEFAULT_CHROMA_TOLERANCE } = require('./personaChromaKey.cjs');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const promptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts.json');
const corePromptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts-core-themes.json');
const DEFAULT_FAL_WAN_EDIT_MODEL = 'fal-ai/wan/v2.7/edit';
const DEFAULT_FAL_NANO_BANANA_MODEL = 'fal-ai/nano-banana/edit';
const DEFAULT_FAL_TEXT_MODEL = 'fal-ai/flux/dev';
const DEFAULT_OPENAI_MODEL = 'gpt-image-1';
/** Style reference only (not identity); WAN edit uses image_urls[0] as art-style anchor. */
const DEFAULT_PERSONA_STYLE_REFERENCE_URL =
  'https://media.craiyon.com/2025-08-06/Kx1Iy3b-RCSGhKhPYW3Aog.webp';
/** Max 500 chars for fal WAN negative_prompt. */
const DEFAULT_PERSONA_NEGATIVE_PROMPT =
  'photorealistic, DSLR, 3D render, CGI, airbrushed, '
  + 'copying reference identity, same hair or outfit as reference image, extra faces, second person, '
  + 'text, captions, nametags, speech bubbles, watermark, logo, '
  + 'gradient background, vignette, textured backdrop, environment, floor shadow, '
  + 'colored backdrop, grey cast, yellow color cast, mottled off-white, '
  + 'mud stains, filthy clothes, grease smears, yellow teeth, '
  + 'lowres, motion blur, deformed hands, extra limbs, child, underage, nudity, gore';
/** fal-ai/wan/v2.7/edit validates `prompt` length (HTTP 422 if exceeded). */
const WAN_EDIT_PROMPT_CHAR_LIMIT = 2000;
const STANDARD_PERSONA_OUTPUT_SPEC = [
  'MANDATORY OUTPUT SPEC:',
  '- 512x512 square PNG.',
  '- Background: perfectly flat, uniform SOLID pure white (#FFFFFF) from edge to edge. No gradients, no texture, no props, no scene, no cast shadow on the backdrop.',
  '- Bold thick BLACK outer ink outline around the entire character silhouette (and costume edges); background stays uniformly white outside the figure.',
  '- One character only, centered, head and upper torso visible.',
  '- Standardized pose for every persona: relaxed front-facing bust portrait, shoulders square to camera, head upright, arms and hands out of frame.',
  '- Standardized scale: top of head about 10% from top edge, shoulder line around 62%, torso ending around 85% from top edge (same composition rules at 512px).',
  '- Consistent camera distance, lighting direction, line weight, and cel-shaded party-game illustration style across every persona.',
  '- Preserve the unique physical traits, clothing, and expression described in the prompt; do not make characters look like the same person.',
  '- Preserve the stated gender presentation exactly; do not feminize male or non-binary personas.',
  '- 1990s adult-animation rude-toon style: thick ink lines, bulging eyes with pin pupils, awkward faces, cel-shaded readable color—not mud, grease smears, or filthy clothing.',
  '- Teeth: neutral off-white or lips closed; avoid yellow nicotine stains or rotten-teeth shock.',
  '- Negative style: no cute anime, no chibi, no kawaii, no pretty doll, no generic young woman, no children’s illustration, no glamour portrait.',
  '- Keep clean padding around the silhouette for circular in-game avatar framing.',
  '- No readable characters anywhere: no letters, numbers, nametags, captions, speech bubbles, subtitles, watermarks, logos, UI, or written names on clothing or props.',
  '- No text, no logo, no watermark, no border, no frame, no floor shadow.',
  '- Do not fake transparency (no checkerboard, no alpha holes, no punched-out background).',
].join('\n');

function parseArgs(argv) {
  const options = {
    provider: 'fal',
    model: '',
    size: '512x512',
    quality: 'medium',
    theme: '',
    promptFile: '',
    referenceImage: '',
    styleReferenceUrl: '',
    negativePrompt: '',
    useExistingReference: false,
    limit: 0,
    dryRun: false,
    overwrite: false,
    chromaKey: false,
    chromaTolerance: DEFAULT_CHROMA_TOLERANCE,
    chromaFringe: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--provider') { options.provider = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; }
    else if (arg === '--model') { options.model = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--size') { options.size = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--quality') { options.quality = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--theme' || arg === '--only-theme') { options.theme = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--prompt-file') { options.promptFile = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--reference-image') { options.referenceImage = path.resolve(repoRoot, String(argv[i + 1] || '').trim()); i += 1; }
    else if (arg === '--style-reference-url') { options.styleReferenceUrl = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--negative-prompt') { options.negativePrompt = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--use-existing-reference') options.useExistingReference = true;
    else if (arg === '--limit') { options.limit = Math.max(0, Number.parseInt(String(argv[i + 1] || '0'), 10) || 0); i += 1; }
    else if (arg === '--api-key') { options.apiKey = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--overwrite') options.overwrite = true;
    else if (arg === '--chroma-key') options.chromaKey = true;
    else if (arg === '--no-chroma-key') options.chromaKey = false;
    else if (arg === '--no-chroma-fringe') options.chromaFringe = false;
    else if (arg === '--chroma-fringe') options.chromaFringe = true;
    else if (arg === '--chroma-tolerance') {
      options.chromaTolerance = Math.max(0, Number.parseInt(String(argv[i + 1] || String(DEFAULT_CHROMA_TOLERANCE)), 10) || DEFAULT_CHROMA_TOLERANCE);
      i += 1;
    }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log('Usage: npm run persona:generate-avatars -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --provider <fal|flux|openai> Image provider (default: fal; fal defaults to WAN v2.7 edit)');
  console.log('  --api-key <key>           Provider API key');
  console.log(`  --model <name>            Model override (fal default: ${DEFAULT_FAL_WAN_EDIT_MODEL}; legacy: ${DEFAULT_FAL_NANO_BANANA_MODEL} / ${DEFAULT_FAL_TEXT_MODEL}; OpenAI: ${DEFAULT_OPENAI_MODEL})`);
  console.log('  --size <WxH>              Output size (default: 512x512 for fal WAN; OpenAI uses this string)');
  console.log('  --quality <low|medium|high> OpenAI image quality (default: medium)');
  console.log('  --theme <themeName>       Limit generation to one theme');
  console.log('  --prompt-file <path>      Override prompts JSON input file');
  console.log('  --reference-image <path>  Legacy: local file for fal Nano Banana edit only (WAN ignores this)');
  console.log(`  --style-reference-url <u> Override WAN style-only reference URL (default: ${DEFAULT_PERSONA_STYLE_REFERENCE_URL})`);
  console.log('  --negative-prompt <text>  Override WAN negative prompt (max 500 chars; has a strong default)');
  console.log(`  (WAN) Prompts are packed to ${WAN_EDIT_PROMPT_CHAR_LIMIT} chars for fal API; long exports keep style preamble + GENDER LOCK/tailored block.`);
  console.log('  --chroma-key              Legacy: post-process flat #FF00FF field → alpha via sharp (default: off; white plate PNGs)');
  console.log('  --no-chroma-key           Skip magenta chroma post (same as default)');
  console.log(`  --chroma-tolerance <0-255> Per-channel distance for strict key box (default: ${DEFAULT_CHROMA_TOLERANCE})`);
  console.log('  --chroma-fringe           Optional second pass for dark magenta AA halos (default off)');
  console.log('  --use-existing-reference  Legacy Nano Banana: use existing output PNG as edit reference (WAN ignores)');
  console.log('  --limit <n>               Limit number of personas processed after filters');
  console.log('  --overwrite               Regenerate files even if they already exist');
  console.log('  --dry-run                 Print what would be generated without writing files');
  console.log('');
  console.log('API keys:');
  console.log('  fal/flux: --api-key, FAL_KEY, FAL_API_KEY, FLUX_API_KEY, or scripts/royaltyFreeApiKeys.local.json (falApiKey / fluxApiKey)');
  console.log('  OpenAI:   --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey)');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function resolveApiKey(provider, cliKey) {
  if (cliKey) return cliKey;
  if (provider === 'openai') {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    const local = readJsonSafe(localKeysPath, {});
    return String(local.openaiApiKey || '').trim();
  }
  if (provider === 'fal' || provider === 'flux') {
    if (process.env.FAL_KEY) return process.env.FAL_KEY;
    if (process.env.FAL_API_KEY) return process.env.FAL_API_KEY;
    if (process.env.FLUX_API_KEY) return process.env.FLUX_API_KEY;
    const local = readJsonSafe(localKeysPath, {});
    return String(local.falApiKey || local.fluxApiKey || '').trim();
  }
  return '';
}

function loadPromptRecords({ promptFile = '', theme = '' } = {}) {
  const selectedPath = promptFile
    ? path.resolve(repoRoot, promptFile)
    : (fs.existsSync(corePromptsJsonPath) ? corePromptsJsonPath : promptsJsonPath);
  if (!fs.existsSync(selectedPath)) {
    throw new Error(`Missing prompt file: ${selectedPath}. Run npm run persona:export-avatar-prompts first.`);
  }
  const all = readJsonSafe(selectedPath, []);
  if (!Array.isArray(all)) {
    throw new Error(`Invalid prompt file: ${selectedPath}`);
  }
  if (!theme) return all;
  const normalized = theme.trim().toLowerCase();
  return all.filter((entry) => String(entry.themeName || '').trim().toLowerCase() === normalized);
}

function inferThemeFolder(themeName = 'default') {
  return String(themeName || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPersonaOutputPath(record) {
  const src = String(record.imageSrc || '').trim();
  const normalized = src.startsWith('/') ? src.slice(1) : src;
  if (!normalized) {
    const themeFolder = inferThemeFolder(record.themeName || 'default');
    const fallbackName = `${String(record.personaId || record.id || 'persona').replace(/[^a-z0-9-]+/gi, '-')}.png`;
    return path.join(repoRoot, 'public', 'assets', 'themes', themeFolder, 'personas', fallbackName);
  }
  return path.join(repoRoot, 'public', normalized);
}

function standardizePrompt(prompt = '') {
  return [
    String(prompt || '').trim(),
    '',
    STANDARD_PERSONA_OUTPUT_SPEC,
  ].filter(Boolean).join('\n');
}

async function generateWithOpenAi({ prompt, apiKey, model, size, quality }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      n: 1,
      background: 'transparent',
      output_format: 'png',
    }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`OpenAI image generation failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageBase64 = payload?.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('OpenAI response did not include image data.');
  }
  return Buffer.from(imageBase64, 'base64');
}

function readImageInputForFal(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Nano Banana edit requires an existing reference image: ${path.relative(repoRoot, filePath)}`);
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png'
    ? 'image/png'
    : ext === '.webp'
      ? 'image/webp'
      : 'image/jpeg';
  const buffer = fs.readFileSync(filePath);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function parseImageSize(size = '512x512') {
  const match = String(size || '').trim().match(/^(\d+)x(\d+)$/i);
  if (!match) return { width: 512, height: 512 };
  return {
    width: Math.max(256, Math.min(1536, Number(match[1]) || 512)),
    height: Math.max(256, Math.min(1536, Number(match[2]) || 512)),
  };
}

function isWanV27EditModel(modelId = '') {
  return String(modelId || '').replace(/^\/+/, '').includes('fal-ai/wan/v2.7/edit');
}

function wanEditStylePreamble() {
  return (
    'Img1=style-only (bold ink, cel-shade, readable color); never copy identity. '
    + 'Flat SOLID pure white (#FFFFFF) backdrop only; bold thick BLACK outer outline around full silhouette; '
    + '512 bust, 1 character, zero text/names/captions in-image. Subject: '
  );
}

/** WAN appends MANDATORY OUTPUT SPEC via standardizePrompt(); that duplicates negatives and blows the 2k cap—drop it here. */
function stripWanDuplicateOutputSpec(promptText) {
  const s = String(promptText || '');
  const marker = '\nMANDATORY OUTPUT SPEC:';
  const idx = s.indexOf(marker);
  if (idx === -1) return s.trim();
  return s.slice(0, idx).trimEnd();
}

/**
 * fal WAN edit allows at most WAN_EDIT_PROMPT_CHAR_LIMIT characters on `prompt`.
 * TITLE COSTUME MANDATE must survive truncation (it lives near the end of exports).
 */
const TITLE_COSTUME_MARK = 'TITLE COSTUME MANDATE (NON-NEGOTIABLE):';
const THEME_CONTEXT_MARK = '\nTheme context for styling only';

function extractTitleCostumeMandateBlock(fullPrompt) {
  const s = String(fullPrompt || '');
  const i = s.indexOf(TITLE_COSTUME_MARK);
  if (i === -1) return { title: '', withoutTitle: s.trim() };
  const j = s.indexOf(THEME_CONTEXT_MARK, i);
  const title = (j === -1 ? s.slice(i) : s.slice(i, j)).trim();
  const before = s.slice(0, i).trimEnd();
  const after = j === -1 ? '' : s.slice(j).trimStart();
  const withoutTitle = [before, after].filter(Boolean).join('\n').trim();
  return { title, withoutTitle };
}

function fitWanEditPromptToLimit(preamble, corePrompt) {
  const max = WAN_EDIT_PROMPT_CHAR_LIMIT;
  const p = String(preamble || '');
  const stripped = String(corePrompt || '').trim();
  const { title, withoutTitle } = extractTitleCostumeMandateBlock(stripped);
  const prefix = title ? `${p}${title}\n` : p;
  const maxCore = max - prefix.length;

  let core = withoutTitle.trim();
  let full = `${prefix}${core}`;
  if (full.length <= max) return { text: full, truncated: false };

  const genderIdx = core.indexOf('GENDER LOCK');
  const tailoredIdx = core.indexOf('Specific tailored look for this persona');
  if (genderIdx >= 0) core = core.slice(genderIdx).trimStart();
  else if (tailoredIdx >= 0) core = core.slice(tailoredIdx).trimStart();
  else core = core.slice(Math.max(0, core.length - maxCore)).trimStart();

  full = `${prefix}${core}`;
  if (full.length <= max) return { text: full, truncated: true };

  const ellipsis = '…';
  if (maxCore < ellipsis.length + 8) {
    return { text: prefix.slice(0, max).trimEnd(), truncated: true };
  }
  core = `${core.slice(0, maxCore - ellipsis.length).trimEnd()}${ellipsis}`;
  return { text: `${prefix}${core}`, truncated: true };
}

async function generateWithFalWanEdit({
  prompt,
  apiKey,
  modelId,
  width,
  height,
  styleReferenceUrl,
  negativePrompt,
}) {
  const refUrl = String(styleReferenceUrl || DEFAULT_PERSONA_STYLE_REFERENCE_URL).trim();
  const neg = String(negativePrompt || DEFAULT_PERSONA_NEGATIVE_PROMPT).trim().slice(0, 500);
  const preamble = wanEditStylePreamble();
  const withoutDupSpec = stripWanDuplicateOutputSpec(String(prompt || '').trim());
  const beforeFitLen = `${preamble}${withoutDupSpec}`.length;
  const fit = fitWanEditPromptToLimit(preamble, withoutDupSpec);
  if (fit.truncated) {
    console.warn(
      `[generatePersonaAvatars] WAN prompt packed to ${WAN_EDIT_PROMPT_CHAR_LIMIT} chars (fal API limit). `
      + `Length before packing (after dropping duplicate output spec): ${beforeFitLen}.`
    );
  }
  const combined = fit.text.length > WAN_EDIT_PROMPT_CHAR_LIMIT
    ? fit.text.slice(0, WAN_EDIT_PROMPT_CHAR_LIMIT)
    : fit.text;

  const body = {
    prompt: combined,
    image_urls: [refUrl],
    negative_prompt: neg,
    image_size: { width, height },
    num_images: 1,
    output_format: 'png',
    enable_prompt_expansion: false,
    enable_safety_checker: true,
  };

  const id = String(modelId || DEFAULT_FAL_WAN_EDIT_MODEL).replace(/^\/+/, '');
  console.log(`[generatePersonaAvatars] fal.ai WAN v2.7 edit via ${id} (${width}x${height}), style ref URL only (not identity): ${refUrl}`);

  const response = await fetch(`https://fal.run/${id}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`fal.ai WAN edit failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageUrl = String(
    payload
    && Array.isArray(payload.images)
    && payload.images[0]
    && payload.images[0].url
      ? payload.images[0].url
      : ''
  ).trim();
  if (!imageUrl) {
    throw new Error(`fal.ai response did not include an image URL: ${JSON.stringify(payload)}`);
  }
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const message = await imageResponse.text().catch(() => '');
    throw new Error(`fal.ai image download failed: HTTP ${imageResponse.status} ${message}`);
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateWithFal({
  prompt,
  apiKey,
  model,
  size,
  referenceImagePath,
  fallbackReferenceImagePath,
  useExistingReference = false,
  styleReferenceUrl = '',
  negativePrompt = '',
}) {
  const requestedModel = String(model || '').trim().replace(/^\/+/, '');
  if (isWanV27EditModel(requestedModel)) {
    const { width, height } = parseImageSize(size);
    return generateWithFalWanEdit({
      prompt,
      apiKey,
      modelId: requestedModel,
      width,
      height,
      styleReferenceUrl,
      negativePrompt,
    });
  }

  const primaryReferenceExists = Boolean(useExistingReference) && fs.existsSync(referenceImagePath);
  const fallbackReferenceExists = Boolean(fallbackReferenceImagePath) && fs.existsSync(fallbackReferenceImagePath);
  const hasReference = primaryReferenceExists || fallbackReferenceExists;
  const selectedReferencePath = primaryReferenceExists ? referenceImagePath : fallbackReferenceImagePath;
  const modelId = requestedModel
    ? (
        hasReference && requestedModel === DEFAULT_FAL_TEXT_MODEL
          ? DEFAULT_FAL_NANO_BANANA_MODEL
          : (!hasReference && requestedModel === DEFAULT_FAL_NANO_BANANA_MODEL)
            ? DEFAULT_FAL_TEXT_MODEL
            : requestedModel
      )
    : (hasReference ? DEFAULT_FAL_NANO_BANANA_MODEL : DEFAULT_FAL_TEXT_MODEL);
  const imageInput = hasReference ? readImageInputForFal(selectedReferencePath) : '';
  const { width, height } = parseImageSize(size);
  const body = hasReference
    ? {
        prompt,
        image_urls: [imageInput],
        num_images: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        sync_mode: false,
      }
    : {
        prompt,
        image_size: { width, height },
        num_images: 1,
        output_format: 'png',
        enable_safety_checker: true,
        sync_mode: false,
      };
  console.log(
    `[generatePersonaAvatars] fal.ai mode: ${hasReference ? 'nano-banana-edit' : 'text-to-image'} via ${modelId}${primaryReferenceExists ? '' : ' (fallback reference)'}`
  );
  const response = await fetch(`https://fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`fal.ai request failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageUrl = String(
    payload
    && Array.isArray(payload.images)
    && payload.images[0]
    && payload.images[0].url
      ? payload.images[0].url
      : ''
  ).trim();
  if (!imageUrl) {
    throw new Error(`fal.ai response did not include an image URL: ${JSON.stringify(payload)}`);
  }
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const message = await imageResponse.text().catch(() => '');
    throw new Error(`fal.ai image download failed: HTTP ${imageResponse.status} ${message}`);
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (!['fal', 'flux', 'openai'].includes(options.provider)) {
    throw new Error(`Unsupported provider "${options.provider}". Use "fal", "flux", or "openai".`);
  }

  const apiKey = resolveApiKey(options.provider, options.apiKey);
  if (!apiKey && !options.dryRun) {
    if (options.provider === 'openai') {
      throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
    }
    throw new Error('Missing fal.ai API key. Use --api-key, FAL_KEY, FAL_API_KEY, FLUX_API_KEY, or scripts/royaltyFreeApiKeys.local.json (falApiKey / fluxApiKey).');
  }
  const model = options.model || (
    options.provider === 'openai'
      ? DEFAULT_OPENAI_MODEL
      : (options.provider === 'flux' ? '' : DEFAULT_FAL_WAN_EDIT_MODEL)
  );

  const allRecords = loadPromptRecords({ promptFile: options.promptFile, theme: options.theme });
  const records = options.limit > 0 ? allRecords.slice(0, options.limit) : allRecords;
  if (!records.length) {
    console.log('[generatePersonaAvatars] No personas matched filters.');
    return;
  }

  console.log(`[generatePersonaAvatars] Provider: ${options.provider}`);
  console.log(`[generatePersonaAvatars] Model: ${model || 'automatic'}`);
  console.log(`[generatePersonaAvatars] Records: ${records.length}${options.limit > 0 ? ` (limited from ${allRecords.length})` : ''}`);
  if (options.provider !== 'openai') {
    console.log(`[generatePersonaAvatars] Legacy local reference (--reference-image): ${options.referenceImage ? path.relative(repoRoot, options.referenceImage) : 'none'}`);
    console.log(`[generatePersonaAvatars] WAN style reference URL (--style-reference-url): ${options.styleReferenceUrl || DEFAULT_PERSONA_STYLE_REFERENCE_URL}`);
    console.log(`[generatePersonaAvatars] Existing output references: ${options.useExistingReference ? 'enabled' : 'disabled'}`);
  }
  if (options.theme) console.log(`[generatePersonaAvatars] Theme filter: ${options.theme}`);
  if (options.dryRun) console.log('[generatePersonaAvatars] Dry run enabled.');
  if (options.chromaKey) {
    console.log(
      `[generatePersonaAvatars] Magenta chroma post (#FF00FF → alpha): on (strict ±${options.chromaTolerance}`
      + `${options.chromaFringe ? ', + fringe halo pass' : ''})`
    );
  } else {
    console.log('[generatePersonaAvatars] Magenta chroma post: off (default flat white #FFFFFF plate for circular UI masks)');
  }

  let created = 0;
  let skipped = 0;
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const outputPath = getPersonaOutputPath(record);
    const relOutputPath = path.relative(repoRoot, outputPath);
    const exists = fs.existsSync(outputPath);
    if (exists && !options.overwrite) {
      skipped += 1;
      console.log(`- [${i + 1}/${records.length}] SKIP ${record.personaId || record.id} (${relOutputPath})`);
      continue;
    }
    if (options.dryRun) {
      const fallbackReferenceExists = Boolean(options.referenceImage) && fs.existsSync(options.referenceImage);
      const mode = options.provider === 'openai'
        ? 'text-to-image'
        : (isWanV27EditModel(model)
          ? 'fal WAN v2.7 edit (hosted style ref + negative prompt)'
          : (options.useExistingReference && exists ? 'nano-banana-edit (existing output reference)' : (fallbackReferenceExists ? 'nano-banana-edit (explicit reference)' : 'fal text-to-image (no reference)')));
      console.log(`- [${i + 1}/${records.length}] PLAN ${record.personaId || record.id} -> ${relOutputPath} [${mode}]`);
      continue;
    }
    ensureDir(path.dirname(outputPath));
    const imageBuffer = options.provider === 'openai'
      ? await generateWithOpenAi({
          prompt: standardizePrompt(record.prompt),
          apiKey,
          model,
          size: options.size,
          quality: options.quality,
        })
      : await generateWithFal({
          prompt: standardizePrompt(record.prompt),
          apiKey,
          model,
          size: options.size,
          referenceImagePath: outputPath,
          fallbackReferenceImagePath: options.referenceImage,
          useExistingReference: options.useExistingReference,
          styleReferenceUrl: options.styleReferenceUrl,
          negativePrompt: options.negativePrompt,
        });
    let outBuffer = imageBuffer;
    if (options.chromaKey) {
      outBuffer = await applyChromaKeyTransparency(imageBuffer, {
        tolerance: options.chromaTolerance,
        fringe: options.chromaFringe,
      });
    }
    fs.writeFileSync(outputPath, outBuffer);
    created += 1;
    console.log(`- [${i + 1}/${records.length}] WROTE ${record.personaId || record.id} (${relOutputPath})`);
  }

  console.log(`[generatePersonaAvatars] Done. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((error) => {
  console.error(`[generatePersonaAvatars] ${error.message}`);
  process.exit(1);
});
