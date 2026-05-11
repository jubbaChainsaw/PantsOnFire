#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const promptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts.json');
const corePromptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts-core-themes.json');
const DEFAULT_FAL_NANO_BANANA_MODEL = 'fal-ai/nano-banana/edit';
const DEFAULT_FAL_TEXT_MODEL = 'fal-ai/flux/dev';
const DEFAULT_OPENAI_MODEL = 'gpt-image-1';
const DEFAULT_FAL_REFERENCE_IMAGE = path.join(repoRoot, 'public', 'assets', 'new-ui', 'hosts', 'default', 'talk-01.png');
const STANDARD_PERSONA_OUTPUT_SPEC = [
  'MANDATORY OUTPUT SPEC:',
  '- 1024x1024 square PNG.',
  '- Transparent background / alpha channel. No colored background, no scene, no environment.',
  '- One character only, centered, head and upper torso visible.',
  '- Standardized scale: top of head about 10% from top edge, torso ending around 85% from top edge.',
  '- Consistent camera distance, lighting direction, line weight, and cel-shaded party-game illustration style across every persona.',
  '- Keep clean transparent padding around the silhouette for UI cropping.',
  '- No text, no logo, no watermark, no border, no frame, no floor shadow.',
].join('\n');

function parseArgs(argv) {
  const options = {
    provider: 'fal',
    model: '',
    size: '1024x1024',
    quality: 'medium',
    theme: '',
    promptFile: '',
    referenceImage: DEFAULT_FAL_REFERENCE_IMAGE,
    limit: 0,
    dryRun: false,
    overwrite: false,
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
    else if (arg === '--limit') { options.limit = Math.max(0, Number.parseInt(String(argv[i + 1] || '0'), 10) || 0); i += 1; }
    else if (arg === '--api-key') { options.apiKey = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--overwrite') options.overwrite = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log('Usage: npm run persona:generate-avatars -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --provider <fal|flux|openai> Image provider (default: fal; fal/flux use Nano Banana edit)');
  console.log('  --api-key <key>           Provider API key');
  console.log(`  --model <name>            Model override (fal edit default: ${DEFAULT_FAL_NANO_BANANA_MODEL}, fal missing-reference default: ${DEFAULT_FAL_TEXT_MODEL}, OpenAI default: ${DEFAULT_OPENAI_MODEL})`);
  console.log('  --size <WxH>              OpenAI/fal text-to-image size (default: 1024x1024)');
  console.log('  --quality <low|medium|high> OpenAI image quality (default: medium)');
  console.log('  --theme <themeName>       Limit generation to one theme');
  console.log('  --prompt-file <path>      Override prompts JSON input file');
  console.log(`  --reference-image <path>  Fallback image for fal Nano Banana when persona PNG is missing (default: ${path.relative(repoRoot, DEFAULT_FAL_REFERENCE_IMAGE)})`);
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

function parseImageSize(size = '1024x1024') {
  const match = String(size || '').trim().match(/^(\d+)x(\d+)$/i);
  if (!match) return { width: 1024, height: 1024 };
  return {
    width: Math.max(256, Math.min(1536, Number(match[1]) || 1024)),
    height: Math.max(256, Math.min(1536, Number(match[2]) || 1024)),
  };
}

async function generateWithFal({ prompt, apiKey, model, size, referenceImagePath, fallbackReferenceImagePath }) {
  const primaryReferenceExists = fs.existsSync(referenceImagePath);
  const fallbackReferenceExists = Boolean(fallbackReferenceImagePath) && fs.existsSync(fallbackReferenceImagePath);
  const hasReference = primaryReferenceExists || fallbackReferenceExists;
  const selectedReferencePath = primaryReferenceExists ? referenceImagePath : fallbackReferenceImagePath;
  const requestedModel = String(model || '').trim().replace(/^\/+/, '');
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
    throw new Error(`fal.ai Nano Banana edit failed: HTTP ${response.status} ${message}`);
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
  const model = options.model || (options.provider === 'openai' ? DEFAULT_OPENAI_MODEL : '');

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
    console.log(`[generatePersonaAvatars] Fallback reference: ${path.relative(repoRoot, options.referenceImage)}`);
  }
  if (options.theme) console.log(`[generatePersonaAvatars] Theme filter: ${options.theme}`);
  if (options.dryRun) console.log('[generatePersonaAvatars] Dry run enabled.');

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
        : (exists ? 'nano-banana-edit' : (fallbackReferenceExists ? 'nano-banana-edit (fallback reference)' : 'fal-text-to-image (no reference)'));
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
        });
    fs.writeFileSync(outputPath, imageBuffer);
    created += 1;
    console.log(`- [${i + 1}/${records.length}] WROTE ${record.personaId || record.id} (${relOutputPath})`);
  }

  console.log(`[generatePersonaAvatars] Done. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((error) => {
  console.error(`[generatePersonaAvatars] ${error.message}`);
  process.exit(1);
});
