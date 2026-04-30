import { COPY_BANK } from './gameTextContent';
import { ROUND_TYPES } from './roundTypes';
import { THEME_HOST_PERSONAS } from './themeHosts';

export const DEFAULT_HOST_TTS_BASE_PATH = '/assets/audio/host/default/tts';

const DEFAULT_HOST = THEME_HOST_PERSONAS.Default || {};
const DEFAULT_HOST_NAME_LINE = `${DEFAULT_HOST.name || 'Ian Poster'} here, your ${DEFAULT_HOST.role || 'professional suspicion stylist'}.`;
const DEFAULT_HOST_CLOSING_LINE = 'Keep clues short, keep confidence high, and keep your poker face alive.';
const DEFAULT_ROUND_TYPE_FLAVOR_BY_ID = {
  prompt: 'hot-seat clues',
  opinion: 'truth-or-twisted debates',
  picture: 'flash-frame visuals',
  meme: 'meme chaos',
  noise: 'sound-only bluffs',
  offtopic: 'off-topic defenses',
  chain: 'chain reaction links',
  grill: "Grill 'Em interrogations",
};

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

function buildDefaultHostLineFilenameMap() {
  const map = new Map();

  // Intro/static persona lines.
  pushLine(map, DEFAULT_HOST_NAME_LINE, 'default_intro_host_name.mp3');
  (DEFAULT_HOST.introHooks || []).forEach((line, index) => {
    pushLine(map, line, `default_intro_hook_${String(index + 1).padStart(2, '0')}.mp3`);
  });
  pushLine(map, DEFAULT_HOST.onlinePrompt, 'default_intro_online_prompt.mp3');
  pushLine(map, DEFAULT_HOST.passPrompt, 'default_intro_pass_prompt.mp3');
  pushLine(map, DEFAULT_HOST_CLOSING_LINE, 'default_intro_closing.mp3');

  // Greeting variants.
  ['Good morning', 'Good afternoon', 'Good evening'].forEach((greeting) => {
    const filename = `default_intro_greeting_${greeting.toLowerCase().replace(/\s+/g, '-')}.mp3`;
    pushLine(map, `${greeting}, and welcome to Pants on Fire! Find the Liar.`, filename);
  });

  // Rounds/player count variants from setup constraints.
  for (let players = 3; players <= 12; players += 1) {
    [1, 2, 3].forEach((roundsPerPlayer) => {
      const rounds = players * roundsPerPlayer;
      pushLine(
        map,
        `Through ${rounds} rounds, the ${players} of you will try to expose the liar without exposing yourselves first.`,
        `default_intro_rounds_${rounds}_players_${players}.mp3`
      );
    });
  }

  // Stinger variants expanded per pass-the-phone round types.
  const roundStingers = Array.isArray(DEFAULT_HOST.roundStingers) ? DEFAULT_HOST.roundStingers : [];
  const passPhoneRoundTypes = Object.values(ROUND_TYPES).filter((roundType) => (
    roundType?.passThePhoneReady && !roundType?.onlineOnly
  ));
  passPhoneRoundTypes.forEach((roundType) => {
    const id = String(roundType.id || '').trim();
    if (!id) return;
    const filenameKey = toFilenameSafeKey(id);
    const typeName = roundType.name || id;
    const typeFlavor = DEFAULT_ROUND_TYPE_FLAVOR_BY_ID[id] || 'suspicious gameplay';
    const [s1, s2, s3] = roundStingers;
    if (s1) {
      pushLine(
        map,
        s1.replace('{roundTypeName}', typeName),
        `default_stinger_${filenameKey}_v1.mp3`
      );
    }
    if (s2) {
      pushLine(
        map,
        s2.replace('{roundTypeName}', typeName),
        `default_stinger_${filenameKey}_v2.mp3`
      );
    }
    if (s3) {
      pushLine(
        map,
        s3.replace('{roundTypeFlavor}', typeFlavor),
        `default_stinger_${filenameKey}_v3.mp3`
      );
    }
  });

  // Rotating copy lines used by default flow.
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
    const lines = Array.isArray(COPY_BANK[key]) ? COPY_BANK[key] : [];
    lines.forEach((line, index) => {
      pushLine(map, line, `default_${key}_${String(index + 1).padStart(2, '0')}.mp3`);
    });
  });

  return map;
}

const DEFAULT_HOST_LINE_FILENAME_MAP = buildDefaultHostLineFilenameMap();

export function getDefaultHostVoiceFilenameForLine(line = '') {
  if (!line) return '';
  return DEFAULT_HOST_LINE_FILENAME_MAP.get(normalizeLine(line)) || '';
}

export function getDefaultHostVoiceSrcForLine(line = '') {
  const filename = getDefaultHostVoiceFilenameForLine(line);
  if (!filename) return '';
  return `${DEFAULT_HOST_TTS_BASE_PATH}/${filename}`;
}

// Backward-compatible alias for call sites that prefer explicit "Audio" naming.
export function getDefaultHostVoiceAudioSrc(line = '') {
  return getDefaultHostVoiceSrcForLine(line);
}
