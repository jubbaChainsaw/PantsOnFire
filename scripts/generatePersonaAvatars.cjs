#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const promptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts.json');
const corePromptsJsonPath = path.join(repoRoot, 'exports', 'persona-avatar-prompts-core-themes.json');

function parseArgs(argv) {
  const options = {
    provider: 'openai',
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
    theme: '',
    promptFile: '',
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
  console.log('  --provider <openai>       Image provider (default: openai)');
  console.log('  --api-key <key>           Provider API key (or env OPENAI_API_KEY)');
  console.log('  --model <name>            OpenAI model (default: gpt-image-1)');
  console.log('  --size <WxH>              Image size (default: 1024x1024)');
  console.log('  --quality <low|medium|high> Image quality (default: medium)');
  console.log('  --theme <themeName>       Limit generation to one theme');
  console.log('  --prompt-file <path>      Override prompts JSON input file');
  console.log('  --overwrite               Regenerate files even if they already exist');
  console.log('  --dry-run                 Print what would be generated without writing files');
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

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (options.provider !== 'openai') {
    throw new Error(`Unsupported provider "${options.provider}". Currently only "openai" is implemented.`);
  }

  const apiKey = resolveApiKey(options.provider, options.apiKey);
  if (!apiKey && !options.dryRun) {
    throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
  }

  const records = loadPromptRecords({ promptFile: options.promptFile, theme: options.theme });
  if (!records.length) {
    console.log('[generatePersonaAvatars] No personas matched filters.');
    return;
  }

  console.log(`[generatePersonaAvatars] Provider: ${options.provider}`);
  console.log(`[generatePersonaAvatars] Records: ${records.length}`);
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
      console.log(`- [${i + 1}/${records.length}] PLAN ${record.personaId || record.id} -> ${relOutputPath}`);
      continue;
    }
    ensureDir(path.dirname(outputPath));
    const imageBuffer = await generateWithOpenAi({
      prompt: record.prompt,
      apiKey,
      model: options.model,
      size: options.size,
      quality: options.quality,
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
