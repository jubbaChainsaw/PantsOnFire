#!/usr/bin/env node
/**
 * Writes docs/audio/additional-host-phrases-manifest.json — incremental lines for t220u/t221u parent generation.
 * Frozen spoken-word corpus: hash `corpusSha256` + `uniqueFragments`; parent reuses existing MP3 when
 * fragment text is unchanged — avoid regeneration for capitalization/punctuation-only diffs.
 */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODULAR_BANTER_FIXED_SCRIPTS } from '../src/data/modularHostBanterScripts.js';
import {
  getIanPosterThemeSlug,
  IAN_POSTER_VOICE_THEME_NAMES,
} from '../src/data/ianPosterThemeVoice.js';

/** Bump when fixed-script IDs or spoken export strings change in a way that requires new TTS. */
const FROZEN_CORPUS_ID = 'df7269-modular-fragments-v1';

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
      /** Parent TTS line: fixed fragment only (no name placeholders). */
      spokenText: s.exportSpokenText || s.spokenText || '',
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return sha256(JSON.stringify({ themes, scripts }));
}

function uniqueExportFragments() {
  const texts = [...MODULAR_BANTER_FIXED_SCRIPTS]
    .map((s) => String(s.exportSpokenText || s.spokenText || '').trim())
    .filter(Boolean);
  return [...new Set(texts)].sort();
}

/** Themes that intentionally share one voice slug / tts folder (same stableFilename paths). */
function themeSlugSharedPaths() {
  const bySlug = new Map();
  for (const themeName of IAN_POSTER_VOICE_THEME_NAMES) {
    const slug = getIanPosterThemeSlug(themeName);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(themeName);
  }
  return [...bySlug.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([themeSlug, themeNames]) => ({ themeSlug, themeNames: [...themeNames].sort() }))
    .sort((a, b) => a.themeSlug.localeCompare(b.themeSlug));
}

/**
 * Runtime wiring for subtitles (not exported as single TTS lines). Persona name audio is separate 950 bank.
 */
const COMPOSITION_BY_EVENT = [
  {
    eventId: 'picker_turn',
    description:
      'Persona-only: v2 plays lead “Alright —” then persona name then body; v3 plays name then name-free “stops here.”; v1 name then body. Else one fragment; subtitle from buildComposedSubtitleLine.',
    segmentPattern: [
      {
        order: 0,
        optional: true,
        kind: 'fixed_script',
        scriptId: 'banter_picker_alright_lead_v2',
        note: 'Only persona + banter_picker_prefix_v2.',
      },
      { order: 1, optional: true, kind: 'persona_name', note: 'Persona name clip (950 bank or theme file).' },
      {
        order: 2,
        kind: 'fixed_script',
        scriptIdPrefix: 'banter_picker_',
        excludeScriptId: 'banter_picker_alright_lead_v2',
      },
    ],
    subtitleBuilder: 'buildComposedSubtitleLine in modularHostBanterScripts.js',
  },
  {
    eventId: 'liar_reveal_singular',
    segmentPattern: [
      { order: 0, kind: 'fixed_script', scriptId: 'banter_reveal_liar_is_prefix_v1' },
      { order: 1, optional: true, kind: 'persona_name', note: 'Liar display name when personaOnlyMode.' },
      { order: 2, kind: 'fixed_script', scriptIdPattern: 'banter_reveal_suffix_singular_*' },
    ],
  },
  {
    eventId: 'liar_reveal_plural',
    segmentPattern: [
      { order: 0, kind: 'fixed_script', scriptId: 'banter_reveal_plural_v1' },
      {
        order: 1,
        kind: 'names',
        note: 'Persona callout per liar when personaOnlyMode; else subtitle lists comma-separated display names only.',
      },
    ],
  },
  {
    eventId: 'result_banter',
    segmentPattern: [{ order: 0, kind: 'fixed_script', scriptIdPattern: 'banter_result_*' }],
  },
  {
    eventId: 'final_wrap',
    segmentPattern: [{ order: 0, kind: 'fixed_script', scriptId: 'banter_wrap_v1' }],
  },
];

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

const uniqueFragments = uniqueExportFragments();

const manifest = {
  schemaVersion: 1,
  purpose: 'incremental-modular-banter-t220u',
  taskRefs: ['t220u', 't221u'],
  frozenCorpusId: FROZEN_CORPUS_ID,
  parentReuseNote:
    'Compare spokenText per scriptId to prior bank (e.g. e639a9): reuse MP3 when words match; do not regenerate for capitalization or punctuation-only deltas unless audio must change.',
  generatedAt: new Date().toISOString(),
  corpusSha256: modularBanterCorpusSha256(),
  uniqueFragmentCount: uniqueFragments.length,
  uniqueFragments,
  themeSlugSharedPaths: themeSlugSharedPaths(),
  compositionByEvent: COMPOSITION_BY_EVENT,
  voiceNote: 'Uses existing Ian Poster voice id from parent batch; no catalog name regeneration.',
  lineCount: lines.length,
  lines,
};

const outPath = new URL('../docs/audio/additional-host-phrases-manifest.json', import.meta.url);
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
// eslint-disable-next-line no-console
console.log(`Wrote ${outPath.pathname} (${lines.length} rows)`);
