/**
 * Writes docs/audio/ian-poster-voice-refresh-manifest.json from IAN_POSTER_HOST_LINE_RECORDS
 * plus filesystem checksums for all .mp3 files under public/assets/audio/host (recursive).
 * Backs up prior manifest to docs/audio/ian-poster-voice-refresh-manifest.json.bak
 * ffprobe: adds durationSeconds for resolved on-disk MP3s.
 *
 * Usage: node scripts/exportIanPosterVoiceManifest.mjs
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getHostVoiceFilenameForLine,
  IAN_POSTER_HOST_LINE_RECORDS,
} from '../src/data/hostVoiceLineMap.js';
import { IAN_POSTER_VOICE_THEME_NAMES } from '../src/data/ianPosterThemeVoice.js';
import { toCanonicalThemeName } from '../src/data/themeAliases.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(REPO_ROOT, 'docs/audio/ian-poster-voice-refresh-manifest.json');
const OUT_BACKUP_PATH = `${OUT_PATH}.bak`;
const CHECKSUMS_OUT_PATH = path.join(
  REPO_ROOT,
  'docs/audio/ian-poster-voice-refresh-files-checksums.json',
);
const AUDIO_HOST_ROOT = path.join(REPO_ROOT, 'public/assets/audio/host');

/** Legacy hardcoded UI lines still lacking map entries (none — Discussion time now in hostVoiceLineMap). */
const HARDCODED_SPOKEN_ATTEMPTS = [];

const FALLBACK_OR_DYNAMIC = [
  {
    lineId: 'fallback:host-intro-countdown',
    category: 'fallback',
    context:
      'buildHostIntroSpeechSteps: last intro step voice uses revealNormal[0] or this literal if that array is empty.',
    spokenText: 'Check your card when the countdown hits zero.',
    screenplayRefs: ['src/data/hostVoiceLineMap.js buildHostIntroSpeechSteps'],
  },
  {
    lineId: 'dynamic:host-intro:round-selected',
    category: 'dynamic',
    context:
      'buildHostIntroSpeechSteps step 0: if stingers[0] is empty, voice is `${roundTypeName} round selected.` — not a static data line; no single file.',
    spokenTextPattern: '{roundTypeName} round selected.',
    screenplayRefs: ['src/data/hostVoiceLineMap.js buildHostIntroSpeechSteps'],
  },
];

function sha256File(absPath) {
  const buf = readFileSync(absPath);
  return createHash('sha256').update(buf).digest('hex');
}

function ffprobeDurationSeconds(absMp3Path) {
  try {
    const buf = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absMp3Path}"`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 },
    );
    const n = Number.parseFloat(String(buf).trim());
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 1000) / 1000;
  } catch {
    return null;
  }
}

function walkMp3(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMp3(full, out);
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.mp3')) out.push(full);
  }
  return out;
}

function relFromRepo(abs) {
  return path.relative(REPO_ROOT, abs).split(path.sep).join('/');
}

const records = [...IAN_POSTER_HOST_LINE_RECORDS];

/** Per (theme, spoken) attach lookup + file paths */
const linesAugmented = [];
for (const row of records) {
  const theme = toCanonicalThemeName(row.themeName);
  const filename = row.primaryFilename || '';
  const ttsPath = path.join(AUDIO_HOST_ROOT, row.themeSlug, 'tts', filename);
  const legacyPath = path.join(AUDIO_HOST_ROOT, row.themeSlug, filename);
  let existingPath = null;
  let checksumSha256 = null;
  let durationSeconds = null;
  try {
    if (statSync(ttsPath).isFile()) {
      existingPath = ttsPath;
      checksumSha256 = sha256File(ttsPath);
      durationSeconds = ffprobeDurationSeconds(ttsPath);
    }
  } catch {
    /* try legacy */
  }
  if (!existingPath) {
    try {
      if (statSync(legacyPath).isFile()) {
        existingPath = legacyPath;
        checksumSha256 = sha256File(legacyPath);
        durationSeconds = ffprobeDurationSeconds(legacyPath);
      }
    } catch {
      /* missing */
    }
  }
  const lookupKey = row.lookupKey != null ? row.lookupKey : normalizeLookupForRow(row);
  let mappedName = '';
  if (lookupKey) {
    mappedName = getHostVoiceFilenameForLine(lookupKey, theme);
  } else if (row.spokenText) {
    mappedName = getHostVoiceFilenameForLine(row.spokenText, theme);
  }
  linesAugmented.push({
    ...row,
    canonicalThemeName: theme,
    repoRelativePreferredPath: `public/assets/audio/host/${row.themeSlug}/tts/${filename}`,
    bundledUrlPrimary: `/assets/audio/host/${row.themeSlug}/tts/${filename}`,
    fallbackBundledUrl: `/assets/audio/host/${row.themeSlug}/${filename}`,
    mapLookupMismatch: mappedName && filename && mappedName !== filename ? mappedName : null,
    existingFileOnDisk: existingPath ? relFromRepo(existingPath) : null,
    fileStatus: existingPath ? 'present' : 'missing_on_disk',
    checksumSha256,
    durationSeconds,
  });
}

