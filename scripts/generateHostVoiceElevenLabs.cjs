#!/usr/bin/env node
/**
 * Generate host voice MP3s via ElevenLabs from exported CSV line lists.
 *
 * API key (pick one):
 *   export ELEVENLABS_API_KEY=your_key
 *   or scripts/royaltyFreeApiKeys.local.json → { "elevenLabsApiKey": "..." }
 *
 * Examples:
 *   npm run host:generate-elevenlabs -- --core
 *   npm run host:generate-elevenlabs -- --pack wanted-better-alibis
 *   npm run host:generate-elevenlabs -- --core --install
 *   npm run host:generate-elevenlabs -- --pack wanted-better-alibis --dry-run --limit 3
 */
const fs = require('fs');
const path = require('path');
const {
  IAN_POSTER_VOICE_SETTINGS,
  buildElevenLabsTtsText,
  normalizeStoredTtsPayload,
} = require('./lib/elevenLabsTtsPrompt.cjs');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');

function parseArgs(argv) {
  const args = {
    core: false,
    pack: '',
    personaCallouts: false,
    install: false,
    dryRun: false,
    limit: 0,
    delayMs: 350,
    modelId: 'eleven_multilingual_v2',
    outDir: '',
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--core') args.core = true;
    else if (a === '--install') args.install = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--pack' && argv[i + 1]) {
      args.pack = argv[++i].trim();
    } else if (a === '--persona-callouts') {
      args.personaCallouts = true;
    } else if (a === '--limit' && argv[i + 1]) {
      args.limit = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === '--delay-ms' && argv[i + 1]) {
      args.delayMs = Math.max(0, Number(argv[++i]) || 350);
    } else if (a === '--model' && argv[i + 1]) {
      args.modelId = argv[++i].trim();
    } else if (a === '--out-dir' && argv[i + 1]) {
      args.outDir = argv[++i].trim();
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run host:generate-elevenlabs -- --core [--install] [--dry-run] [--limit N]
  npm run host:generate-elevenlabs -- --pack <pack-id> [--install] [--dry-run]
  npm run host:generate-elevenlabs -- --persona-callouts [--install] [--dry-run]

Options:
  --core              Use exports/host-voice-lines-master.csv (5 core themes)
  --pack <id>         Use exports/dlc/<id>/host-voice-lines.csv
  --persona-callouts  Use exports/host-persona-callouts.csv (beta launch themes)
  --install           Write MP3s to public/assets/audio/host/<theme-slug>/tts/
  --out-dir <path>    Otherwise writes to exports/generated-audio/<slug>/
  --dry-run           Print plan only, no API calls
  --limit N           Only first N lines (testing)
  --delay-ms N        Pause between requests (default 350)
  --model <id>        ElevenLabs model (default eleven_multilingual_v2)

API key:
  export ELEVENLABS_API_KEY=...
  or elevenLabsApiKey in scripts/royaltyFreeApiKeys.local.json (gitignored)
`);
}

function readApiKey() {
  if (process.env.ELEVENLABS_API_KEY) {
    return String(process.env.ELEVENLABS_API_KEY).trim();
  }
  if (fs.existsSync(localKeysPath)) {
    try {
      const json = JSON.parse(fs.readFileSync(localKeysPath, 'utf8'));
      const key = json.elevenLabsApiKey || json.elevenlabsApiKey || json.ELEVENLABS_API_KEY;
      if (key) return String(key).trim();
    } catch {
      /* ignore */
    }
  }
  return '';
}

/** Minimal RFC4180-style CSV row parser for our export files. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.length)) rows.push(row);
  return rows;
}

function loadLinesFromCsv(csvPath) {
  const table = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const header = table[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return table.slice(1).map((cols) => ({
    filename: cols[idx.filename] || '',
    theme_slug: cols[idx.theme_slug] || '',
    voice_id: cols[idx.voice_id] || '',
    line_text: cols[idx.line_text] || '',
    tts_text: cols[idx.tts_text] || cols[idx.ssml] || '',
    line_type: cols[idx.line_type] || '',
    variant: cols[idx.variant] || '',
  })).filter((r) => r.filename && r.voice_id && (r.tts_text || r.line_text));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveTtsText(row) {
  if (row.tts_text) return normalizeStoredTtsPayload(row.tts_text);
  if (row.line_text) {
    return buildElevenLabsTtsText(row.line_text, {
      lineType: row.line_type,
      variant: row.variant,
    });
  }
  return '';
}

async function synthesize({ apiKey, voiceId, text, modelId }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      apply_text_normalization: 'on',
      voice_settings: IAN_POSTER_VOICE_SETTINGS,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

function resolveOutputPath({ row, install, outDir }) {
  const base = install
    ? path.join(repoRoot, 'public', 'assets', 'audio', 'host', row.theme_slug, 'tts')
    : outDir
      ? path.resolve(repoRoot, outDir, row.theme_slug)
      : path.join(repoRoot, 'exports', 'generated-audio', row.theme_slug);
  return path.join(base, row.filename);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || (!args.core && !args.pack && !args.personaCallouts)) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const csvPath = args.personaCallouts
    ? path.join(repoRoot, 'exports', 'host-persona-callouts.csv')
    : args.core
      ? path.join(repoRoot, 'exports', 'host-voice-lines-master.csv')
      : path.join(repoRoot, 'exports', 'dlc', args.pack, 'host-voice-lines.csv');

  if (!fs.existsSync(csvPath)) {
    const hint = args.personaCallouts
      ? 'host:export-persona-callouts'
      : args.core
        ? 'host:export-voice-master'
        : 'host:export-dlc-voice';
    throw new Error(`Missing ${csvPath}. Run export first (npm run ${hint}).`);
  }

  let lines = loadLinesFromCsv(csvPath);
  if (args.limit > 0) lines = lines.slice(0, args.limit);

  const apiKey = readApiKey();
  if (!args.dryRun && !apiKey) {
    throw new Error(
      'Missing ElevenLabs API key. Set ELEVENLABS_API_KEY or add elevenLabsApiKey to scripts/royaltyFreeApiKeys.local.json',
    );
  }

  console.log(`[generateHostVoiceElevenLabs] Source: ${csvPath}`);
  console.log(`[generateHostVoiceElevenLabs] Lines: ${lines.length}`);
  if (args.dryRun) console.log('[generateHostVoiceElevenLabs] Dry run — no API calls');

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const row = lines[i];
    const dest = resolveOutputPath({ row, install: args.install, outDir: args.outDir });
    const label = `${row.theme_slug}/${row.filename}`;
    if (args.dryRun) {
      console.log(`  [dry-run] ${label} → ${dest}`);
      ok += 1;
      continue;
    }
    try {
      const audio = await synthesize({
        apiKey,
        voiceId: row.voice_id,
        text: resolveTtsText(row),
        modelId: args.modelId,
      });
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, audio);
      console.log(`  [${i + 1}/${lines.length}] ${label}`);
      ok += 1;
      if (i < lines.length - 1 && args.delayMs > 0) await sleep(args.delayMs);
    } catch (err) {
      console.error(`  [fail] ${label}: ${err.message}`);
      fail += 1;
    }
  }

  console.log(`[generateHostVoiceElevenLabs] Done. ok=${ok} fail=${fail}`);
  if (fail) process.exit(1);
}

main().catch((err) => {
  console.error(`[generateHostVoiceElevenLabs] ${err.message}`);
  process.exit(1);
});
