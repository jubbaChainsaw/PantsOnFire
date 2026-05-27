#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const exportsDir = path.join(repoRoot, 'exports');
const themesRoot = path.join(repoRoot, 'public', 'assets', 'themes');
const tmpRoot = path.join(repoRoot, '.tmp', 'theme-host-import');
const generatedMediaPath = path.join(repoRoot, 'src', 'data', 'generatedHostMedia.js');

const THEME_HOST_SLUGS = {
  Default: 'default',
  'Murder Mystery': 'murder-mystery',
  Pirates: 'pirates',
  'Cops and Robbers': 'gangsters',
  'Ghosts and Ghouls': 'ghosts-and-ghouls',
  'Rock Stars': 'rock-stars',
  'Flying Squad': 'flying-squad',
  'Drag Queens': 'drag-queens',
  Superheroes: 'superheroes',
  Aliens: 'aliens',
  Medical: 'medical',
  Royalty: 'royalty',
  Wrestlers: 'wrestlers',
  Cyberpunk: 'cyberpunk',
  Vikings: 'vikings',
  Ninjas: 'ninjas',
  'Mythology (Gods & Legends)': 'mythology-gods-legends',
  'Post-Apocalypse': 'post-apocalypse',
  Carnival: 'carnival',
  'Wizards & Witches': 'wizards-witches',
  'Time Travelers': 'time-travelers',
  Gladiators: 'gladiators',
};

const DEFAULT_THEME_ORDER = [
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
];

const THEME_MATCH_RULES = [
  { theme: 'Murder Mystery', patterns: ['murder', 'victorian'] },
  { theme: 'Pirates', patterns: ['pirate'] },
  { theme: 'Cops and Robbers', patterns: ['cops', 'robber', 'gangster', 'spy', 'cowboy'] },
  { theme: 'Ghosts and Ghouls', patterns: ['ghost', 'ghoul', 'monster'] },
  { theme: 'Rock Stars', patterns: ['rock', 'star'] },
  { theme: 'Flying Squad', patterns: ['flying', 'squad', 'pilot'] },
  { theme: 'Drag Queens', patterns: ['drag', 'queen'] },
  { theme: 'Superheroes', patterns: ['superhero', 'hero'] },
  { theme: 'Aliens', patterns: ['alien', 'ufo'] },
  { theme: 'Medical', patterns: ['medical', 'doctor', 'nurse'] },
  { theme: 'Royalty', patterns: ['royalty', 'king', 'queen'] },
  { theme: 'Wrestlers', patterns: ['wrestler', 'wrestling'] },
  { theme: 'Cyberpunk', patterns: ['cyberpunk', 'cyber'] },
  { theme: 'Vikings', patterns: ['viking'] },
  { theme: 'Ninjas', patterns: ['ninja'] },
  { theme: 'Mythology (Gods & Legends)', patterns: ['mythology', 'gods', 'legend'] },
  { theme: 'Post-Apocalypse', patterns: ['post-apocalypse', 'postapocalypse', 'apocalypse'] },
  { theme: 'Carnival', patterns: ['carnival'] },
  { theme: 'Wizards & Witches', patterns: ['wizard', 'witch'] },
  { theme: 'Time Travelers', patterns: ['time-travel', 'time travel', 'chrono'] },
  { theme: 'Gladiators', patterns: ['gladiator'] },
  // Keep default last so broad labels don't steal explicit themed files.
  { theme: 'Default', patterns: ['default', 'host-default', 'main-host', 'ian-poster', 'ian poster'] },
];

