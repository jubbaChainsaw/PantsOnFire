#!/usr/bin/env node
/**
 * Batch-apply magenta (#FF00FF) chroma key to existing persona PNGs under public/assets/themes.
 */
const fs = require('fs');
const path = require('path');
const { applyChromaKeyTransparency } = require('./personaChromaKey.cjs');

const repoRoot = path.resolve(__dirname, '..');

function themeFolderFromName(themeName) {
  return String(themeName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseArgs(argv) {
  const options = {
    tolerance: 42,
    dryRun: false,
    theme: '',
    limit: 0,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--tolerance') { options.tolerance = Math.max(0, Number.parseInt(String(argv[i + 1] || '42'), 10) || 42); i += 1; }
    else if (arg === '--theme') { options.theme = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--limit') { options.limit = Math.max(0, Number.parseInt(String(argv[i + 1] || '0'), 10) || 0); i += 1; }
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log('Usage: npm run persona:key-chroma -- [options]');
  console.log('');
  console.log('Applies #FF00FF → alpha to PNGs under public/assets/themes/<theme>/personas/');
  console.log('');
  console.log('Options:');
  console.log('  --theme <name>     Only this theme folder (e.g. "Default" → default)');
  console.log('  --tolerance <0-255> RGB distance per channel (default: 42)');
  console.log('  --limit <n>        Stop after n files');
  console.log('  --dry-run          List files only');
}

function listPersonaPngPaths(themesRoot, themeFilterFolder) {
  const out = [];
  if (!fs.existsSync(themesRoot)) return out;
  const themeDirs = fs.readdirSync(themesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const theme of themeDirs) {
    if (themeFilterFolder && theme !== themeFilterFolder) continue;
    const personasDir = path.join(themesRoot, theme, 'personas');
    if (!fs.existsSync(personasDir)) continue;
    for (const file of fs.readdirSync(personasDir)) {
      if (!file.endsWith('.png')) continue;
      out.push(path.join(personasDir, file));
    }
  }
  return out.sort();
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const themesRoot = path.join(repoRoot, 'public', 'assets', 'themes');
  const themeFolder = options.theme ? themeFolderFromName(options.theme) : '';
  const paths = listPersonaPngPaths(themesRoot, themeFolder);
  const limited = options.limit > 0 ? paths.slice(0, options.limit) : paths;

  if (!limited.length) {
    console.log('[chromaKeyPersonaPngs] No PNG files matched.');
    return;
  }

  console.log(`[chromaKeyPersonaPngs] Files: ${limited.length}${options.theme ? ` (theme filter: ${options.theme} → ${themeFolder})` : ''}`);
  console.log(`[chromaKeyPersonaPngs] Tolerance: ${options.tolerance}`);

  let wrote = 0;
  for (let i = 0; i < limited.length; i += 1) {
    const filePath = limited[i];
    const rel = path.relative(repoRoot, filePath);
    if (options.dryRun) {
      console.log(`- [${i + 1}/${limited.length}] DRY ${rel}`);
      continue;
    }
    const input = fs.readFileSync(filePath);
    const output = await applyChromaKeyTransparency(input, { tolerance: options.tolerance });
    fs.writeFileSync(filePath, output);
    wrote += 1;
    console.log(`- [${i + 1}/${limited.length}] WROTE ${rel}`);
  }
  console.log(`[chromaKeyPersonaPngs] Done. Rewrote: ${wrote}${options.dryRun ? ` (dry-run, ${limited.length} files)` : ''}.`);
}

run().catch((err) => {
  console.error(`[chromaKeyPersonaPngs] ${err.message}`);
  process.exit(1);
});
