#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const defaultOutputRoot = path.join(repoRoot, 'exports', 'parody-picture-rounds');

const DEFAULT_STYLE_NOTES = [
  'bold comic-caricature linework',
  'warped anatomy and exaggerated silhouettes',
  'editorial collage poster energy',
  'spoof album-cover and movie-poster layout instincts without recreating any exact cover or poster',
  'punk-zine attitude with occasional retro paper-cut collage framing',
  'clean pale or transparent background unless a simple poster backdrop helps readability',
  'punchy cel shading and high contrast',
  'instantly readable central subject or compact ensemble',
].join(', ');

const MUSIC_ENTRIES = [
  { entryId: 'music-01', main: 'The Beatles', imposter: 'The Rolling Stones' },
  { entryId: 'music-02', main: 'Elvis Presley', imposter: 'Johnny Cash' },
  { entryId: 'music-03', main: 'Madonna', imposter: 'Lady Gaga' },
  { entryId: 'music-04', main: 'David Bowie', imposter: 'Prince' },
  { entryId: 'music-05', main: 'Freddie Mercury', imposter: 'Mick Jagger' },
  { entryId: 'music-06', main: 'Taylor Swift', imposter: 'Olivia Rodrigo' },
  { entryId: 'music-07', main: 'Beyonce', imposter: 'Rihanna' },
  { entryId: 'music-08', main: 'Adele', imposter: 'Amy Winehouse' },
  { entryId: 'music-09', main: 'Michael Jackson', imposter: 'Bruno Mars' },
  { entryId: 'music-10', main: 'Elton John', imposter: 'Billy Joel' },
  { entryId: 'music-11', main: 'Bob Dylan', imposter: 'Neil Young' },
  { entryId: 'music-12', main: 'Bruce Springsteen', imposter: 'Tom Petty' },
  { entryId: 'music-13', main: 'Dolly Parton', imposter: 'Shania Twain' },
  { entryId: 'music-14', main: 'The Sex Pistols', imposter: 'The Clash' },
  { entryId: 'music-15', main: 'Nirvana', imposter: 'Pearl Jam' },
  { entryId: 'music-16', main: 'Metallica', imposter: 'Iron Maiden' },
  { entryId: 'music-17', main: "AC/DC", imposter: "Guns N' Roses" },
  { entryId: 'music-18', main: 'The Ramones', imposter: 'Green Day' },
  { entryId: 'music-19', main: 'The Cure', imposter: 'Depeche Mode' },
  { entryId: 'music-20', main: 'ABBA', imposter: 'Bee Gees' },
  { entryId: 'music-21', main: 'Daft Punk', imposter: 'Kraftwerk' },
  { entryId: 'music-22', main: 'Tupac Shakur', imposter: 'The Notorious B.I.G.' },
  { entryId: 'music-23', main: 'Kendrick Lamar', imposter: 'J. Cole' },
  { entryId: 'music-24', main: 'Dr. Dre', imposter: 'Snoop Dogg' },
  { entryId: 'music-25', main: 'Jay-Z', imposter: 'Kanye West' },
  { entryId: 'music-26', main: 'Britney Spears', imposter: 'Christina Aguilera' },
  { entryId: 'music-27', main: 'Billie Eilish', imposter: 'Lorde' },
  { entryId: 'music-28', main: 'Ed Sheeran', imposter: 'Shawn Mendes' },
  { entryId: 'music-29', main: 'Justin Bieber', imposter: 'Harry Styles' },
  { entryId: 'music-30', main: 'Whitney Houston', imposter: 'Mariah Carey' },
  { entryId: 'music-31', main: 'Celine Dion', imposter: 'Barbra Streisand' },
  { entryId: 'music-32', main: 'Frank Sinatra', imposter: 'Dean Martin' },
  { entryId: 'music-33', main: 'Aretha Franklin', imposter: 'Tina Turner' },
  { entryId: 'music-34', main: 'Stevie Wonder', imposter: 'Ray Charles' },
  { entryId: 'music-35', main: 'The Beach Boys', imposter: 'The Backstreet Boys' },
  { entryId: 'music-36', main: 'Oasis', imposter: 'Blur' },
  { entryId: 'music-37', main: 'Coldplay', imposter: 'U2' },
  { entryId: 'music-38', main: 'Radiohead', imposter: 'Muse' },
  { entryId: 'music-39', main: 'Red Hot Chili Peppers', imposter: 'Foo Fighters' },
  { entryId: 'music-40', main: 'Pink Floyd', imposter: 'Led Zeppelin' },
  { entryId: 'music-41', main: 'Linkin Park', imposter: 'Limp Bizkit' },
  { entryId: 'music-42', main: 'The White Stripes', imposter: 'The Black Keys' },
  { entryId: 'music-43', main: 'Kiss', imposter: 'Twisted Sister' },
  { entryId: 'music-44', main: 'Janet Jackson', imposter: 'Paula Abdul' },
  { entryId: 'music-45', main: 'Cher', imposter: 'Cyndi Lauper' },
  { entryId: 'music-46', main: 'The Weeknd', imposter: 'Drake' },
  { entryId: 'music-47', main: 'Bad Bunny', imposter: 'J Balvin' },
  { entryId: 'music-48', main: 'Selena Quintanilla', imposter: 'Shakira' },
  { entryId: 'music-49', main: 'BTS', imposter: 'NSYNC' },
  { entryId: 'music-50', main: 'The Spice Girls', imposter: "Destiny's Child" },
];