const TALKING_FRAME_MOTION = [
  { sx: 1.0, sy: 1.0, y: 0, brightness: 0.0 },
  { sx: 1.015, sy: 0.985, y: 2, brightness: 0.006 },
  { sx: 0.992, sy: 1.01, y: -1, brightness: 0.0 },
  { sx: 1.012, sy: 0.988, y: 2, brightness: 0.004 },
  { sx: 0.996, sy: 1.004, y: -1, brightness: 0.0 },
  { sx: 1.018, sy: 0.982, y: 3, brightness: 0.008 },
  { sx: 0.99, sy: 1.012, y: -2, brightness: -0.003 },
  { sx: 1.01, sy: 0.99, y: 1, brightness: 0.003 },
  { sx: 0.995, sy: 1.005, y: -1, brightness: 0.0 },
  { sx: 1.0, sy: 1.0, y: 0, brightness: 0.0 },
];

function parseArgs(argv = []) {
  const options = {
    zip: '',
    overlay: '',
    overlayPerThemeZip: '',
    idlePrefix: 'persona-host-idle',
    talkPrefix: 'persona-host-talk',
    frameCount: 10,
    overlayOutputName: 'host-overlay.png',
    themeOrder: [],
    fallbackUnmatchedToThemeOrder: false,
    listUnmatched: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--zip') {
      options.zip = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--overlay') {
      options.overlay = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--overlay-per-theme-zip') {
      options.overlayPerThemeZip = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--idle-prefix') {
      options.idlePrefix = String(argv[i + 1] || '').trim() || 'persona-host-idle';
      i += 1;
    } else if (arg === '--talk-prefix') {
      options.talkPrefix = String(argv[i + 1] || '').trim() || 'persona-host-talk';
      i += 1;
    } else if (arg === '--frame-count') {
      const parsed = Number(argv[i + 1]);
      options.frameCount = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 10;
      i += 1;
    } else if (arg === '--overlay-output-name') {
      options.overlayOutputName = String(argv[i + 1] || '').trim() || 'host-overlay.png';
      i += 1;
    } else if (arg === '--theme-order') {
      options.themeOrder = String(argv[i + 1] || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      options.fallbackUnmatchedToThemeOrder = true;
      i += 1;
    } else if (arg === '--all-themes-order') {
      options.themeOrder = Object.keys(THEME_HOST_SLUGS);
      options.fallbackUnmatchedToThemeOrder = true;
    } else if (arg === '--default-theme-order') {
      options.themeOrder = [...DEFAULT_THEME_ORDER];
      options.fallbackUnmatchedToThemeOrder = true;
    } else if (arg === '--list-unmatched') {
      options.listUnmatched = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function usage() {
  console.log('Usage: npm run host:install-theme-host-packs -- --zip <hosts-zip> [options]');
  console.log('');
  console.log('Required/typical options:');
  console.log('  --zip <path>                   ZIP containing host PNGs by theme');
  console.log('  --overlay <path>               Base overlay PNG used to build per-theme variants');
  console.log('  --overlay-per-theme-zip <path> ZIP containing theme-specific overlay PNGs (overrides generated variants)');
  console.log('');
  console.log('Optional options:');
  console.log('  --idle-prefix <name>           Output idle filename prefix (default: persona-host-idle)');
  console.log('  --talk-prefix <name>           Output talking filename prefix (default: persona-host-talk)');
  console.log('  --frame-count <number>         Talking frame count (default: 10)');
  console.log('  --overlay-output-name <name>   Overlay filename (default: host-overlay.png)');
  console.log('  --theme-order "<a,b,c>"        Assign unmatched source files by this explicit theme order');
  console.log('  --default-theme-order          Assign unmatched source files by default core theme order');
  console.log('  --all-themes-order             Assign unmatched source files by all theme names');
  console.log('  --list-unmatched               Print unmatched source files');
  console.log('  --dry-run                      Print planned output only');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function pickLatestZip(regex) {
  if (!fs.existsSync(exportsDir)) return '';
  const candidates = fs.readdirSync(exportsDir)
    .filter((name) => name.toLowerCase().endsWith('.zip'))
    .filter((name) => regex.test(name.toLowerCase()))
    .map((name) => path.join(exportsDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || '';
}

function resolveFile(rawPath, fallbackRegex) {
  const explicit = String(rawPath || '').trim();
  if (explicit) {
    const resolved = path.isAbsolute(explicit) ? explicit : path.resolve(repoRoot, explicit);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${resolved}`);
    }
    return resolved;
  }
  const fallback = pickLatestZip(fallbackRegex);
  if (!fallback) return '';
  return fallback;
}

function runCommand(command, args, { cwd = repoRoot, silent = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: silent ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: silent ? 'utf8' : undefined,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
  return result.stdout || '';
}

function unzipTo(zipPath, outputDir) {
  ensureDir(outputDir);
  runCommand('unzip', ['-o', zipPath, '-d', outputDir]);
  runCommand('chmod', ['-R', 'u+rwX', outputDir]);
}

function collectPngFiles(dirPath, list = []) {
  if (!fs.existsSync(dirPath)) return list;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectPngFiles(fullPath, list);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      list.push(fullPath);
    }
  }
  return list;
}

function normalizeForMatch(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function detectThemeForPath(filePath) {
  const normalized = normalizeForMatch(filePath);
  for (const rule of THEME_MATCH_RULES) {
    if (rule.patterns.some((pattern) => normalized.includes(normalizeForMatch(pattern)))) {
      return rule.theme;
    }
  }
  return '';
}

function generateTalkingFrames(sourcePath, hostDir, talkPrefix, frameCount) {
  const generatedOutputs = [];
  const fallbackOutputs = [];
  let transformFailed = false;
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const motion = TALKING_FRAME_MOTION[frameIndex % TALKING_FRAME_MOTION.length];
    const outputPath = path.join(hostDir, `${talkPrefix}-${String(frameIndex + 1).padStart(2, '0')}.png`);
    if (transformFailed) {
      fs.copyFileSync(sourcePath, outputPath);
      fallbackOutputs.push(outputPath);
      continue;
    }
    try {
      runCommand('ffmpeg', [
        '-y',
        '-loglevel',
        'error',
        '-i',
        sourcePath,
        '-vf',
        [
          'format=rgba',
          `scale=iw*${Number(motion.sx || 1).toFixed(3)}:ih*${Number(motion.sy || 1).toFixed(3)}:flags=lanczos`,
          'pad=iw*1.06:ih*1.06:(ow-iw)/2:(oh-ih)/2:color=black@0.0',
          `crop=in_w/1.06:in_h/1.06:(in_w-out_w)/2:(in_h-out_h)/2+${Math.round(motion.y || 0)}`,
          `eq=brightness=${Number(motion.brightness || 0).toFixed(3)}:saturation=1.02`,
        ].join(','),
        '-frames:v',
        '1',
        outputPath,
      ]);
      generatedOutputs.push(outputPath);
    } catch {
      transformFailed = true;
      fs.copyFileSync(sourcePath, outputPath);
      fallbackOutputs.push(outputPath);
    }
  }
  return { generatedOutputs, fallbackOutputs, usedFallback: fallbackOutputs.length > 0 };
}

function buildAssignments(hostPngPaths = [], themeOrder = [], { allowThemeOrderFallback = false } = {}) {
  const directAssignments = [];
  const unmatched = [];
  const usedThemes = new Set();
  const sortedPaths = [...hostPngPaths].sort((a, b) => a.localeCompare(b));

  for (const sourcePath of sortedPaths) {
    const themeName = detectThemeForPath(sourcePath);
    if (themeName && THEME_HOST_SLUGS[themeName] && !usedThemes.has(themeName)) {
      directAssignments.push({ sourcePath, themeName, via: 'filename-match' });
      usedThemes.add(themeName);
      continue;
    }
    unmatched.push(sourcePath);
  }

  const fallbackOrder = allowThemeOrderFallback
    ? (themeOrder || []).filter((themeName) => THEME_HOST_SLUGS[themeName] && !usedThemes.has(themeName))
    : [];
  const fallbackAssignments = [];
  unmatched.forEach((sourcePath, index) => {
    const themeName = fallbackOrder[index] || '';
    if (!themeName) return;
    fallbackAssignments.push({ sourcePath, themeName, via: 'theme-order' });
    usedThemes.add(themeName);
  });

  const trulyUnmatched = unmatched.slice(fallbackAssignments.length);
  return {
    assignments: [...directAssignments, ...fallbackAssignments],
    unmatched: trulyUnmatched,
    directAssignmentCount: directAssignments.length,
    fallbackAssignmentCount: fallbackAssignments.length,
  };
}

function installHosts({ assignments, frameCount, idlePrefix, talkPrefix, dryRun = false }) {
  const installedThemes = new Set();
  assignments.forEach(({ sourcePath, themeName, via }) => {
    const themeSlug = THEME_HOST_SLUGS[themeName];
    if (!themeSlug) return;
    const hostDir = path.join(themesRoot, themeSlug, 'hosts');
    const idleOutputPath = path.join(hostDir, `${idlePrefix}.png`);
    if (dryRun) {
      console.log(`[installThemeHostPacks] PLAN host ${themeName} (${via})`);
      console.log(`- src: ${sourcePath}`);
      console.log(`- idle: ${idleOutputPath}`);
      console.log(`- talk: ${path.join(hostDir, `${talkPrefix}-01.png`)} ... ${path.join(hostDir, `${talkPrefix}-${String(frameCount).padStart(2, '0')}.png`)}`);
      installedThemes.add(themeName);
      return;
    }
    ensureDir(hostDir);
    fs.copyFileSync(sourcePath, idleOutputPath);
    generateTalkingFrames(sourcePath, hostDir, talkPrefix, frameCount);
    installedThemes.add(themeName);
  });
  return installedThemes;
}

function buildOverlayVariantSettings(themeName = '', index = 0) {
  let hash = 0;
  String(themeName).split('').forEach((char) => {
    hash = (hash * 33 + char.charCodeAt(0)) % 9973;
  });
  const hue = ((hash + (index * 37)) % 360) - 180;
  const saturation = 1.02 + ((hash % 5) * 0.05);
  const brightness = ((hash % 7) - 3) * 0.006;
  return {
    hue,
    saturation,
    brightness,
  };
}

function generateOverlayVariants({ overlayPath, overlayOutputName = 'host-overlay.png', dryRun = false }) {
  if (!overlayPath) return { copied: 0 };
  const resolvedOverlay = path.isAbsolute(overlayPath) ? overlayPath : path.resolve(repoRoot, overlayPath);
  if (!fs.existsSync(resolvedOverlay)) {
    throw new Error(`Overlay file not found: ${resolvedOverlay}`);
  }

  let copied = 0;
  const allThemes = Object.keys(THEME_HOST_SLUGS);
  allThemes.forEach((themeName, index) => {
    const themeSlug = THEME_HOST_SLUGS[themeName];
    const hostDir = path.join(themesRoot, themeSlug, 'hosts');
    const outputPath = path.join(hostDir, overlayOutputName);
    const variant = buildOverlayVariantSettings(themeName, index);
    if (dryRun) {
      console.log(`[installThemeHostPacks] PLAN overlay ${themeName}`);
      console.log(`- src: ${resolvedOverlay}`);
      console.log(`- out: ${outputPath}`);
      console.log(`- hue: ${variant.hue}, sat: ${variant.saturation.toFixed(3)}, bright: ${variant.brightness.toFixed(3)}`);
      copied += 1;
      return;
    }
    ensureDir(hostDir);
    try {
      runCommand('ffmpeg', [
        '-y',
        '-loglevel',
        'error',
        '-i',
        resolvedOverlay,
        '-vf',
        `format=rgba,hue=h=${variant.hue}:s=${variant.saturation.toFixed(3)},eq=brightness=${variant.brightness.toFixed(3)}:contrast=1.030`,
        '-frames:v',
        '1',
        '-update',
        '1',
        outputPath,
      ]);
    } catch {
      // Fallback: still write an overlay so installer never blocks runtime integration.
      fs.copyFileSync(resolvedOverlay, outputPath);
    }
    copied += 1;
  });
  return { copied };
}

function applyThemeSpecificOverlays({ overlayZipPath = '', overlayOutputName = 'host-overlay.png', listUnmatched = false, dryRun = false }) {
  if (!overlayZipPath) return { copied: 0, unmatched: [] };
  const overlayTmp = path.join(tmpRoot, 'overlay');
  clearDir(overlayTmp);
  unzipTo(overlayZipPath, overlayTmp);
  const overlayFiles = collectPngFiles(overlayTmp);
  const unmatched = [];
  let copied = 0;
  overlayFiles.forEach((sourcePath) => {
    const themeName = detectThemeForPath(sourcePath);
    const themeSlug = THEME_HOST_SLUGS[themeName];
    if (!themeName || !themeSlug) {
      unmatched.push(sourcePath);
      return;
    }
    const hostDir = path.join(themesRoot, themeSlug, 'hosts');
    const outputPath = path.join(hostDir, overlayOutputName);
    if (dryRun) {
      console.log(`[installThemeHostPacks] PLAN overlay override ${themeName}: ${sourcePath} -> ${outputPath}`);
      copied += 1;
      return;
    }
    ensureDir(hostDir);
    fs.copyFileSync(sourcePath, outputPath);
    copied += 1;
  });
  if (listUnmatched && unmatched.length) {
    console.log('[installThemeHostPacks] Unmatched overlay images:');
    unmatched.forEach((entry) => console.log(`- ${entry}`));
  }
  return { copied, unmatched };
}

function toPublicAssetPath(filePath = '') {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  const marker = '/public/';
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex < 0) return '';
  return normalized.slice(markerIndex + '/public'.length);
}

function scanGeneratedHostMedia({ idlePrefix, talkPrefix, frameCount, overlayOutputName }) {
  const output = {};
  Object.entries(THEME_HOST_SLUGS).forEach(([themeName, themeSlug]) => {
    const hostDir = path.join(themesRoot, themeSlug, 'hosts');
    if (!fs.existsSync(hostDir)) return;
    const idlePath = path.join(hostDir, `${idlePrefix}.png`);
    const overlayPath = path.join(hostDir, overlayOutputName);
    const talkingFrames = [];
    for (let index = 1; index <= frameCount; index += 1) {
      const framePath = path.join(hostDir, `${talkPrefix}-${String(index).padStart(2, '0')}.png`);
      if (fs.existsSync(framePath)) talkingFrames.push(toPublicAssetPath(framePath));
    }

    const entry = {};
    if (fs.existsSync(idlePath)) {
      entry.personaHostIdle = toPublicAssetPath(idlePath);
    } else if (talkingFrames[0]) {
      entry.personaHostIdle = talkingFrames[0];
    }
    if (talkingFrames.length) {
      entry.personaHostTalkingFrames = talkingFrames;
      entry.personaHostTalk1 = talkingFrames[0] || '';
      entry.personaHostTalk2 = talkingFrames[1] || talkingFrames[0] || '';
      entry.personaHostTalk3 = talkingFrames[2] || talkingFrames[1] || talkingFrames[0] || '';
    }
    if (fs.existsSync(overlayPath)) {
      entry.hostOverlay = toPublicAssetPath(overlayPath);
    }

    if (Object.keys(entry).length) {
      output[themeName] = entry;
    }
  });
  return output;
}

function writeGeneratedHostMediaFile(hostMediaMap = {}) {
  const content = [
    '// Auto-generated by scripts/installThemeHostPacks.cjs',
    '// Run that script again to refresh mappings.',
    `export const THEME_GENERATED_HOST_MEDIA = ${JSON.stringify(hostMediaMap, null, 2)};`,
    '',
  ].join('\n');
  fs.writeFileSync(generatedMediaPath, content, 'utf8');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const hostZipPath = resolveFile(options.zip, /host|hosts/);
  if (!hostZipPath) {
    throw new Error('No host ZIP found. Pass --zip <path> or place a host ZIP in exports/.');
  }
  const overlayThemeZipPath = resolveFile(options.overlayPerThemeZip, /overlay/);

  clearDir(tmpRoot);
  ensureDir(tmpRoot);
  const hostTmp = path.join(tmpRoot, 'hosts');
  unzipTo(hostZipPath, hostTmp);
  const hostPngPaths = collectPngFiles(hostTmp);
  if (!hostPngPaths.length) {
    throw new Error(`No PNG files found in host ZIP: ${hostZipPath}`);
  }

  const { assignments, unmatched, directAssignmentCount, fallbackAssignmentCount } = buildAssignments(
    hostPngPaths,
    options.themeOrder,
    { allowThemeOrderFallback: options.fallbackUnmatchedToThemeOrder }
  );
  const installedThemes = installHosts({
    assignments,
    frameCount: options.frameCount,
    idlePrefix: options.idlePrefix,
    talkPrefix: options.talkPrefix,
    dryRun: options.dryRun,
  });

  const overlayResult = generateOverlayVariants({
    overlayPath: options.overlay,
    overlayOutputName: options.overlayOutputName,
    dryRun: options.dryRun,
  });
  const themeOverlayResult = applyThemeSpecificOverlays({
    overlayZipPath: overlayThemeZipPath,
    overlayOutputName: options.overlayOutputName,
    listUnmatched: options.listUnmatched,
    dryRun: options.dryRun,
  });

  if (options.listUnmatched && unmatched.length) {
    console.log('[installThemeHostPacks] Unmatched host images:');
    unmatched.forEach((entry) => console.log(`- ${entry}`));
  }

  const orderedThemes = Object.keys(THEME_HOST_SLUGS);
  if (!options.dryRun) {
    const generatedMap = scanGeneratedHostMedia({
      idlePrefix: options.idlePrefix,
      talkPrefix: options.talkPrefix,
      frameCount: options.frameCount,
      overlayOutputName: options.overlayOutputName,
    });
    writeGeneratedHostMediaFile(generatedMap);
  }
  console.log('[installThemeHostPacks] Installed host packs summary:');
  console.log(`- Host source ZIP: ${hostZipPath}`);
  console.log(`- Host assignments: ${assignments.length}/${hostPngPaths.length}`);
  console.log(`  - Via filename match: ${directAssignmentCount}`);
  if (options.fallbackUnmatchedToThemeOrder) {
    console.log(`  - Via explicit theme order: ${fallbackAssignmentCount}`);
  }
  console.log(`- Themes installed: ${installedThemes.size}/${orderedThemes.length}`);
  console.log(`- Talking frames per theme: ${options.frameCount}`);
  if (options.overlay) {
    console.log(`- Generated themed overlays: ${overlayResult.copied}`);
  }
  if (overlayThemeZipPath) {
    console.log(`- Theme-specific overlay overrides: ${themeOverlayResult.copied}`);
  }
  if (unmatched.length) {
    console.log(`- Unmatched host PNG files: ${unmatched.length}`);
    if (!options.fallbackUnmatchedToThemeOrder) {
      console.log('  Tip: use --theme-order "<theme A,theme B,...>" to assign unmatched files explicitly.');
    }
  }
  if (themeOverlayResult.unmatched.length) {
    console.log(`- Unmatched overlay PNG files: ${themeOverlayResult.unmatched.length}`);
  }
  if (!options.dryRun) {
    console.log(`- Generated host media map: ${generatedMediaPath}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`[installThemeHostPacks] ${error.message}`);
  process.exit(1);
}
