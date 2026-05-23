#!/usr/bin/env node
/**
 * Export Ian Poster host voice lines for one DLC pack.
 *
 * Usage:
 *   npm run host:export-dlc-voice -- --pack wanted-better-alibis
 *   node scripts/exportDlcHostVoicePack.cjs wanted-better-alibis
 */
const fs = require('fs');
const path = require('path');
const {
  collectRowsForTheme,
  loadIanPosterVoiceContext,
  parseMasterRegistry,
  readFile,
  writeVoiceExports,
} = require('./lib/hostVoiceExportLib.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parsePackArg() {
  const flagIdx = process.argv.indexOf('--pack');
  if (flagIdx >= 0 && process.argv[flagIdx + 1]) {
    return process.argv[flagIdx + 1].trim();
  }
  const positional = process.argv[2];
  if (positional && !positional.startsWith('-')) return positional.trim();
  return '';
}

function main() {
  const packId = parsePackArg();
  if (!packId) {
    throw new Error('Missing pack id. Example: npm run host:export-dlc-voice -- --pack wanted-better-alibis');
  }

  const ctx = loadIanPosterVoiceContext(repoRoot);
  const packMeta = ctx.__DLC_HOST_VOICE_PACKS?.[packId];
  if (!packMeta) {
    const known = Object.keys(ctx.__DLC_HOST_VOICE_PACKS || {}).join(', ');
    throw new Error(`Unknown DLC pack "${packId}". Known packs: ${known}`);
  }

  const packDir = path.join(repoRoot, 'exports', 'dlc', packId);
  const masterRegistryPath = path.join(packDir, 'host-voice-master.csv');
  if (!fs.existsSync(masterRegistryPath)) {
    throw new Error(`Missing ${masterRegistryPath}. Create host-voice-master.csv for this pack first.`);
  }

  const registry = parseMasterRegistry(readFile(masterRegistryPath));
  const registryBySlug = Object.fromEntries(registry.map((r) => [r.theme_slug, r]));
  const roundTypes = ctx.__ROUND_TYPES;

  const allRows = [];
  const missingThemes = [];

  (packMeta.themeNames || []).forEach((themeName) => {
    const voice = ctx.__IAN_POSTER_THEME_VOICE[themeName];
    if (!voice) {
      missingThemes.push(themeName);
      return;
    }
    const slug = ctx.__THEME_VOICE_SLUG_BY_NAME[themeName]
      || themeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const reg = registryBySlug[slug];
    if (!reg) {
      throw new Error(`Theme "${themeName}" (slug ${slug}) missing from ${masterRegistryPath}`);
    }
    if (!reg.enabled) return;
    allRows.push(
      ...collectRowsForTheme(
        reg.theme_name || themeName,
        voice,
        slug,
        reg.voice_id || '',
        reg.accent_notes || voice.accentNotes || '',
        roundTypes,
      ),
    );
  });

  if (missingThemes.length) {
    throw new Error(
      `No Ian Poster voice scripts yet for: ${missingThemes.join(', ')}. `
      + `Add them to src/data/dlc/ianPosterDlcThemeVoice.js`,
    );
  }
  if (!allRows.length) {
    throw new Error(`No lines exported for pack "${packId}". Check host-voice-master.csv enabled flags.`);
  }

  writeVoiceExports({
    rows: allRows,
    linesOutPath: path.join(packDir, 'host-voice-lines.csv'),
    ssmlOutPath: path.join(packDir, 'host-voice-lines-ssml.csv'),
    logPrefix: `exportDlcHostVoicePack:${packId}`,
  });
  console.log(`[exportDlcHostVoicePack] Pack: ${packMeta.name} (${packId})`);
  console.log(`[exportDlcHostVoicePack] Themes: ${(packMeta.themeNames || []).join(', ')}`);
}

main();