const SCREEN_ENTRIES = [
  { entryId: 'screen-01', main: 'Star Wars', imposter: 'Star Trek' },
  { entryId: 'screen-02', main: 'Harry Potter', imposter: 'The Lord of the Rings' },
  { entryId: 'screen-03', main: 'Breaking Bad', imposter: 'Better Call Saul' },
  { entryId: 'screen-04', main: 'The Simpsons', imposter: 'Family Guy' },
  { entryId: 'screen-05', main: 'Friends', imposter: 'Seinfeld' },
  { entryId: 'screen-06', main: 'The Office', imposter: 'Parks and Recreation' },
  { entryId: 'screen-07', main: 'Stranger Things', imposter: 'Dark' },
  { entryId: 'screen-08', main: 'Game of Thrones', imposter: 'House of the Dragon' },
  { entryId: 'screen-09', main: 'Batman', imposter: 'Spider-Man' },
  { entryId: 'screen-10', main: 'Superman', imposter: 'Captain America' },
  { entryId: 'screen-11', main: 'The Matrix', imposter: 'Tron' },
  { entryId: 'screen-12', main: 'Jurassic Park', imposter: 'King Kong' },
  { entryId: 'screen-13', main: 'Ghostbusters', imposter: 'Men in Black' },
  { entryId: 'screen-14', main: 'Rocky', imposter: 'The Karate Kid' },
  { entryId: 'screen-15', main: 'Indiana Jones', imposter: 'National Treasure' },
  { entryId: 'screen-16', main: 'Top Gun', imposter: 'Mission: Impossible' },
  { entryId: 'screen-17', main: 'Pirates of the Caribbean', imposter: 'Hook' },
  { entryId: 'screen-18', main: 'The Godfather', imposter: 'Goodfellas' },
  { entryId: 'screen-19', main: 'Pulp Fiction', imposter: 'Reservoir Dogs' },
  { entryId: 'screen-20', main: 'The Silence of the Lambs', imposter: 'American Psycho' },
  { entryId: 'screen-21', main: 'Back to the Future', imposter: "Bill & Ted's Excellent Adventure" },
  { entryId: 'screen-22', main: 'Alien', imposter: 'Predator' },
  { entryId: 'screen-23', main: 'The Terminator', imposter: 'RoboCop' },
  { entryId: 'screen-24', main: 'Die Hard', imposter: 'Lethal Weapon' },
  { entryId: 'screen-25', main: 'The Addams Family', imposter: 'The Munsters' },
  { entryId: 'screen-26', main: 'South Park', imposter: 'Rick and Morty' },
  { entryId: 'screen-27', main: 'Beavis and Butt-Head', imposter: "Wayne's World" },
  { entryId: 'screen-28', main: 'The X-Files', imposter: 'Fringe' },
  { entryId: 'screen-29', main: 'Doctor Who', imposter: 'Sherlock' },
  { entryId: 'screen-30', main: 'Peaky Blinders', imposter: 'Boardwalk Empire' },
  { entryId: 'screen-31', main: 'The Sopranos', imposter: 'Sons of Anarchy' },
  { entryId: 'screen-32', main: 'Narcos', imposter: 'Scarface' },
  { entryId: 'screen-33', main: 'Avatar', imposter: 'Dune' },
  { entryId: 'screen-34', main: 'Mad Max', imposter: 'Waterworld' },
  { entryId: 'screen-35', main: 'Mean Girls', imposter: 'Clueless' },
  { entryId: 'screen-36', main: 'Barbie', imposter: 'Legally Blonde' },
  { entryId: 'screen-37', main: 'Wednesday', imposter: 'Sabrina the Teenage Witch' },
  { entryId: 'screen-38', main: 'Bridgerton', imposter: 'Pride and Prejudice' },
  { entryId: 'screen-39', main: 'The Walking Dead', imposter: 'The Last of Us' },
  { entryId: 'screen-40', main: 'The Mandalorian', imposter: 'The Witcher' },
  { entryId: 'screen-41', main: 'Shrek', imposter: 'Monsters, Inc.' },
  { entryId: 'screen-42', main: 'Toy Story', imposter: 'Cars' },
  { entryId: 'screen-43', main: 'Frozen', imposter: 'Moana' },
  { entryId: 'screen-44', main: 'The Lion King', imposter: 'Madagascar' },
  { entryId: 'screen-45', main: 'SpongeBob SquarePants', imposter: 'Minions' },
  { entryId: 'screen-46', main: 'Black Mirror', imposter: 'The Twilight Zone' },
  { entryId: 'screen-47', main: 'Jaws', imposter: 'Deep Blue Sea' },
  { entryId: 'screen-48', main: 'Home Alone', imposter: 'Dennis the Menace' },
  { entryId: 'screen-49', main: 'Kill Bill', imposter: "Charlie's Angels" },
  { entryId: 'screen-50', main: 'The Hunger Games', imposter: 'Squid Game' },
];

