#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const defaultOutputRoot = path.join(repoRoot, 'exports', 'animal-picture-set');
const DEFAULT_STYLE_REFERENCE_URL = 'https://media.craiyon.com/2025-08-06/Kx1Iy3b-RCSGhKhPYW3Aog.webp';

const DEFAULT_STYLE_NOTES = [
  'realistic wildlife rendering',
  'lifelike anatomy and natural colors',
  'clean outlines and graphic punch inspired by the established comic-punk reference style',
  'subtle editorial illustration finish rather than cartoony exaggeration',
  'one centered subject with a soft, uncluttered natural background',
  'high readability at thumbnail size',
].join(', ');

const ANIMAL_PAIR_ENTRIES = [
  { entryId: 'animals-01', hint: 'Big Cat', main: 'lion', imposter: 'tiger' },
  { entryId: 'animals-02', hint: 'Spotted Cat', main: 'leopard', imposter: 'cheetah' },
  { entryId: 'animals-03', hint: 'Wild Canine', main: 'wolf', imposter: 'fox' },
  { entryId: 'animals-04', hint: 'Thick-Skinned Mammal', main: 'elephant', imposter: 'rhinoceros' },
  { entryId: 'animals-05', hint: 'Great Ape', main: 'gorilla', imposter: 'orangutan' },
  { entryId: 'animals-06', hint: 'Horned Grazer', main: 'bison', imposter: 'buffalo' },
  { entryId: 'animals-07', hint: 'Marine Mammal', main: 'seal', imposter: 'sea lion' },
  { entryId: 'animals-08', hint: 'Antlered Mammal', main: 'moose', imposter: 'reindeer' },
  { entryId: 'animals-09', hint: 'Bird of Prey', main: 'eagle', imposter: 'hawk' },
  { entryId: 'animals-10', hint: 'Wading Bird', main: 'flamingo', imposter: 'crane' },
  { entryId: 'animals-11', hint: 'Tropical Bird', main: 'toucan', imposter: 'parrot' },
  { entryId: 'animals-12', hint: 'Flightless Bird', main: 'ostrich', imposter: 'emu' },
  { entryId: 'animals-13', hint: 'Water Bird', main: 'swan', imposter: 'goose' },
  { entryId: 'animals-14', hint: 'Seabird', main: 'penguin', imposter: 'puffin' },
  { entryId: 'animals-15', hint: 'Cephalopod', main: 'octopus', imposter: 'squid' },
  { entryId: 'animals-16', hint: 'Crustacean', main: 'crab', imposter: 'lobster' },
  { entryId: 'animals-17', hint: 'Ocean Predator', main: 'shark', imposter: 'barracuda' },
  { entryId: 'animals-18', hint: 'Reef Fish', main: 'clownfish', imposter: 'angelfish' },
  { entryId: 'animals-19', hint: 'Spiny Fish', main: 'lionfish', imposter: 'pufferfish' },
  { entryId: 'animals-20', hint: 'Crocodilian', main: 'crocodile', imposter: 'alligator' },
  { entryId: 'animals-21', hint: 'Shelled Reptile', main: 'turtle', imposter: 'tortoise' },
  { entryId: 'animals-22', hint: 'Winged Insect', main: 'butterfly', imposter: 'moth' },
  { entryId: 'animals-23', hint: 'Stinging Insect', main: 'bee', imposter: 'wasp' },
  { entryId: 'animals-24', hint: 'Jumping Insect', main: 'grasshopper', imposter: 'cricket' },
  { entryId: 'animals-25', hint: 'Arachnid', main: 'spider', imposter: 'scorpion' },
];

function usage() {
  console.log('Usage: npm run picture:generate-animal-set -- [options]');
  console.log('');
  console.log('Options:');
  console.log(`  --output-root <path>            Output folder (default: ${path.relative(repoRoot, defaultOutputRoot)})`);
  console.log('  --api-key <key>                 OpenAI API key (or OPENAI_API_KEY)');
  console.log('  --model <name>                  OpenAI model (default: gpt-image-1)');
  console.log('  --size <WxH>                    Image size (default: 1024x1024)');
  console.log('  --quality <low|medium|high>     Image quality (default: high)');
  console.log('  --limit <n>                     Limit number of animal pairs to generate');
  console.log('  --style-notes <text>            Override the built-in style notes');
  console.log('  --style-reference-url <url>     Reference style URL stored in prompt metadata');
  console.log('  --overwrite                     Regenerate existing images');
  console.log('  --prompts-only                  Write prompt metadata without generating images');
  console.log('  --dry-run                       Print planned actions without writing files');
  console.log('  --help                          Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  npm run picture:generate-animal-set -- --prompts-only');
  console.log('  npm run picture:generate-animal-set -- --limit 10');
}

