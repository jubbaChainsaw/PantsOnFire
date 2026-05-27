/**
 * ElevenLabs TTS prompt shaping per:
 * https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices
 *
 * - One <break> per clip (trailing tail) to avoid instability
 * - Break times in seconds (not ms)
 * - Natural pacing via punctuation (em dashes, commas) — no spoken stage directions
 * - Numbers/abbreviations left to API text normalization when enabled
 * - Host name spoken as "Ee-an Poss-tah" (UI still shows "Ian Poster")
 */

/** Display name in game copy; TTS uses IAN_POSTER_SPOKEN_NAME below. */
const IAN_POSTER_DISPLAY_NAME = 'Ian Poster';

/**
 * ElevenLabs-friendly spelling (multilingual v2 has no phoneme tags):
 * Ian → "Ee-an"; Poster → "Poss-tah" (Poss as in boss, tah as in bar).
 */
const IAN_POSTER_SPOKEN_NAME = 'Ee-an Poss-tah';


const TRAILING_PAUSE_SEC_BY_LINE_TYPE = {
  game_intro: 1.1,
  host_round_intro: 1.35,
  persona_callout: 0.85,
  flow_winner: 1.75,
  flow_chooser: 1.05,
  flow_passPhone: 1.0,
  flow_revealLiar: 1.15,
  flow_default: 1.15,
};

const DEFAULT_TRAILING_PAUSE_SEC = 1.2;
const MAX_TRAILING_PAUSE_SEC = 3;

function clampPauseSec(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TRAILING_PAUSE_SEC;
  return Math.min(MAX_TRAILING_PAUSE_SEC, Math.max(0.25, n));
}

function msToPauseSec(pauseMs) {
  if (!pauseMs) return null;
  return clampPauseSec(pauseMs / 1000);
}

/**
 * @param {string} lineType
 * @param {string} [variant]
 */
function resolveTrailingPauseSec(lineType = '', variant = '', pauseMs = 0) {
  if (pauseMs) {
    return msToPauseSec(pauseMs);
  }
  if (lineType === 'game_intro') {
    if (variant === 'closing') return 1.75;
    if (variant === 'host_identity') return 1.0;
    if (String(variant).startsWith('intro_hook')) return 1.25;
    return TRAILING_PAUSE_SEC_BY_LINE_TYPE.game_intro;
  }
  if (lineType === 'host_round_intro') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.host_round_intro;
  if (lineType === 'persona_callout') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.persona_callout;
  if (lineType.startsWith('flow_')) {
    const flowKey = lineType.replace(/^flow_/, '');
    if (flowKey === 'winner') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.flow_winner;
    if (flowKey === 'chooser') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.flow_chooser;
    if (flowKey === 'passPhone') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.flow_passPhone;
    if (flowKey === 'revealLiar') return TRAILING_PAUSE_SEC_BY_LINE_TYPE.flow_revealLiar;
    return TRAILING_PAUSE_SEC_BY_LINE_TYPE.flow_default;
  }
  return DEFAULT_TRAILING_PAUSE_SEC;
}

/**
 * Light punctuation tweaks for gameshow cadence (TTS only).
 * Keeps words intact; adds em dashes where a short breath helps.
 */
/** Replace display host name with phonetic spelling for TTS only. */
function applyHostNamePronunciation(text = '') {
  return String(text).replace(/\bIan\s+Poster\b/gi, IAN_POSTER_SPOKEN_NAME);
}

function enhancePacingPunctuation(text = '') {
  let t = applyHostNamePronunciation(text);
  t = t.replace(/\s+/g, ' ').trim();
  if (!t) return t;

  // Encourage a beat before the punchline clause (common in our host copy).
  t = t.replace(
    /,\s+(and|but|so|because|which means|then)\s+/gi,
    (match, conj) => ` — ${conj} `,
  );

  // Comma before a trailing tag question → slightly longer breath.
  t = t.replace(/,\s+(right|yeah|innit|eh)\?$/i, ' — $1?');

  return t;
}

function trailingBreakTag(pauseSec) {
  const sec = clampPauseSec(pauseSec);
  return `<break time="${sec}s" />`;
}

/**
 * Plain text + single trailing break (preferred for ElevenLabs API).
 */
function buildElevenLabsTtsText(lineText, { lineType = '', variant = '', pauseMs = 0 } = {}) {
  const body = enhancePacingPunctuation(lineText);
  if (!body) return '';
  const pauseSec = resolveTrailingPauseSec(lineType, variant, pauseMs);
  return `${body} ${trailingBreakTag(pauseSec)}`.trim();
}

/**
 * Legacy SSML export column — inner content matches API text (no <speak> wrapper).
 */
function buildElevenLabsSsmlExport(lineText, options = {}) {
  return buildElevenLabsTtsText(lineText, options);
}

/** Strip legacy <speak> wrappers from stored CSV rows. */
function normalizeStoredTtsPayload(raw = '') {
  let t = String(raw).trim();
  if (!t) return '';
  if (t.includes('<speak>')) {
    t = t
      .replace(/<\/?speak>/gi, '')
      .replace(/<break\s+time=['"][\d.]+m?s['"]\s*\/?>/gi, (tag) => {
        const match = tag.match(/time=['"]([^'"]+)['"]/i);
        if (!match) return '';
        const val = match[1].trim();
        if (val.endsWith('ms')) {
          const sec = clampPauseSec(Number(val.replace(/ms/i, '')) / 1000);
          return `<break time="${sec}s" />`;
        }
        if (val.endsWith('s')) return `<break time="${val}" />`;
        return `<break time="${clampPauseSec(Number(val))}s" />`;
      })
      .trim();
  }
  return t;
}

/** Recommended voice_settings for Ian Poster (expressive but stable on multilingual v2). */
const IAN_POSTER_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.78,
  style: 0.28,
  use_speaker_boost: true,
  speed: 1,
};

module.exports = {
  IAN_POSTER_DISPLAY_NAME,
  IAN_POSTER_SPOKEN_NAME,
  IAN_POSTER_VOICE_SETTINGS,
  applyHostNamePronunciation,
  buildElevenLabsSsmlExport,
  buildElevenLabsTtsText,
  enhancePacingPunctuation,
  normalizeStoredTtsPayload,
  resolveTrailingPauseSec,
};