const MUSIC_COMPOSITION_MODES = [
  'a spoof album-cover portrait with one bold central figure',
  'a fake tour-poster composition with dramatic pose and oversized prop cues',
  'an exaggerated editorial collage portrait with cutout shapes and playful framing',
  'a mock greatest-hits sleeve design built around caricature and silhouette',
];

const SCREEN_COMPOSITION_MODES = [
  'a spoof theatrical poster composition with transformed archetypes',
  'a fake streaming key-art layout with bold central figure placement',
  'an editorial caricature collage inspired by poster art, not a direct poster recreation',
  'a parody one-sheet style image with clean iconic props and simplified background',
];

const PACKS = {
  music: {
    categoryId: 'music',
    packId: 'music-parodies-v1',
    label: 'Music Parody Caricatures v1',
    groupId: 'music-parodies',
    groupName: 'Music Parodies',
    previewLabel: 'Describe the music parody image clearly without naming the exact act.',
    promptHint: 'Picture Prompt • Music Parody',
    entries: MUSIC_ENTRIES,
    compositionModes: MUSIC_COMPOSITION_MODES,
  },
  screen: {
    categoryId: 'screen',
    packId: 'screen-parodies-v1',
    label: 'Film and TV Parody Caricatures v1',
    groupId: 'screen-parodies',
    groupName: 'Film & TV Parodies',
    previewLabel: 'Describe the parody scene clearly without naming the exact title or franchise.',
    promptHint: 'Picture Prompt • Film/TV Parody',
    entries: SCREEN_ENTRIES,
    compositionModes: SCREEN_COMPOSITION_MODES,
  },
};

