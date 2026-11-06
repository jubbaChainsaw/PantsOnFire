/**
 * Ian narration refresh (2026-11-06): verify frozen 112 fragment paths + 500 base cue copies.
 * Technical: SHA256 + fs presence + hostVoiceLineMap filename resolution. No perceptual review.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  getHostVoiceFilenameForLine,
  getHostVoiceSrcCandidatesForLine,
} from '../../src/data/hostVoiceLineMap.js';

const REPO_ROOT = process.cwd();

function readJson(rel) {
  return JSON.parse(readFileSync(join(REPO_ROOT, rel), 'utf8'));
}

const additionalManifest = readJson('docs/audio/additional-host-phrases-manifest.json');
const baseMapping = readJson('docs/audio/ian-narration-refresh-2026-11-06/BASE_FILE_MAPPING.json');
const pathIndex = readJson('docs/audio/ian-narration-refresh-2026-11-06/PATH_INDEX.json');
const newRoundCues = readJson('docs/audio/ian-narration-refresh-2026-11-06/NEW_ROUND_CUES.json');

function sha256File(abs) {
  const h = createHash('sha256');
  h.update(readFileSync(abs));
  return h.digest('hex');
}

const FILENAME_PREFIX_TO_THEME = {
  default: 'Default',
  'murder-mystery': 'Murder Mystery',
  pirates: 'Pirates',
  'cops-and-robbers': 'Cops and Robbers',
  'ghosts-and-ghouls': 'Ghosts and Ghouls',
  wrestlers: 'Wrestlers',
};

function themeNameFromPrimaryFilename(fn = '') {
  const m = String(fn).match(/^(default|murder-mystery|pirates|cops-and-robbers|ghosts-and-ghouls|wrestlers)_/);
  assert.ok(m, `unexpected primary filename prefix: ${fn}`);
  return FILENAME_PREFIX_TO_THEME[m[1]];
}

test('additional-host-phrases manifest matches frozen corpus id + sha256 from handoff', () => {
  const frozen = JSON.parse(
    readFileSync(
      join(REPO_ROOT, 'docs/audio/ian-narration-refresh-2026-11-06/frozen-corpus-manifest.json'),
      'utf8',
    ),
  );
  assert.equal(additionalManifest.frozenCorpusId, frozen.frozenCorpusId);
  assert.equal(additionalManifest.corpusSha256, frozen.corpusSha256);
});

test('PATH_INDEX: every fragment MP3 exists under public/ with expected sha256 + byte size', () => {
  assert.equal(pathIndex.length, 112);
  for (const row of pathIndex) {
    const abs = join(REPO_ROOT, row.primaryRelativePath);
    assert.ok(existsSync(abs), `missing ${row.primaryRelativePath}`);
    const buf = readFileSync(abs);
    assert.equal(buf.length, row.bytes, `byte size ${row.primaryRelativePath}`);
    assert.equal(sha256File(abs), row.sha256, `sha256 ${row.primaryRelativePath}`);
  }
});

test('BASE_FILE_MAPPING: every primary symlink target exists and matches sha256; map resolves spoken text to filename', () => {
  assert.equal(baseMapping.mapping.length, 500);
  let primaryFileCount = 0;
  for (const row of baseMapping.mapping) {
    const primaryFilenames = row.primaryFilenames || [];
    assert.ok(primaryFilenames.length >= 1, `row ${row.cueId} has no primaryFilenames`);
    const themesChecked = new Set();
    for (const fn of primaryFilenames) {
      primaryFileCount += 1;
      const themeName = themeNameFromPrimaryFilename(fn);
      const slug =
        Object.entries(FILENAME_PREFIX_TO_THEME).find(([, n]) => n === themeName)?.[0] || '';
      const abs = join(REPO_ROOT, 'public/assets/audio/host', slug, 'tts', fn);
      assert.ok(existsSync(abs), `missing ${abs}`);
      assert.equal(sha256File(abs), row.sha256, `sha256 ${fn}`);
      if (!themesChecked.has(themeName)) {
        themesChecked.add(themeName);
        const mapped = getHostVoiceFilenameForLine(row.spokenText, themeName);
        assert.ok(
          mapped,
          `empty map for ${themeName} cue ${row.cueId}: "${row.spokenText}"`,
        );
        assert.ok(
          primaryFilenames.includes(mapped),
          `map for ${themeName} cue ${row.cueId}: "${row.spokenText}" → ${mapped}; expected one of ${primaryFilenames.join(', ')}`,
        );
        const candidates = getHostVoiceSrcCandidatesForLine(row.spokenText, themeName);
        assert.ok(
          candidates.some((c) => c.endsWith(`/tts/${mapped}`)),
          `src candidates missing /tts/${mapped} for ${row.cueId} (${themeName})`,
        );
      }
    }
  }
  assert.equal(primaryFileCount, 570);
});

test('NEW_ROUND_CUES.json is non-empty subset documenting new round / phase lines', () => {
  assert.ok(Array.isArray(newRoundCues));
  assert.ok(newRoundCues.length >= 1);
  for (const row of newRoundCues) {
    assert.equal(typeof row.cueId, 'string');
    assert.equal(typeof row.spokenText, 'string');
  }
});
