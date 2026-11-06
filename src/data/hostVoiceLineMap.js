import { toCanonicalThemeName } from './themeAliases.js';
import { ROUND_TYPES } from './roundTypes.js';
import {
  buildIanPosterGreetingLine,
  buildIanPosterRoundsLine,
  getIanPosterHostNameLine,
  getIanPosterThemeSlug,
  getIanPosterThemeVoice,
  IAN_POSTER_VOICE_THEME_NAMES,
} from './ianPosterThemeVoice.js';
import {
  buildPersonaCalloutFilename,
  getPersonaCalloutEntriesForTheme,
  HOST_PERSONA_CALLOUT_THEME_NAMES,
} from './hostPersonaCallouts.js';

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
  if (!map.has(key)) map.set(key, filename);
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

/**
 * Two Truths, One Fire — Ian Poster host narration (t214u).
 * Same copy across Ian Poster theme packs; per-theme MP3 filenames still differ by prefix.
 */
export const TWO_TRUTHS_HOST_NARRATION = {
  /** Entering input phase (first submission turn). */
  inputIntro:
    'Two Truths, One Fire. List three items, mark which line is the fib, then submit.',
  /** Leaving input → voting (shuffle applied). */
  transitionToVoting:
    'Submissions are locked and the lists are shuffled. Now vote the lie in every deck.',
  /** Entering voting phase. */
  votingIntro: 'For each player, tap the line you think was the lie. Everyone votes on everyone.',
  /** Entering reveal/score breakdown. */
  revealIntro: 'Here is the blaze — the fibs, the facts, and who spotted them.',
};

/**
 * One-word handoff — spoken text is built at runtime; {playerName} is a generation placeholder, not a map key.
 * Parent generates one clip per theme with neutral pace; client concatenates or uses live name later.
 */
export const ONE_WORD_HOST_HANDOFF_TEMPLATE = '{playerName}, say your one word!';

/**
 * Authoritative line records for Ian Poster bundled host voice (per theme).
 * Used by tooling and docs; runtime lookup still uses normalized text → filename map.
 */
