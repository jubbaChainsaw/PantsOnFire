import { toCanonicalThemeName } from './themeAliases';
import { ROUND_TYPES } from './roundTypes';
import {
  buildIanPosterGreetingLine,
  buildIanPosterRoundsLine,
  getIanPosterHostNameLine,
  getIanPosterThemeSlug,
  getIanPosterThemeVoice,
  IAN_POSTER_VOICE_THEME_NAMES,
} from './ianPosterThemeVoice';
import {
  buildPersonaCalloutFilename,
  getPersonaCalloutEntriesForTheme,
  HOST_PERSONA_CALLOUT_THEME_NAMES,
} from './hostPersonaCallouts';

export const HOST_TTS_BASE_PATH = '/assets/audio/host';
export const DEFAULT_HOST_TTS_BASE_PATH = `${HOST_TTS_BASE_PATH}/default/tts`;
export const DEFAULT_HOST_LEGACY_BASE_PATH = `${HOST_TTS_BASE_PATH}/default`;

function normalizeLine(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function toFilenameSafeKey(value = '') {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function pushLine(map, line, filename) {
  const key = normalizeLine(line);
  if (!key || !filename) return;
  map.set(key, filename);
}

const ROUND_TYPE_FLAVOR_BY_ID = {
  prompt: 'hot-seat clues',
  opinion: 'truth-or-twisted debates',
  picture: 'flash-frame visuals',
  pairs: 'double-take spot-the-difference',
  nameblame: 'name-and-blame callouts',
  noise: 'sound-off bluffs',
  offtopic: 'off-topic defenses',
  chain: 'chain reaction links',
  twotruths: 'two-truths-one-fire fibs',
  meme: 'meme chaos',
};

function buildThemeHostLineFilenameMap(themeName = 'Default') {
  const map = new Map();
  const slug = getIanPosterThemeSlug(themeName);
  const voice = getIanPosterThemeVoice(themeName);
  const prefix = slug === 'default' ? 'default' : slug;

  pushLine(map, getIanPosterHostNameLine(themeName), `${prefix}_intro_host_name.mp3`);

  (voice.introHooks || []).forEach((line, index) => {
    pushLine(map, line, `${prefix}_intro_hook_${String(index + 1).padStart(2, '0')}.mp3`);
  });

  pushLine(map, voice.onlinePrompt, `${prefix}_intro_online_prompt.mp3`);
  pushLine(map, voice.passPrompt, `${prefix}_intro_pass_prompt.mp3`);
  pushLine(map, voice.closingLine, `${prefix}_intro_closing.mp3`);

  Object.entries(voice.greetings || {}).forEach(([key]) => {
    const filename = `${prefix}_intro_greeting_${key.replace(/\s+/g, '-')}.mp3`;
    pushLine(map, buildIanPosterGreetingLine(themeName, key), filename);
  });

  for (let players = 3; players <= 12; players += 1) {
    [1, 2, 3].forEach((roundsPerPlayer) => {
      const rounds = players * roundsPerPlayer;
      pushLine(
        map,
        buildIanPosterRoundsLine(themeName, rounds, players),
        `${prefix}_intro_rounds_${rounds}_players_${players}.mp3`,
      );
    });
  }

  const roundStingers = Array.isArray(voice.roundStingers) ? voice.roundStingers : [];
  const passPhoneRoundTypes = Object.values(ROUND_TYPES).filter(
    (roundType) => roundType?.passThePhoneReady && !roundType?.onlineOnly,
  );

  passPhoneRoundTypes.forEach((roundType) => {
    const id = String(roundType.id || '').trim();
    if (!id) return;
    const filenameKey = toFilenameSafeKey(id);
    const typeName = roundType.name || id;
    const typeFlavor = ROUND_TYPE_FLAVOR_BY_ID[id] || 'suspicious gameplay';
    const [s1, s2, s3] = roundStingers;
    if (s1) {
      pushLine(
        map,
        s1.replace('{roundTypeName}', typeName),
        `${prefix}_stinger_${filenameKey}_v1.mp3`,
      );
    }
    if (s2) {
      pushLine(
        map,
        s2.replace('{roundTypeName}', typeName),
        `${prefix}_stinger_${filenameKey}_v2.mp3`,
      );
    }
    if (s3) {
      pushLine(
        map,
        s3.replace('{roundTypeFlavor}', typeFlavor),
        `${prefix}_stinger_${filenameKey}_v3.mp3`,
      );
    }
  });

  const flow = voice.flowCopy || {};
  const copyKeys = [
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
  copyKeys.forEach((key) => {
    const lines = Array.isArray(flow[key]) ? flow[key] : [];
    lines.forEach((line, index) => {
      pushLine(map, line, `${prefix}_${key}_${String(index + 1).padStart(2, '0')}.mp3`);
    });
  });

  getPersonaCalloutEntriesForTheme(themeName).forEach((entry) => {
    pushLine(map, entry.lineText, entry.filename);
  });

  return map;
}

const HOST_LINE_MAP_BY_THEME = Object.fromEntries(
  IAN_POSTER_VOICE_THEME_NAMES.map((themeName) => [themeName, buildThemeHostLineFilenameMap(themeName)]),
);

/** personaId → MP3 filename (launch themes only). */
const PERSONA_CALLOUT_FILENAME_BY_THEME = Object.fromEntries(
  HOST_PERSONA_CALLOUT_THEME_NAMES.map((themeName) => {
    const slug = getIanPosterThemeSlug(themeName);
    const byId = Object.fromEntries(
      getPersonaCalloutEntriesForTheme(themeName).map((entry) => [entry.personaId, entry.filename]),
    );
    return [themeName, { slug, byId }];
  }),
);

export function getPersonaCalloutFilenameForPlayer(themeName = 'Default', personaId = '') {
  const canonical = toCanonicalThemeName(themeName);
  const id = String(personaId || '').trim();
  if (!id) return '';
  const bucket = PERSONA_CALLOUT_FILENAME_BY_THEME[canonical];
  if (bucket?.byId?.[id]) return bucket.byId[id];
  const slug = getIanPosterThemeSlug(canonical);
  return buildPersonaCalloutFilename(slug, id);
}

export function getPersonaCalloutSrcCandidates(themeName = 'Default', personaId = '') {
  const filename = getPersonaCalloutFilenameForPlayer(themeName, personaId);
  if (!filename) return [];
  return getHostVoiceBasePathsForTheme(themeName).map((base) => `${base}/${filename}`);
}

export function getHostVoiceFilenameForLine(line = '', themeName = 'Default') {
  const canonicalTheme = toCanonicalThemeName(themeName);
  const map = HOST_LINE_MAP_BY_THEME[canonicalTheme] || HOST_LINE_MAP_BY_THEME.Default;
  if (!line) return '';
  return map.get(normalizeLine(line)) || '';
}

export function getHostVoiceBasePathsForTheme(themeName = 'Default') {
  const slug = getIanPosterThemeSlug(themeName);
  const themeRoot = `${HOST_TTS_BASE_PATH}/${slug}`;
  const paths = [`${themeRoot}/tts`, themeRoot];
  if (slug === 'default') {
    paths.push(DEFAULT_HOST_TTS_BASE_PATH, DEFAULT_HOST_LEGACY_BASE_PATH);
  }
  return [...new Set(paths)];
}

export function getHostVoiceSrcCandidatesForLine(line = '', themeName = 'Default') {
  const filename = getHostVoiceFilenameForLine(line, themeName);
  if (!filename) return [];
  return getHostVoiceBasePathsForTheme(themeName).map((base) => `${base}/${filename}`);
}

/** Spoken stinger lines (v1–v3) for a pass-the-phone round type — matches bundled MP3s. */
export function getRoundStingerVoiceLines(themeName = 'Default', roundTypeId = '') {
  const canonical = toCanonicalThemeName(themeName);
  const voice = getIanPosterThemeVoice(canonical);
  const roundType = ROUND_TYPES[roundTypeId] || {};
  const typeName = roundType.name || roundTypeId || 'Round';
  const typeFlavor = ROUND_TYPE_FLAVOR_BY_ID[roundTypeId] || 'suspicious gameplay';
  const templates = Array.isArray(voice.roundStingers) ? voice.roundStingers : [];
  return templates
    .map((template) =>
      String(template || '')
        .replace('{roundTypeName}', typeName)
        .replace('{roundTypeFlavor}', typeFlavor)
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Host intro caption steps: on-screen copy plus voice line keyed for TTS lookup.
 */
export function buildHostIntroSpeechSteps({
  themeName = 'Default',
  roundTypeId = 'prompt',
  roundTypeName = 'Round',
  ruleText = '',
  stingerLine = '',
  hostPersonaName = 'Host',
} = {}) {
  const canonical = toCanonicalThemeName(themeName);
  const voice = getIanPosterThemeVoice(canonical);
  const stingers = getRoundStingerVoiceLines(canonical, roundTypeId);
  const revealLines = voice.flowCopy?.revealNormal || [];
  const countdownVoice =
    revealLines[0] ||
    'Check your card when the countdown hits zero.';

  const hostLine = String(stingerLine || '').trim();
  const hostVoice =
    hostLine && getHostVoiceFilenameForLine(hostLine, canonical)
      ? hostLine
      : stingers[1] || stingers[0] || '';

  return [
    {
      display: `${roundTypeName} round.`,
      voice: stingers[0] || `${roundTypeName} round selected.`,
    },
    {
      display: ruleText || `${roundTypeName} rules incoming.`,
      voice: stingers[2] || stingers[1] || stingers[0] || '',
    },
    {
      display:
        hostLine ||
        `${hostPersonaName} is in the building. Let the chaos begin.`,
      voice: hostVoice,
    },
    {
      display: 'Get ready — cards flip after the countdown.',
      voice: countdownVoice,
    },
  ].filter((step) => step.display);
}

/** @deprecated Use getHostVoiceSrcCandidatesForLine */
export function getDefaultHostVoiceSrcCandidatesForLine(line = '') {
  return getHostVoiceSrcCandidatesForLine(line, 'Default');
}

/** @deprecated Use getHostVoiceFilenameForLine */
export function getDefaultHostVoiceFilenameForLine(line = '') {
  return getHostVoiceFilenameForLine(line, 'Default');
}

/** @deprecated Use getHostVoiceSrcCandidatesForLine */
export function getDefaultHostVoiceSrcForLine(line = '') {
  const candidates = getHostVoiceSrcCandidatesForLine(line, 'Default');
  return candidates[0] || '';
}

/** @deprecated */
export function getDefaultHostVoiceAudioSrc(line = '') {
  return getDefaultHostVoiceSrcForLine(line);
}
