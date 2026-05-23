#!/usr/bin/env node
/**
 * Builds exports/host-voice-lines-master.csv for core themes only.
 * DLC packs use: npm run host:export-dlc-voice -- --pack <pack-id>
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
const exportsDir = path.join(repoRoot, 'exports');
const masterRegistryPath = path.join(exportsDir, 'host-voice-master.csv');
const linesOutPath = path.join(exportsDir, 'host-voice-lines-master.csv');
const ssmlOutPath = path.join(exportsDir, 'host-voice-lines-master-ssml.csv');

const CORE_THEME_NAMES = [
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
];

function main() {
  const ctx = loadIanPosterVoiceContext(repoRoot);
  const registry = parseMasterRegistry(readFile(masterRegistryPath));
  const registryBySlug = Object.fromEntries(registry.map((r) => [r.theme_slug, r]));
  const roundTypes = ctx.__ROUND_TYPES;

  const allRows = [];
  CORE_THEME_NAMES.forEach((themeName) => {
    const voice = ctx.__IAN_POSTER_THEME_VOICE[themeName];
    if (!voice) return;
    const slug = ctx.__THEME_VOICE_SLUG_BY_NAME[themeName] || themeName.toLowerCase();
    const reg = registryBySlug[slug];
    if (!reg || !reg.enabled) return;
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

  writeVoiceExports({
    rows: allRows,
    linesOutPath,
    ssmlOutPath,
    logPrefix: 'exportHostVoiceMasterCsv',
  });
  console.log(`[exportHostVoiceMasterCsv] Core themes in registry: ${registry.length}`);
}

main();
