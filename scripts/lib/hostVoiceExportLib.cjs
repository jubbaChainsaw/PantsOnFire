const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function esc(text) {
  return String(text)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toSsml(line, pauseMs = 1400) {
  return `<speak>${esc(line)}<break time='${pauseMs}ms'/></speak>`;
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseMasterRegistry(csvText) {
  const lines = csvText.trim().split('\n');
  const header = lines[0].split(',').map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map((c) => c.trim());
    rows.push({
      theme_slug: cols[idx.theme_slug] || '',
      theme_name: cols[idx.theme_name] || '',
      voice_id: cols[idx.voice_id] || '',
      accent_notes: cols[idx.accent_notes] || '',
      host_name: cols[idx.host_name] || 'Ian Poster',
      enabled: (cols[idx.enabled] || 'true').toLowerCase() !== 'false',
      pack_id: cols[idx.pack_id] || '',
    });
  }
  return rows;
}

function buildIanPosterGreetingLine(voice, greetingKey) {
  const greeting = voice.greetings?.[greetingKey] || voice.greetings?.evening || 'Good evening';
  return `${greeting}, ${voice.welcomeSuffix}`;
}

function buildIanPosterRoundsLine(voice, rounds, players) {
  const template = voice.roundsLineTemplate;
  return template
    .replace(/\{rounds\}/g, String(rounds))
    .replace(/\{players\}/g, String(players));
}

function toFilenameSafeKey(value = '') {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function collectRowsForTheme(themeName, voice, slug, voiceId, accentNotes, roundTypes) {
  const rows = [];
  const prefix = slug === 'default' ? 'default' : slug;
  const push = (filename, lineText, lineType, variant = '', pauseMs = 1400) => {
    if (!lineText) return;
    rows.push({
      filename,
      theme_slug: slug,
      theme_name: themeName,
      voice_id: voiceId,
      accent_notes: accentNotes,
      line_type: lineType,
      variant,
      line_text: lineText,
      ssml: toSsml(lineText, pauseMs),
    });
  };

  push(`${prefix}_intro_host_name.mp3`, `Ian Poster here, your ${voice.themedRole}.`, 'game_intro', 'host_identity');

  (voice.introHooks || []).forEach((line, index) => {
    push(`${prefix}_intro_hook_${String(index + 1).padStart(2, '0')}.mp3`, line, 'game_intro', `intro_hook_${index + 1}`);
  });

  push(`${prefix}_intro_online_prompt.mp3`, voice.onlinePrompt, 'game_intro', 'online_mode');
  push(`${prefix}_intro_pass_prompt.mp3`, voice.passPrompt, 'game_intro', 'offline_mode');
  push(`${prefix}_intro_closing.mp3`, voice.closingLine, 'game_intro', 'closing', 1800);

  Object.entries(voice.greetings || {}).forEach(([key]) => {
    push(
      `${prefix}_intro_greeting_${key.replace(/\s+/g, '-')}.mp3`,
      buildIanPosterGreetingLine(voice, key),
      'game_intro',
      `greeting_${key}`,
    );
  });

  for (let players = 3; players <= 12; players += 1) {
    [1, 2, 3].forEach((roundsPerPlayer) => {
      const rounds = players * roundsPerPlayer;
      push(
        `${prefix}_intro_rounds_${rounds}_players_${players}.mp3`,
        buildIanPosterRoundsLine(voice, rounds, players),
        'game_intro',
        `rounds_${rounds}_players_${players}`,
      );
    });
  }

  const passPhoneRoundTypes = Object.values(roundTypes).filter(
    (rt) => rt?.passThePhoneReady && !rt?.onlineOnly,
  );
  const flavorById = {
    prompt: 'hot-seat clues',
    opinion: 'truth-or-twisted debates',
    picture: 'flash-frame visuals',
    nameblame: 'name-and-blame callouts',
    noise: 'sound-off bluffs',
    offtopic: 'off-topic defenses',
    chain: 'chain reaction links',
    grill: "Grill 'Em interrogations",
    meme: 'meme chaos',
  };
  const [s1, s2, s3] = voice.roundStingers || [];
  passPhoneRoundTypes.forEach((roundType) => {
    const id = roundType.id;
    const key = toFilenameSafeKey(id);
    const typeName = roundType.name || id;
    const flavor = flavorById[id] || 'suspicious gameplay';
    if (s1) push(`${prefix}_stinger_${key}_v1.mp3`, s1.replace('{roundTypeName}', typeName), 'host_round_intro', `${id}_stinger_1`);
    if (s2) push(`${prefix}_stinger_${key}_v2.mp3`, s2.replace('{roundTypeName}', typeName), 'host_round_intro', `${id}_stinger_2`);
    if (s3) push(`${prefix}_stinger_${key}_v3.mp3`, s3.replace('{roundTypeFlavor}', flavor), 'host_round_intro', `${id}_stinger_3`, 1800);
  });

  const flow = voice.flowCopy || {};
  const flowKeys = [
    'home', 'setup', 'chooser', 'passPhone', 'revealNormal', 'revealLiar',
    'discussion', 'voting', 'caught', 'escaped', 'winner', 'onlineLobby',
  ];
  flowKeys.forEach((key) => {
    const lines = Array.isArray(flow[key]) ? flow[key] : [];
    lines.forEach((line, index) => {
      const pauseMs = key === 'winner' ? 1800 : 1200;
      push(`${prefix}_${key}_${String(index + 1).padStart(2, '0')}.mp3`, line, `flow_${key}`, `${key}_${index + 1}`, pauseMs);
    });
  });

  return rows;
}

function loadIanPosterVoiceContext(repoRoot) {
  const src = readFile(path.join(repoRoot, 'src', 'data', 'ianPosterThemeVoice.js'));
  const dlcSrc = readFile(path.join(repoRoot, 'src', 'data', 'dlc', 'ianPosterDlcThemeVoice.js'));
  const aliasSrc = readFile(path.join(repoRoot, 'src', 'data', 'themeAliases.js'));
  const roundSrc = readFile(path.join(repoRoot, 'src', 'data', 'roundTypes.js'));

  const stripImports = (text) => text.replace(/import[\s\S]*?from ['"][^'"]+['"];\n/g, '');

  const transformedVoice = stripImports(src)
    .replace(/\bexport\s+/g, '')
    .replace(/\{ DLC_HOST_VOICE_PACKS \};\n?/g, '');

  const transformedDlc = stripImports(dlcSrc)
    .replace(/export const DLC_THEME_VOICE_SLUG_BY_NAME/g, 'const DLC_THEME_VOICE_SLUG_BY_NAME')
    .replace(/export const IAN_POSTER_DLC_THEME_VOICE/g, 'const IAN_POSTER_DLC_THEME_VOICE')
    .replace(/export const DLC_HOST_VOICE_PACKS/g, 'const DLC_HOST_VOICE_PACKS')
    .replace(/export function /g, 'function ');

  const transformedAlias = aliasSrc
    .replace(/export function toCanonicalThemeName/g, 'function toCanonicalThemeName');

  const transformedRound = roundSrc
    .replace(/export const ROUND_TYPES =/, 'const ROUND_TYPES =')
    .replace(/export const PASS_THE_PHONE_ROUND_TYPES[\s\S]*/, '');

  const script = `
${transformedAlias}
${transformedDlc}
${transformedVoice}
${transformedRound}
this.__IAN_POSTER_THEME_VOICE = IAN_POSTER_THEME_VOICE;
this.__THEME_VOICE_SLUG_BY_NAME = THEME_VOICE_SLUG_BY_NAME;
this.__DLC_HOST_VOICE_PACKS = DLC_HOST_VOICE_PACKS;
this.__ROUND_TYPES = ROUND_TYPES;
`;
  const context = {};
  vm.runInNewContext(script, context);
  return context;
}

function writeVoiceExports({ rows, linesOutPath, ssmlOutPath, logPrefix }) {
  const outDir = path.dirname(linesOutPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const header = [
    'filename', 'theme_slug', 'theme_name', 'voice_id', 'accent_notes',
    'line_type', 'variant', 'line_text', 'ssml',
  ];
  const linesCsv = [
    header.join(','),
    ...rows.map((row) => [
      csvEscape(row.filename),
      csvEscape(row.theme_slug),
      csvEscape(row.theme_name),
      csvEscape(row.voice_id),
      csvEscape(row.accent_notes),
      csvEscape(row.line_type),
      csvEscape(row.variant),
      csvEscape(row.line_text),
      csvEscape(row.ssml),
    ].join(',')),
  ].join('\n') + '\n';

  const ssmlCsv = [
    'filename,theme_slug,voice_id,ssml',
    ...rows.map((row) => [
      csvEscape(row.filename),
      csvEscape(row.theme_slug),
      csvEscape(row.voice_id),
      csvEscape(row.ssml),
    ].join(',')),
  ].join('\n') + '\n';

  fs.writeFileSync(linesOutPath, linesCsv, 'utf8');
  fs.writeFileSync(ssmlOutPath, ssmlCsv, 'utf8');
  console.log(`[${logPrefix}] Wrote ${rows.length} lines -> ${linesOutPath}`);
  console.log(`[${logPrefix}] Wrote ${rows.length} SSML rows -> ${ssmlOutPath}`);
}

module.exports = {
  collectRowsForTheme,
  csvEscape,
  loadIanPosterVoiceContext,
  parseMasterRegistry,
  readFile,
  writeVoiceExports,
};