function buildThemeHostLineRecords(themeName = 'Default') {
  const map = new Map();
  const records = [];
  const slug = getIanPosterThemeSlug(themeName);
  const voice = getIanPosterThemeVoice(themeName);
  const prefix = slug === 'default' ? 'default' : slug;

  function register(record) {
    const spoken = String(record.spokenText || '').replace(/\s+/g, ' ').trim();
    const filename = String(record.primaryFilename || '').trim();
    if (!spoken || !filename) return;
    records.push({
      ...record,
      themeName,
      themeSlug: slug,
      spokenText: spoken,
      primaryFilename: filename,
      lookupKey: normalizeLine(spoken),
    });
    pushLine(map, spoken, filename);
  }

  /** Registry-only row: no static line → file map (template or dynamic segment). */
  function registerWithoutMap(record) {
    const filename = String(record.primaryFilename || '').trim();
    const spoken = String(record.spokenText || record.spokenTextDisplay || '').replace(/\s+/g, ' ').trim();
    if (!filename || !spoken) return;
    records.push({
      ...record,
      themeName,
      themeSlug: slug,
      spokenText: spoken,
      primaryFilename: filename,
      lookupKey: null,
    });
  }

  register({
    lineId: `${slug}:intro:host-name`,
    category: 'intro',
    context:
      'Host identity line built from IAN_POSTER_HOST_NAME + themedRole (ianPosterThemeVoice.getIanPosterHostNameLine).',
    spokenText: getIanPosterHostNameLine(themeName),
    primaryFilename: `${prefix}_intro_host_name.mp3`,
    screenplayRefs: ['src/data/ianPosterThemeVoice.js (themedRole)', 'src/data/hostVoiceLineMap.js'],
    playbackRefs: ['src/lib/hostSpeechPlayback.js (useIanPosterHostVoicePlayback)'],
    subtitleMapping: 'Caption text for this line is not a single fixed string; host intro uses buildHostIntroSpeechSteps.',
  });

  (voice.introHooks || []).forEach((line, index) => {
    register({
      lineId: `${slug}:intro:hook:${index + 1}`,
      category: 'intro',
      context: 'Rotating intro hook lines (game intro / host flavour).',
      lineIndex: index + 1,
      spokenText: line,
      primaryFilename: `${prefix}_intro_hook_${String(index + 1).padStart(2, '0')}.mp3`,
      screenplayRefs: ['src/data/ianPosterThemeVoice.js introHooks'],
    });
  });

  register({
    lineId: `${slug}:intro:online-prompt`,
    category: 'intro',
    context: 'Online mode prompt line (intro copy bank).',
    spokenText: voice.onlinePrompt,
    primaryFilename: `${prefix}_intro_online_prompt.mp3`,
    screenplayRefs: ['src/data/ianPosterThemeVoice.js onlinePrompt'],
  });

  register({
    lineId: `${slug}:intro:pass-prompt`,
    category: 'intro',
    context: 'Pass-the-phone instruction (intro copy bank).',
    spokenText: voice.passPrompt,
    primaryFilename: `${prefix}_intro_pass_prompt.mp3`,
    screenplayRefs: ['src/data/ianPosterThemeVoice.js passPrompt'],
  });

  register({
    lineId: `${slug}:intro:closing`,
    category: 'intro',
    context: 'Intro closing line before gameplay.',
    spokenText: voice.closingLine,
    primaryFilename: `${prefix}_intro_closing.mp3`,
    screenplayRefs: ['src/data/ianPosterThemeVoice.js closingLine'],
  });

  Object.entries(voice.greetings || {}).forEach(([greetingKey]) => {
    const greetingLine = buildIanPosterGreetingLine(themeName, greetingKey);
    const filename = `${prefix}_intro_greeting_${greetingKey.replace(/\s+/g, '-')}.mp3`;
    register({
      lineId: `${slug}:intro:greeting:${greetingKey}`,
      category: 'intro',
      context: `Time-of-day greeting combined with welcomeSuffix (${greetingKey}).`,
      spokenText: greetingLine,
      primaryFilename: filename,
      dynamicFields: ['greetingKey'],
      screenplayRefs: ['src/data/ianPosterThemeVoice.js greetings', 'buildIanPosterGreetingLine'],
    });
  });

  for (let players = 3; players <= 12; players += 1) {
    [1, 2, 3].forEach((roundsPerPlayer) => {
      const rounds = players * roundsPerPlayer;
      const spoken = buildIanPosterRoundsLine(themeName, rounds, players);
      register({
        lineId: `${slug}:intro:rounds:r${rounds}:p${players}`,
        category: 'intro',
        context: 'Game intro: total rounds × players line from roundsLineTemplate.',
        spokenText: spoken,
        primaryFilename: `${prefix}_intro_rounds_${rounds}_players_${players}.mp3`,
        dynamicFields: ['rounds', 'players'],
        dynamicValues: { rounds, players },
        screenplayRefs: ['src/data/ianPosterThemeVoice.js roundsLineTemplate', 'buildIanPosterRoundsLine'],
      });
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
      register({
        lineId: `${slug}:stinger:${id}:v1`,
        category: 'round-stinger',
        context: 'Host intro stinger voice line step 0 / fallback (template v1, {roundTypeName} replaced).',
        relatedRoundTypeId: id,
        spokenText: s1.replace('{roundTypeName}', typeName),
        primaryFilename: `${prefix}_stinger_${filenameKey}_v1.mp3`,
        templateSlot: 'roundStingers[0]',
        dynamicFields: ['roundTypeName'],
        dynamicValues: { roundTypeName: typeName, roundTypeId: id },
        screenplayRefs: ['src/data/hostVoiceLineMap.js ROUND_TYPE_FLAVOR_BY_ID', 'src/data/roundTypes.js', 'buildHostIntroSpeechSteps'],
      });
    }
    if (s2) {
      register({
        lineId: `${slug}:stinger:${id}:v2`,
        category: 'round-stinger',
        context: 'Host intro stinger (template v2, {roundTypeName} replaced).',
        relatedRoundTypeId: id,
        spokenText: s2.replace('{roundTypeName}', typeName),
        primaryFilename: `${prefix}_stinger_${filenameKey}_v2.mp3`,
        templateSlot: 'roundStingers[1]',
        dynamicFields: ['roundTypeName'],
        dynamicValues: { roundTypeName: typeName, roundTypeId: id },
        screenplayRefs: ['src/data/hostVoiceLineMap.js', 'buildHostIntroSpeechSteps'],
      });
    }
    if (s3) {
      register({
        lineId: `${slug}:stinger:${id}:v3`,
        category: 'round-stinger',
        context: 'Host intro stinger (template v3, {roundTypeFlavor} replaced).',
        relatedRoundTypeId: id,
        spokenText: s3.replace('{roundTypeFlavor}', typeFlavor),
        primaryFilename: `${prefix}_stinger_${filenameKey}_v3.mp3`,
        templateSlot: 'roundStingers[2]',
        dynamicFields: ['roundTypeFlavor', 'roundTypeId'],
        dynamicValues: { roundTypeFlavor: typeFlavor, roundTypeId: id },
        screenplayRefs: ['src/data/hostVoiceLineMap.js ROUND_TYPE_FLAVOR_BY_ID', 'buildHostIntroSpeechSteps'],
      });
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
      register({
        lineId: `${slug}:flow:${key}:${index + 1}`,
        category: `flow-${key}`,
        context: `Themed flow line for copyState / UI (${key} bank index ${index + 1}).`,
        lineIndex: index + 1,
        spokenText: line,
        primaryFilename: `${prefix}_${key}_${String(index + 1).padStart(2, '0')}.mp3`,
        screenplayRefs: [`src/data/ianPosterThemeVoice.js flowCopy.${key}`],
      });
    });
  });

  getPersonaCalloutEntriesForTheme(themeName).forEach((entry) => {
    register({
      lineId: `${slug}:persona:${entry.personaId}`,
      category: 'persona-callout',
      context:
        'Persona-only mode: spoken line equals persona display name (strip decorative quotes). Played on reveal / liar callout when shouldPlayPersonaCalloutForPlayer.',
      spokenText: entry.lineText,
      primaryFilename: entry.filename,
      personaId: entry.personaId,
      personaDisplayName: entry.personaName,
      screenplayRefs: ['src/data/hostPersonaCallouts.js', 'src/App.jsx RevealScreen / LiarRevealScreen'],
      playbackRefs: ['src/App.jsx useIanPosterHostVoicePlayback (reveal-persona, liar-callout)'],
    });
  });

  register({
    lineId: `${slug}:hardcoded:discussion-time`,
    category: 'hardcoded-ui',
    copyStatus: 'EXISTING',
    context:
      'DiscussionTimeHostVoice — bridge from one-word phase to discussion; exact string "Discussion time!" (src/App.jsx).',
    spokenText: 'Discussion time!',
    primaryFilename: `${prefix}_discussion_time_from_oneword.mp3`,
    screenplayRefs: ['src/App.jsx DiscussionTimeHostVoice'],
    playbackRefs: ['src/App.jsx DiscussionTimeHostVoice', 'useIanPosterHostVoicePlayback'],
  });

  register({
    lineId: `${slug}:round:twotruths:input-intro`,
    category: 'twotruths-narration',
    copyStatus: 'NEW',
    relatedRoundTypeId: 'twotruths',
    relatedPhase: 'twotruths-input',
    context:
      'Screen: twotruths-input — everyone submits three items + marks lie (online + local). Does not reveal which line is the fib.',
    spokenText: TWO_TRUTHS_HOST_NARRATION.inputIntro,
    primaryFilename: `${prefix}_twotruths_input_intro.mp3`,
    subtitleCue: 'Same as spoken line (on-screen copy is NeonTwoTruthsInputScreen body text).',
    screenplayRefs: ['src/components/neon/NeonTwoTruthsInputScreen.jsx', 'src/App.jsx screen twotruths-input'],
    playbackRefs: ['src/App.jsx TwoTruthsPhaseHostVoice'],
  });

  register({
    lineId: `${slug}:round:twotruths:transition-to-voting`,
    category: 'twotruths-narration',
    copyStatus: 'NEW',
    relatedRoundTypeId: 'twotruths',
    relatedPhase: 'twotruths-input→twotruths-voting',
    context: 'Phase advance after all submissions — presentations shuffled server-side / client-side.',
    spokenText: TWO_TRUTHS_HOST_NARRATION.transitionToVoting,
    primaryFilename: `${prefix}_twotruths_transition_voting.mp3`,
    subtitleCue: 'Optional sting before voting screen.',
    screenplayRefs: ['server/twoTruthsOnline.js finalizeTwoTruthsPresentations', 'src/App.jsx twotruths-voting'],
    playbackRefs: ['src/App.jsx TwoTruthsPhaseHostVoice'],
  });

  register({
    lineId: `${slug}:round:twotruths:voting-intro`,
    category: 'twotruths-narration',
    copyStatus: 'NEW',
    relatedRoundTypeId: 'twotruths',
    relatedPhase: 'twotruths-voting',
    context: 'Matrix voting — each player picks lie per opponent list.',
    spokenText: TWO_TRUTHS_HOST_NARRATION.votingIntro,
    primaryFilename: `${prefix}_twotruths_voting_intro.mp3`,
    subtitleCue: 'Aligns with NeonTwoTruthsVotingScreen heading Spot the lie.',
    screenplayRefs: ['src/components/neon/NeonTwoTruthsVotingScreen.jsx'],
    playbackRefs: ['src/App.jsx TwoTruthsPhaseHostVoice'],
  });

  register({
    lineId: `${slug}:round:twotruths:reveal-intro`,
    category: 'twotruths-narration',
    copyStatus: 'NEW',
    relatedRoundTypeId: 'twotruths',
    relatedPhase: 'twotruths-reveal',
    context: 'Shows shuffled lines + lie markers and score deltas.',
    spokenText: TWO_TRUTHS_HOST_NARRATION.revealIntro,
    primaryFilename: `${prefix}_twotruths_reveal_intro.mp3`,
    subtitleCue: 'May pair with heading The lies are lit.',
    screenplayRefs: ['src/components/neon/NeonTwoTruthsRevealScreen.jsx'],
    playbackRefs: ['src/App.jsx TwoTruthsPhaseHostVoice'],
  });

  registerWithoutMap({
    lineId: `${slug}:template:one-word-player-handoff`,
    category: 'template-dynamic-name',
    copyStatus: 'NEW',
    context:
      'One-word round current-player line — runtime: buildOneWordHostLine (App.jsx). Parent: generate with NAME placeholder or SSML; not a single static map key.',
    spokenTextTemplate: ONE_WORD_HOST_HANDOFF_TEMPLATE,
    spokenText: ONE_WORD_HOST_HANDOFF_TEMPLATE,
    generationNote:
      'Synthesize with placeholder {playerName}; runtime substitutes player display name. Single bundled clip optional (name spoken via separate clip or live TTS elsewhere).',
    primaryFilename: `${prefix}_template_oneword_player_handoff.mp3`,
    dynamicFields: ['playerName'],
    screenplayRefs: ['src/components/OneWordRoundScreen.jsx buildOneWordHostLine', 'src/App.jsx screen one-word'],
  });

  register({
    lineId: `${slug}:round:twotruths:instruction-alt`,
    category: 'twotruths-narration',
    copyStatus: 'NEW',
    relatedRoundTypeId: 'twotruths',
    relatedPhase: 'host-intro',
    context:
      'Optional alternate to host intro display rule — mirrors getInstructionHostLines twotruths (App.jsx) for vo-only refresh.',
    spokenText:
      'Everyone writes three related items — two true, one fib. After the shuffle, hunt each lie and score.',
    primaryFilename: `${prefix}_twotruths_rules_alt_instruction.mp3`,
    screenplayRefs: ['src/App.jsx getInstructionHostLines', 'getRoundRuleText twotruths'],
  });

  return { map, records };
}