function normalizeLookupForRow(row) {
  const spoken = String(row.spokenText || '').replace(/\s+/g, ' ').trim();
  if (!spoken) return '';
  return spoken;
}

const hardcodedAugmented = HARDCODED_SPOKEN_ATTEMPTS.flatMap((h) =>
  IAN_POSTER_VOICE_THEME_NAMES.map((themeName) => {
    const theme = toCanonicalThemeName(themeName);
    const fn = getHostVoiceFilenameForLine(h.spokenText, theme);
    return {
      ...h,
      canonicalThemeName: theme,
      lookupFilenameViaMap: fn || null,
      fileStatus: fn ? 'lookup_defined' : 'no_map_entry',
    };
  }),
);

const allMp3 = walkMp3(AUDIO_HOST_ROOT);
const totalBytes = allMp3.reduce((sum, p) => sum + statSync(p).size, 0);

const spokenTexts = linesAugmented.map((l) => l.spokenText).filter(Boolean);
const totalCharacters = spokenTexts.reduce((s, t) => s + t.length, 0);
const uniqueSpokenText = new Set(spokenTexts);

const uniqueFilenames = new Set(linesAugmented.map((l) => l.primaryFilename).filter(Boolean));
const missingFiles = linesAugmented.filter((l) => l.fileStatus === 'missing_on_disk');

const proposedNewLines = linesAugmented.filter(
  (r) =>
    r.copyStatus === 'NEW' ||
    String(r.lineId || '').includes('template:') ||
    String(r.category || '').includes('template'),
);

const generatedAt = new Date().toISOString();