function usage() {
  console.log('Usage: npm run picture:generate-parody-rounds -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --category <music|screen|all>  Which curated pack(s) to process (default: all)');
  console.log(`  --output-root <path>            Output folder (default: ${path.relative(repoRoot, defaultOutputRoot)})`);
  console.log('  --provider <openai>             Image provider (default: openai)');
  console.log('  --api-key <key>                 OpenAI API key (or OPENAI_API_KEY)');
  console.log('  --model <name>                  OpenAI model (default: gpt-image-1)');
  console.log('  --size <WxH>                    Image size (default: 1024x1024)');
  console.log('  --quality <low|medium|high>     Image quality (default: medium)');
  console.log('  --limit <n>                     Limit entries per pack for sampling/review');
  console.log('  --style-notes <text>            Override the built-in visual style notes');
  console.log('  --delay-ms <n>                  Wait time between OpenAI calls (default: 500)');
  console.log('  --overwrite                     Regenerate images even if they exist');
  console.log('  --prompts-only                  Write manifest/prompt files without calling OpenAI');
  console.log('  --dry-run                       Print planned actions without writing files');
  console.log('  --help                          Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  npm run picture:generate-parody-rounds -- --prompts-only');
  console.log('  npm run picture:generate-parody-rounds -- --category music --limit 5 --prompts-only');
  console.log('  npm run picture:generate-parody-rounds -- --category screen --output-root public/assets/graphic-packs/picture --overwrite');
}

