#!/usr/bin/env node
/**
 * Writes docs/audio/additional-host-phrases-manifest.json — incremental lines for t220u/t221u parent generation.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODULAR_BANTER_FIXED_SCRIPTS } from '../src/data/modularHostBanterScripts.js';
import {
  getIanPosterThemeSlug,
  IAN_POSTER_VOICE_THEME_NAMES,
} from '../src/data/ianPosterThemeVoice.js';

function stableFilename(themeName, stem) {
  const slug = getIanPosterThemeSlug(themeName);
  return `${slug}_banter_${stem}.mp3`;
}

function sha256(s) {
  return createHash('sha256').update(s).digest('hex');
}

/** Stable across commits: hashes fixed script corpus + theme set only (not repo HEAD). */
function modularBanterCorpusSha256() {
  const themes = [...IAN_POSTER_VOICE_THEME_NAMES]
    .map((name) => getIanPosterThemeSlug(name))
    .sort();
    const scripts = [...MODULAR_BANTER_FIXED_SCRIPTS]
    .map((s) => ({
      id: s.id,
      filenameStem: s.filenameStem,
      segmentRole: s.segmentRole,
      /** Parent TTS line: full sentence for export, or runtime line for fixed banks */
      spokenText: s.exportSpokenText || s.spokenText || '',
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return sha256(JSON.stringify({ themes, scripts }));
}

const lines = [];
for (const themeName of IAN_POSTER_VOICE_THEME_NAMES) {
  for (const script of MODULAR_BANTER_FIXED_SCRIPTS) {
    const filename = stableFilename(themeName, script.filenameStem);
    const spokenText = script.exportSpokenText || script.spokenText || '';
    lines.push({
      lineId: `${getIanPosterThemeSlug(themeName)}:${script.id}`,
      themeName,
      themeSlug: getIanPosterThemeSlug(themeName),
      segmentRole: script.segmentRole,
      scriptId: script.id,
      spokenText,
      primaryRelativePath: `public/assets/audio/host/${getIanPosterThemeSlug(themeName)}/tts/${filename}`,
      stableFilename: filename,
      contentSha256: sha256(spokenText),
    });
  }
}

const manifest = {
  schemaVersion: 1,
  purpose: 'incremental-modular-banter-t220u',
  taskRefs: ['t220u', 't221u'],
  generatedAt: new Date().toISOString(),
  corpusSha256: modularBanterCorpusSha256(),
  voiceNote: 'Uses existing Ian Poster voice id from parent batch; no catalog name regeneration.',
  lineCount: lines.length,
  lines,
};

const outPath = new URL('../docs/audio/additional-host-phrases-manifest.json', import.meta.url);
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
// eslint-disable-next-line no-console
console.log(`Wrote ${outPath.pathname} (${lines.length} rows)`);