const filesystemFiles = allMp3
  .map((p) => ({
    path: relFromRepo(p),
    bytes: statSync(p).size,
    checksumSha256: sha256File(p),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

const checksumsPayload = {
  schemaVersion: 1,
  companionOf: 'docs/audio/ian-poster-voice-refresh-manifest.json',
  generatedAt,
  description:
    'SHA-256 for every .mp3 under public/assets/audio/host (Ian Poster host voice tree + co-located files). Large list split from main manifest for reviewability.',
  counts: {
    mp3Files: filesystemFiles.length,
    totalBytes: totalBytes,
  },
  files: filesystemFiles,
};

let gitCommit = null;
try {
  gitCommit = execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
} catch {
  /* optional */
}

const manifest = {
  schemaVersion: 2,
  taskRefs: ['t213u', 't214u'],
  purpose:
    'Authoritative Ian Poster host line inventory for ElevenLabs regeneration (voice_id h3DRPfZTD0Z1BwDc142N). Includes existing bundled lines plus t214u proposed lines (Two Truths phases, discussion bridge, one-word template). Exact spoken text from src/data/hostVoiceLineMap.js; durationSeconds from ffprobe when file present.',
  targetElevenLabsVoiceId: 'h3DRPfZTD0Z1BwDc142N',
  generatedAt,
  gitCommit,
  priorManifestBackupPath: 'docs/audio/ian-poster-voice-refresh-manifest.json.bak',
  filesystemChecksumsArtifact: 'docs/audio/ian-poster-voice-refresh-files-checksums.json',
  regenerationPlan: {
    scope:
      'Replace MP3s under public/assets/audio/host/<theme-slug>/tts/*.mp3 (and legacy public/assets/audio/host/<slug>/ for default fallback paths) with new clips; keep filenames and line-to-filename mapping in src/data/hostVoiceLineMap.js unchanged.',
    playbackMapping:
      'Runtime: useIanPosterHostVoicePlayback → getHostVoiceSrcCandidatesForLine → normalize line (trim, lowercase, collapse spaces) → Map in buildThemeHostLineRecords → bundled path /assets/audio/host/<slug>/tts/<file> (see getHostVoiceBasePathsForTheme).',
    gitHistoryPreservation:
      'Prior recordings remain in git history; this manifest lists checksums for files present at generation time — do not delete historical blobs.',
    notInScope: [
      'User-selectable non-Ian ElevenLabs voices (no change).',
      'SFX under public/assets/sfx/ and music/BFM — excluded.',
      'Liar reveal on-screen announcement strings in App.jsx (non-Ian Poster voice lines).',
      'Theme host video dialogue (host-talking mp4/webm) — separate from MP3 TTS.',
    ],
  },
  sourceCodeRefs: {
    lineRegistry: 'src/data/hostVoiceLineMap.js (IAN_POSTER_HOST_LINE_RECORDS, buildThemeHostLineRecords)',
    scripts: 'src/data/ianPosterThemeVoice.js',
    personaCallouts: 'src/data/hostPersonaCallouts.js',
    playback: 'src/lib/hostSpeechPlayback.js',
    hostIntroSteps: 'src/data/hostVoiceLineMap.js buildHostIntroSpeechSteps',
    twoTruthsNarration: 'src/data/hostVoiceLineMap.js TWO_TRUTHS_HOST_NARRATION',
    twoTruthsPlayback: 'src/App.jsx TwoTruthsPhaseHostVoice',
  },
  dynamicOrFallbackNotes: FALLBACK_OR_DYNAMIC,
  hardcodedSpokenAttempts: hardcodedAugmented,
  proposedNewLines: {
    description:
      't214u — lines marked copyStatus NEW, templates, or new round narration; parent generates audio; missing_on_disk until filled.',
    lines: proposedNewLines.sort((a, b) =>
      `${a.themeSlug}:${a.lineId}`.localeCompare(`${b.themeSlug}:${b.lineId}`),
    ),
  },
  counts: {
    themes: IAN_POSTER_VOICE_THEME_NAMES.length,
    lineRecords: linesAugmented.length,
    proposedNewLineRows: proposedNewLines.length,
    uniqueSpokenStrings: uniqueSpokenText.size,
    uniquePrimaryFilenames: uniqueFilenames.size,
    totalSpokenCharacters: totalCharacters,
    mp3FilesUnderPublicAudioHost: allMp3.length,
    totalBytesMp3UnderPublicAudioHost: totalBytes,
    missingExpectedFilesCount: missingFiles.length,
  },
  unusedOrMissing: {
    description:
      'lineRecords with fileStatus missing_on_disk: expected from registry but no file at tts/ or theme root; parent/generation should fill.',
    missingExpectedFiles: missingFiles.map((m) => ({
      lineId: m.lineId,
      primaryFilename: m.primaryFilename,
      themeSlug: m.themeSlug,
    })),
  },
  lines: linesAugmented.sort((a, b) =>
    `${a.themeSlug}:${a.lineId}`.localeCompare(`${b.themeSlug}:${b.lineId}`),
  ),
};

mkdirSync(path.dirname(OUT_PATH), { recursive: true });
if (existsSync(OUT_PATH)) {
  copyFileSync(OUT_PATH, OUT_BACKUP_PATH);
}
writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(CHECKSUMS_OUT_PATH, `${JSON.stringify(checksumsPayload, null, 2)}\n`, 'utf8');
console.log(
  `Wrote ${relFromRepo(OUT_PATH)} (${linesAugmented.length} line records, ${proposedNewLines.length} proposed new) and ${relFromRepo(CHECKSUMS_OUT_PATH)} (${allMp3.length} mp3 checksums)`,
);
if (existsSync(OUT_BACKUP_PATH)) {
  console.log(`Backup: ${relFromRepo(OUT_BACKUP_PATH)}`);
}
