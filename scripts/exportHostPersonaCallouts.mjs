#!/usr/bin/env node
/**
 * Export Ian Poster persona name callouts for beta launch themes.
 * Output: exports/host-persona-callouts.csv (+ SSML companion)
 *
 * Generate MP3s:
 *   npm run host:generate-elevenlabs -- --persona-callouts --install
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildElevenLabsSsmlExport,
  buildElevenLabsTtsText,
} from './lib/elevenLabsTtsPrompt.cjs';
import {
  getPersonaCalloutEntriesForTheme,
  HOST_PERSONA_CALLOUT_THEME_NAMES,
} from '../src/data/hostPersonaCallouts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const exportsDir = path.join(repoRoot, 'exports');
const masterRegistryPath = path.join(exportsDir, 'host-voice-master.csv');
const dlcRegistryPath = path.join(exportsDir, 'dlc', 'wanted-better-alibis', 'host-voice-master.csv');
const linesOutPath = path.join(exportsDir, 'host-persona-callouts.csv');
const ssmlOutPath = path.join(exportsDir, 'host-persona-callouts-ssml.csv');

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseRegistry(csvText) {
  const lines = csvText.trim().split('\n');
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const bySlug = {};
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map((c) => c.trim());
    const theme_slug = cols[idx.theme_slug] || '';
    bySlug[theme_slug] = {
      theme_slug,
      theme_name: cols[idx.theme_name] || '',
      voice_id: cols[idx.voice_id] || '',
      accent_notes: cols[idx.accent_notes] || '',
    };
  }
  return bySlug;
}

function loadVoiceRegistry() {
  const bySlug = {};
  if (fs.existsSync(masterRegistryPath)) {
    Object.assign(bySlug, parseRegistry(fs.readFileSync(masterRegistryPath, 'utf8')));
  }
  if (fs.existsSync(dlcRegistryPath)) {
    Object.assign(bySlug, parseRegistry(fs.readFileSync(dlcRegistryPath, 'utf8')));
  }
  return bySlug;
}

function main() {
  const registryBySlug = loadVoiceRegistry();
  const rows = [];

  HOST_PERSONA_CALLOUT_THEME_NAMES.forEach((themeName) => {
    getPersonaCalloutEntriesForTheme(themeName).forEach((entry) => {
      const slug = entry.themeSlug;
      const reg = registryBySlug[slug] || {};
      const voiceId = reg.voice_id || '';
      const accentNotes = reg.accent_notes || '';
      const ttsOpts = { lineType: 'persona_callout', variant: entry.variant };
      rows.push({
        filename: entry.filename,
        theme_slug: slug,
        theme_name: themeName,
        persona_id: entry.personaId,
        voice_id: voiceId,
        accent_notes: accentNotes,
        line_type: 'persona_callout',
        variant: entry.variant,
        line_text: entry.lineText,
        tts_text: buildElevenLabsTtsText(entry.lineText, ttsOpts),
        ssml: buildElevenLabsSsmlExport(entry.lineText, ttsOpts),
      });
    });
  });

  const header = [
    'filename',
    'theme_slug',
    'theme_name',
    'persona_id',
    'voice_id',
    'accent_notes',
    'line_type',
    'variant',
    'line_text',
    'tts_text',
    'ssml',
  ];

  const linesCsv = [
    header.join(','),
    ...rows.map((row) => [
      csvEscape(row.filename),
      csvEscape(row.theme_slug),
      csvEscape(row.theme_name),
      csvEscape(row.persona_id),
      csvEscape(row.voice_id),
      csvEscape(row.accent_notes),
      csvEscape(row.line_type),
      csvEscape(row.variant),
      csvEscape(row.line_text),
      csvEscape(row.tts_text),
      csvEscape(row.ssml),
    ].join(',')),
  ].join('\n') + '\n';

  const ssmlCsv = [
    'filename,theme_slug,voice_id,tts_text',
    ...rows.map((row) => [
      csvEscape(row.filename),
      csvEscape(row.theme_slug),
      csvEscape(row.voice_id),
      csvEscape(row.tts_text),
    ].join(',')),
  ].join('\n') + '\n';

  fs.mkdirSync(exportsDir, { recursive: true });
  fs.writeFileSync(linesOutPath, linesCsv, 'utf8');
  fs.writeFileSync(ssmlOutPath, ssmlCsv, 'utf8');
  console.log(`[exportHostPersonaCallouts] Wrote ${rows.length} lines -> ${linesOutPath}`);
  console.log(`[exportHostPersonaCallouts] Wrote ${rows.length} SSML rows -> ${ssmlOutPath}`);
}

main();