const THEME_LINE_DATA = Object.fromEntries(
  IAN_POSTER_VOICE_THEME_NAMES.map((themeName) => [themeName, buildThemeHostLineRecords(themeName)]),
);

const HOST_LINE_MAP_BY_THEME = Object.fromEntries(
  Object.entries(THEME_LINE_DATA).map(([name, data]) => [name, data.map]),
);

/** Flat export for voice refresh / ElevenLabs batch tooling. */
export const IAN_POSTER_HOST_LINE_RECORDS = IAN_POSTER_VOICE_THEME_NAMES.flatMap(
  (themeName) => THEME_LINE_DATA[themeName]?.records || [],
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
      id: `host-intro-${roundTypeId}-0`,
      display: `${roundTypeName} round.`,
      voice: stingers[0] || `${roundTypeName} round selected.`,
    },
    {
      id: `host-intro-${roundTypeId}-1`,
      display: ruleText || `${roundTypeName} rules incoming.`,
      voice: stingers[2] || stingers[1] || stingers[0] || '',
    },
    {
      id: `host-intro-${roundTypeId}-2`,
      display:
        hostLine ||
        `${hostPersonaName} is in the building. Let the chaos begin.`,
      voice: hostVoice,
    },
    {
      id: `host-intro-${roundTypeId}-3`,
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