function parseArgs(argv) {
  const options = {
    category: 'all',
    provider: 'openai',
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
    outputRoot: defaultOutputRoot,
    delayMs: 500,
    overwrite: false,
    promptsOnly: false,
    dryRun: false,
    styleNotes: DEFAULT_STYLE_NOTES,
    limit: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--category') { options.category = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; }
    else if (arg === '--provider') { options.provider = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; }
    else if (arg === '--api-key') { options.apiKey = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--model') { options.model = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--size') { options.size = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--quality') { options.quality = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--output-root') { options.outputRoot = path.resolve(repoRoot, String(argv[i + 1] || '').trim()); i += 1; }
    else if (arg === '--limit') { options.limit = Number.parseInt(String(argv[i + 1] || '0'), 10) || 0; i += 1; }
    else if (arg === '--style-notes') { options.styleNotes = String(argv[i + 1] || '').trim() || DEFAULT_STYLE_NOTES; i += 1; }
    else if (arg === '--delay-ms') { options.delayMs = Number.parseInt(String(argv[i + 1] || '0'), 10) || 0; i += 1; }
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

function resolveApiKey(provider, cliKey) {
  if (cliKey) return cliKey;
  if (provider === 'openai') {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    const local = readJsonSafe(localKeysPath, {});
    return String(local.openaiApiKey || '').trim();
  }
  return '';
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function pickCompositionMode(pack, index) {
  const list = Array.isArray(pack.compositionModes) ? pack.compositionModes : [];
  if (!list.length) return 'a clean caricature poster layout';
  return list[index % list.length];
}

function buildMusicPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original parody caricature inspired by the musician or band "${subject}".`,
    'Make it recognisable to a music-trivia player through transformed visual cues, exaggerated silhouette, performance attitude, hair, wardrobe, props, and stage energy rather than an exact likeness.',
    'If the inspiration is a group, show a compact ensemble of two to four transformed members; if it is a solo act, show one central performer.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Push the humour, facial exaggeration, pose, and costume shapes so it feels like a spoof or satirical caricature, not a clone.',
    'Keep the composition clean and readable at thumbnail size for a party-game picture round.',
    'Do not include band names, song titles, logos, wordmarks, watermarks, album-cover recreations, exact face matching, or direct poster layouts.',
  ].join(' ');
}

function buildScreenPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original parody caricature inspired by the film or TV property "${subject}".`,
    'Make it recognisable through transformed archetypes, costume cues, props, setting hints, and silhouette, while clearly avoiding a direct still, poster recreation, or exact character copy.',
    'If the inspiration is a broad franchise or ensemble, show one to three transformed archetypal characters; if it centers on one icon, focus on a single lead parody figure.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Lean into comic exaggeration, caricature proportions, and playful parody energy so it reads as a fresh spoof rather than a replica.',
    'Keep the image clean, high-contrast, and easy to read in a picture round.',
    'Do not include title text, logos, studio marks, watermarks, copyrighted typography, exact costume duplication, or a recreated poster composition.',
  ].join(' ');
}

function buildPromptForSubject(pack, subject, options, compositionMode) {
  if (pack.categoryId === 'music') return buildMusicPrompt(subject, options, compositionMode);
  return buildScreenPrompt(subject, options, compositionMode);
}

function buildPackManifest(pack, entries) {
  return {
    id: pack.packId,
    version: 1,
    label: pack.label,
    category: 'picture',
    releaseChannel: 'dlc',
    enabled: true,
    basePath: `/assets/graphic-packs/picture/${pack.packId}/images`,
    entries: entries.map((entry, index) => ({
      entryId: entry.entryId,
      groupId: pack.groupId,
      groupName: pack.groupName,
      hint: `${pack.promptHint} ${index + 1}`,
      main: entry.main,
      imposter: entry.imposter,
      mainMediaFile: `${entry.entryId}-main.png`,
      imposterMediaFile: `${entry.entryId}-imposter.png`,
      previewLabel: pack.previewLabel,
    })),
  };
}

function buildPromptPlan(pack, options) {
  const selectedEntries = options.limit > 0
    ? pack.entries.slice(0, options.limit)
    : pack.entries.slice();
  const manifest = buildPackManifest(pack, selectedEntries);
  const promptRecords = [];

  selectedEntries.forEach((entry) => {
    const compositionMode = pickCompositionMode(pack, promptRecords.length);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'main',
      subject: entry.main,
      mediaFile: `${entry.entryId}-main.png`,
      compositionMode,
      prompt: buildPromptForSubject(pack, entry.main, options, compositionMode),
    });
    const imposterCompositionMode = pickCompositionMode(pack, promptRecords.length);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'imposter',
      subject: entry.imposter,
      mediaFile: `${entry.entryId}-imposter.png`,
      compositionMode: imposterCompositionMode,
      prompt: buildPromptForSubject(pack, entry.imposter, options, imposterCompositionMode),
    });
  });

  return {
    pack,
    selectedEntries,
    manifest,
    promptRecords,
  };
}