function parseArgs(argv) {
  const options = {
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'high',
    outputRoot: defaultOutputRoot,
    styleNotes: DEFAULT_STYLE_NOTES,
    styleReferenceUrl: DEFAULT_STYLE_REFERENCE_URL,
    overwrite: false,
    promptsOnly: false,
    dryRun: false,
    limit: 0,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--api-key') { options.apiKey = String(argv[index + 1] || '').trim(); index += 1; }
    else if (arg === '--model') { options.model = String(argv[index + 1] || '').trim(); index += 1; }
    else if (arg === '--size') { options.size = String(argv[index + 1] || '').trim(); index += 1; }
    else if (arg === '--quality') { options.quality = String(argv[index + 1] || '').trim(); index += 1; }
    else if (arg === '--output-root') { options.outputRoot = path.resolve(repoRoot, String(argv[index + 1] || '').trim()); index += 1; }
    else if (arg === '--limit') { options.limit = Number.parseInt(String(argv[index + 1] || '0'), 10) || 0; index += 1; }
    else if (arg === '--style-notes') { options.styleNotes = String(argv[index + 1] || '').trim() || DEFAULT_STYLE_NOTES; index += 1; }
    else if (arg === '--style-reference-url') { options.styleReferenceUrl = String(argv[index + 1] || '').trim(); index += 1; }
    else if (arg === '--overwrite') options.overwrite = true;
    else if (arg === '--prompts-only') options.promptsOnly = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function resolveApiKey(cliKey) {
  if (cliKey) return cliKey;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const local = readJsonSafe(localKeysPath, {});
  return String(local.openaiApiKey || '').trim();
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildAnimalPrompt(animalName, hint, options) {
  return [
    `Create a single square realistic wildlife illustration of a ${animalName}.`,
    `Animal hint category: ${hint}.`,
    `Style direction: ${options.styleNotes}.`,
    'The animal must be instantly recognisable and anatomically believable, with realistic texture, lighting, proportions, and natural color.',
    'Use one primary subject, centered and easy to read, with a simple pale or softly blurred natural background.',
    'Keep the result realistic overall, but allow a touch of clean graphic stylization inspired by the established reference art vibe.',
    'Do not include text, labels, frames, people, multiple animals, or fantasy mutations.',
  ].join(' ');
}

function buildPairRecords(options) {
  const selected = options.limit > 0
    ? ANIMAL_PAIR_ENTRIES.slice(0, options.limit)
    : ANIMAL_PAIR_ENTRIES.slice();
  return selected.map((entry) => ({
    ...entry,
    mainImageFile: `${entry.entryId}-main.png`,
    imposterImageFile: `${entry.entryId}-imposter.png`,
    mainGenerationPrompt: buildAnimalPrompt(entry.main, entry.hint, options),
    imposterGenerationPrompt: buildAnimalPrompt(entry.imposter, entry.hint, options),
  }));
}

function buildManifest(entries) {
  return {
    id: 'animals-lookalikes-v1',
    version: 1,
    label: 'Realistic Animal Lookalikes v1',
    category: 'picture',
    releaseChannel: 'dlc',
    enabled: true,
    basePath: '/assets/graphic-packs/picture/animals-lookalikes-v1/images',
    entries: entries.map((entry, index) => ({
      entryId: entry.entryId,
      groupId: 'animals-lookalikes',
      groupName: 'Animals',
      hint: entry.hint || `Picture Prompt • Animals ${index + 1}`,
      main: entry.main,
      imposter: entry.imposter,
      mainMediaFile: entry.mainImageFile,
      imposterMediaFile: entry.imposterImageFile,
      previewLabel: 'Describe the animal clearly without saying the exact prompt.',
    })),
  };
}

function buildPackReadme(records, options) {
  return [
    '# Realistic Animal Lookalikes',
    '',
    'Generated by `scripts/generateAnimalPictureSet.cjs`.',
    '',
    `- Animal pairs prepared: ${records.length}`,
    `- Total animal images planned: ${records.length * 2}`,
    '- Output images live in `images/`.',
    '- Prompt metadata lives in `prompts.json`.',
    '- `manifest.json` is included so the pack can be copied into the picture DLC workflow later.',
    '',
    '## Style note',
    '',
    'This script uses a text description of the established reference style while keeping',
    'the animals realistic. The reference URL is stored in the prompt metadata for review.',
    '',
    '## To regenerate safely',
    '',
    '- rerun without `--overwrite` to keep existing files',
    '- use `--prompts-only` to export prompts without spending API credits',
    '',
    `- Style reference URL: ${options.styleReferenceUrl || 'none'}`,
  ].join('\n');
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
      output_format: 'png',
    }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`OpenAI image generation failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageBase64 = (
    payload
    && Array.isArray(payload.data)
    && payload.data[0]
    && payload.data[0].b64_json
  ) || '';
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
  if (options.limit < 0) {
    throw new Error('--limit must be 0 or greater.');
  }

  const records = buildPairRecords(options);
  const packDir = path.join(options.outputRoot, 'animals-lookalikes-v1');
  const imagesDir = path.join(packDir, 'images');
  const promptsPath = path.join(packDir, 'prompts.json');
  const manifestPath = path.join(packDir, 'manifest.json');
  const readmePath = path.join(packDir, 'README.md');
  const resultsPath = path.join(packDir, 'generation-results.json');

  if (!options.dryRun) {
    ensureDir(packDir);
    ensureDir(imagesDir);
    writeJson(manifestPath, buildManifest(records));
    writeJson(promptsPath, {
      packId: 'animals-lookalikes-v1',
      label: 'Realistic Animal Lookalikes v1',
      generatedAt: new Date().toISOString(),
      styleNotes: options.styleNotes,
      styleReferenceUrl: options.styleReferenceUrl,
      entries: records,
    });
    fs.writeFileSync(readmePath, `${buildPackReadme(records, options)}\n`, 'utf8');
  }

  console.log(`[generateAnimalPictureSet] Pairs: ${records.length}`);
  console.log(`[generateAnimalPictureSet] Images planned: ${records.length * 2}`);
  console.log(`[generateAnimalPictureSet] Output root: ${path.relative(repoRoot, options.outputRoot) || '.'}`);
  if (options.promptsOnly) {
    console.log('[generateAnimalPictureSet] Prompt export mode enabled.');
    return;
  }
  if (options.dryRun) {
    console.log('[generateAnimalPictureSet] Dry run enabled.');
  }

  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey && !options.dryRun) {
    throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
  }

  let created = 0;
  let skipped = 0;
  const results = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const sides = [
      { side: 'main', animal: record.main, imageFile: record.mainImageFile, generationPrompt: record.mainGenerationPrompt },
      { side: 'imposter', animal: record.imposter, imageFile: record.imposterImageFile, generationPrompt: record.imposterGenerationPrompt },
    ];
    for (const sideRecord of sides) {
      const outputPath = path.join(imagesDir, sideRecord.imageFile);
      const relOutputPath = path.relative(repoRoot, outputPath);
      if (fs.existsSync(outputPath) && !options.overwrite) {
        skipped += 1;
        results.push({ entryId: record.entryId, side: sideRecord.side, animal: sideRecord.animal, status: 'skipped' });
        console.log(`- [${index + 1}/${records.length}] SKIP ${record.entryId}:${sideRecord.side} ${sideRecord.animal} (${relOutputPath})`);
        continue;
      }
      if (options.dryRun) {
        results.push({ entryId: record.entryId, side: sideRecord.side, animal: sideRecord.animal, status: 'planned' });
        console.log(`- [${index + 1}/${records.length}] PLAN ${record.entryId}:${sideRecord.side} ${sideRecord.animal} -> ${relOutputPath}`);
        continue;
      }
      const imageBuffer = await generateWithOpenAi({
        prompt: sideRecord.generationPrompt,
        apiKey,
        model: options.model,
        size: options.size,
        quality: options.quality,
      });
      fs.writeFileSync(outputPath, imageBuffer);
      created += 1;
      results.push({ entryId: record.entryId, side: sideRecord.side, animal: sideRecord.animal, status: 'created' });
      console.log(`- [${index + 1}/${records.length}] WROTE ${record.entryId}:${sideRecord.side} ${sideRecord.animal} (${relOutputPath})`);
    }
  }

  if (!options.dryRun) {
    writeJson(resultsPath, {
      packId: 'animals-lookalikes-v1',
      generatedAt: new Date().toISOString(),
      created,
      skipped,
      results,
    });
  }
  console.log(`[generateAnimalPictureSet] Done. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((error) => {
  console.error(`[generateAnimalPictureSet] ${error.message}`);
  process.exit(1);
});
