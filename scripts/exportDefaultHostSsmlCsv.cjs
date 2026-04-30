#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'exports');
const outPath = path.join(outDir, 'default-host-voice-lines-ssml.csv');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadRoundTypes() {
  const src = readFile(path.join(repoRoot, 'src', 'data', 'roundTypes.js'));
  const transformed = src
    .replace(/export const ROUND_TYPES =/, 'const ROUND_TYPES =')
    .replace(/export const PASS_THE_PHONE_ROUND_TYPES =[\s\S]*/, '');
  const script = `${transformed}\nthis.__ROUND_TYPES = ROUND_TYPES;`;
  const context = {};
  vm.runInNewContext(script, context);
  return context.__ROUND_TYPES || {};
}

function loadDefaultHostPersona() {
  const src = readFile(path.join(repoRoot, 'src', 'data', 'themeHosts.js'));
  const start = src.indexOf('export const THEME_HOST_PERSONAS =');
  if (start < 0) throw new Error('Unable to locate THEME_HOST_PERSONAS');
  const fromStart = src.slice(start).replace('export const THEME_HOST_PERSONAS =', 'const THEME_HOST_PERSONAS =');
  const end = fromStart.indexOf('const FALLBACK_PERSONA');
  if (end < 0) throw new Error('Unable to parse THEME_HOST_PERSONAS block');
  const block = fromStart.slice(0, end);
  const script = `${block}\nthis.__DEFAULT = THEME_HOST_PERSONAS.Default;`;
  const context = {};
  vm.runInNewContext(script, context);
  return context.__DEFAULT || null;
}

function loadCopyBank() {
  const src = readFile(path.join(repoRoot, 'src', 'data', 'gameTextContent.js'));
  const start = src.indexOf('export const COPY_BANK =');
  if (start < 0) throw new Error('Unable to locate COPY_BANK');
  const fromStart = src.slice(start).replace('export const COPY_BANK =', 'const COPY_BANK =');
  const end = fromStart.indexOf('export function createCopyPicker');
  if (end < 0) throw new Error('Unable to parse COPY_BANK block');
  const block = fromStart.slice(0, end);
  const script = `${block}\nthis.__COPY_BANK = COPY_BANK;`;
  const context = {};
  vm.runInNewContext(script, context);
  return context.__COPY_BANK || {};
}

function esc(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toSsml(line, pauseMs) {
  return `<speak>${esc(line)}<break time="${pauseMs}ms"/></speak>`;
}

function csvEscape(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function main() {
  const roundTypes = loadRoundTypes();
  const defaultPersona = loadDefaultHostPersona();
  const copyBank = loadCopyBank();
  if (!defaultPersona) {
    throw new Error('Default host persona could not be loaded.');
  }

  const rows = [];
  const push = (filename, text, pauseMs = 1400) => {
    rows.push({ filename, ssml: toSsml(text, pauseMs) });
  };

  // Intro/static persona lines.
  push('default_intro_host_name.mp3', `${defaultPersona.name} here, your ${defaultPersona.role}.`);
  (defaultPersona.introHooks || []).forEach((line, index) => {
    push(`default_intro_hook_${String(index + 1).padStart(2, '0')}.mp3`, line);
  });
  push('default_intro_online_prompt.mp3', defaultPersona.onlinePrompt || '');
  push('default_intro_pass_prompt.mp3', defaultPersona.passPrompt || '');
  push('default_intro_closing.mp3', 'Keep clues short, keep confidence high, and keep your poker face alive.', 1800);

  // Greeting variants used in intro screen.
  ['Good morning', 'Good afternoon', 'Good evening'].forEach((greeting) => {
    push(
      `default_intro_greeting_${greeting.toLowerCase().replace(/\s+/g, '-')}.mp3`,
      `${greeting}, and welcome to Pants on Fire! Find the Liar.`
    );
  });

  // Rounds x players variants from setup constraints.
  for (let players = 3; players <= 12; players += 1) {
    [1, 2, 3].forEach((roundsPerPlayer) => {
      const rounds = players * roundsPerPlayer;
      push(
        `default_intro_rounds_${rounds}_players_${players}.mp3`,
        `Through ${rounds} rounds, the ${players} of you will try to expose the liar without exposing yourselves first.`
      );
    });
  }

  // Default host stinger variants expanded per pass-the-phone round type.
  const passPhoneRoundTypes = Object.values(roundTypes).filter((roundType) => roundType?.passThePhoneReady && !roundType?.onlineOnly);
  passPhoneRoundTypes.forEach((roundType) => {
    const typeName = roundType.name || roundType.id;
    const typeFlavorById = {
      prompt: 'hot-seat clues',
      opinion: 'truth-or-twisted debates',
      picture: 'flash-frame visuals',
      meme: 'meme chaos',
      noise: 'sound-only bluffs',
      offtopic: 'off-topic defenses',
      chain: 'chain reaction links',
      grill: "Grill 'Em interrogations",
    };
    const typeFlavor = typeFlavorById[roundType.id] || 'suspicious gameplay';
    const [s1, s2, s3] = defaultPersona.roundStingers || [];
    if (s1) push(`default_stinger_${roundType.id}_v1.mp3`, s1.replace('{roundTypeName}', typeName));
    if (s2) push(`default_stinger_${roundType.id}_v2.mp3`, s2.replace('{roundTypeName}', typeName));
    if (s3) push(`default_stinger_${roundType.id}_v3.mp3`, s3.replace('{roundTypeFlavor}', typeFlavor), 1800);
  });

  // Rotating in-game copy used for default flow.
  const keys = [
    'home',
    'setup',
    'chooser',
    'passPhone',
    'revealNormal',
    'revealLiar',
    'discussion',
    'voting',
    'caught',
    'escaped',
    'winner',
    'onlineLobby',
  ];
  keys.forEach((key) => {
    const lines = Array.isArray(copyBank[key]) ? copyBank[key] : [];
    lines.forEach((line, index) => {
      const pauseMs = key === 'winner' ? 1800 : 1200;
      push(`default_${key}_${String(index + 1).padStart(2, '0')}.mp3`, line, pauseMs);
    });
  });

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const csv = ['filename,ssml', ...rows.map((row) => `${csvEscape(row.filename)},${csvEscape(row.ssml)}`)].join('\n') + '\n';
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`[exportDefaultHostSsmlCsv] Wrote ${rows.length} rows -> ${outPath}`);
}

main();