function buildPackReadme(plan) {
  const { pack, selectedEntries } = plan;
  return [
    `# ${pack.label}`,
    '',
    `Generated by \`scripts/generateParodyPictureRounds.cjs\`.`,
    '',
    `- Pack ID: \`${pack.packId}\``,
    `- Entries prepared: ${selectedEntries.length}`,
    '- Output images live in `images/`.',
    '- Prompt metadata lives in `generation-prompts.json`.',
    '- `manifest.json` matches the picture DLC schema used by the app.',
    '',
    '## Important review note',
    '',
    'This generator is designed to push images toward transformed parody/caricature territory,',
    'but it does not make legal determinations. Review outputs manually before shipping.',
    '',
    '## To install into the live app after review',
    '',
    '1. Copy the finished pack folder into `public/assets/graphic-packs/picture/` if it was generated elsewhere.',
    '2. Run `npm run dlc:lint-picture-manifests`.',
    '3. Run `npm run dlc:sync-picture-manifests`.',
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function runPack(plan, options) {
  const packDir = path.join(options.outputRoot, plan.pack.packId);
  const imagesDir = path.join(packDir, 'images');
  const manifestPath = path.join(packDir, 'manifest.json');
  const promptsPath = path.join(packDir, 'generation-prompts.json');
  const readmePath = path.join(packDir, 'README.md');

  console.log(`\n[generateParodyPictureRounds] Pack: ${plan.pack.packId}`);
  console.log(`[generateParodyPictureRounds] Entries: ${plan.selectedEntries.length}`);
  console.log(`[generateParodyPictureRounds] Images planned: ${plan.promptRecords.length}`);

  if (!options.dryRun) {
    ensureDir(packDir);
    ensureDir(imagesDir);
    writeJson(manifestPath, plan.manifest);
    writeJson(promptsPath, {
      packId: plan.pack.packId,
      label: plan.pack.label,
      generatedAt: new Date().toISOString(),
      styleNotes: options.styleNotes,
      promptsOnly: options.promptsOnly,
      entries: plan.promptRecords,
    });
    fs.writeFileSync(readmePath, `${buildPackReadme(plan)}\n`, 'utf8');
  } else {
    console.log(`- PLAN write ${path.relative(repoRoot, manifestPath)}`);
    console.log(`- PLAN write ${path.relative(repoRoot, promptsPath)}`);
  }

  if (options.promptsOnly) {
    console.log('[generateParodyPictureRounds] prompts-only enabled, skipping OpenAI image calls.');
    return;
  }

  let created = 0;
  let skipped = 0;
  for (let index = 0; index < plan.promptRecords.length; index += 1) {
    const record = plan.promptRecords[index];
    const outputPath = path.join(imagesDir, record.mediaFile);
    const relOutputPath = path.relative(repoRoot, outputPath);
    const exists = fs.existsSync(outputPath);

    if (exists && !options.overwrite) {
      skipped += 1;
      console.log(`- [${index + 1}/${plan.promptRecords.length}] SKIP ${record.subject} (${relOutputPath})`);
      continue;
    }

    if (options.dryRun) {
      console.log(`- [${index + 1}/${plan.promptRecords.length}] PLAN ${record.subject} -> ${relOutputPath}`);
      continue;
    }

    const imageBuffer = await generateWithOpenAi({
      prompt: record.prompt,
      apiKey: options.apiKey,
      model: options.model,
      size: options.size,
      quality: options.quality,
    });
    fs.writeFileSync(outputPath, imageBuffer);
    created += 1;
    console.log(`- [${index + 1}/${plan.promptRecords.length}] WROTE ${record.subject} (${relOutputPath})`);
    if (options.delayMs > 0 && index < plan.promptRecords.length - 1) {
      await sleep(options.delayMs);
    }
  }

  console.log(`[generateParodyPictureRounds] Pack done. Created: ${created}, Skipped: ${skipped}`);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (!['music', 'screen', 'all'].includes(options.category)) {
    throw new Error(`Unsupported --category "${options.category}". Use music, screen, or all.`);
  }
  if (options.provider !== 'openai') {
    throw new Error(`Unsupported provider "${options.provider}". Currently only "openai" is implemented.`);
  }
  if (options.limit < 0) {
    throw new Error('--limit must be 0 or greater.');
  }

  if (!options.promptsOnly) {
    options.apiKey = resolveApiKey(options.provider, options.apiKey);
    if (!options.apiKey && !options.dryRun) {
      throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
    }
  }

  const packKeys = options.category === 'all' ? ['music', 'screen'] : [options.category];
  console.log(`[generateParodyPictureRounds] Category: ${options.category}`);
  console.log(`[generateParodyPictureRounds] Output root: ${path.relative(repoRoot, options.outputRoot) || '.'}`);
  if (options.promptsOnly) console.log('[generateParodyPictureRounds] Prompt export mode enabled.');
  if (options.dryRun) console.log('[generateParodyPictureRounds] Dry run enabled.');
  if (options.limit > 0) console.log(`[generateParodyPictureRounds] Entry limit per pack: ${options.limit}`);

  for (const packKey of packKeys) {
    const pack = PACKS[packKey];
    const plan = buildPromptPlan(pack, options);
    await runPack(plan, options);
  }

  console.log('\n[generateParodyPictureRounds] Completed.');
}

run().catch((error) => {
  console.error(`[generateParodyPictureRounds] ${error.message}`);
  process.exit(1);
});
