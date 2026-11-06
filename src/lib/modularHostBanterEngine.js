/**
 * t220u — Pure logic: pick modular banter segments, dedup, cooldowns, anti-repeat.
 */

import { getPersonaCalloutSrcCandidates } from '../data/hostVoiceLineMap.js';
import { getIanPosterThemeSlug } from '../data/ianPosterThemeVoice.js';
import {
  BANTER_EVENT_IDS,
  MODULAR_BANTER_FIXED_SCRIPTS,
} from '../data/modularHostBanterScripts.js';

const DEDUP_KEY = 'pof-host-banter-dedup-v1';
const USAGE_KEY = 'pof-host-banter-usage-v1';

function readJson(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private */
  }
}

function getDedupSet() {
  const data = readJson(DEDUP_KEY, { keys: [] });
  return new Set(Array.isArray(data.keys) ? data.keys : []);
}

function rememberDedup(key) {
  if (!key) return;
  const set = getDedupSet();
  set.add(key);
  writeJson(DEDUP_KEY, { keys: [...set].slice(-400) });
}

export function wasBanterDedupPlayed(dedupKey) {
  if (!dedupKey) return false;
  return getDedupSet().has(dedupKey);
}

export function getBanterUsageState() {
  return readJson(USAGE_KEY, {
    recentIdsByBucket: {},
    lastResultRound: null,
    usedPickerScripts: [],
    usedResultScripts: [],
  });
}

function saveBanterUsageState(next) {
  writeJson(USAGE_KEY, next);
}

/** Fixed fragment text for bundled modular MP3 (same as parent export spokenText). */
export function lineForFixedScript(script) {
  if (!script) return '';
  return String(script.exportSpokenText || script.spokenText || '').trim();
}

/** Full subtitle line for UI (may include player names; not exported for parent TTS). */
export function lineForPickerOrFixedSubtitle(script, nameArg = '') {
  if (!script) return '';
  if (typeof script.buildComposedSubtitleLine === 'function') {
    return script.buildComposedSubtitleLine(nameArg);
  }
  return lineForFixedScript(script);
}

function pickAntiRepeatVariant(list, usedList, maxRemember = 8) {
  const used = new Set(usedList || []);
  const fresh = list.filter((item) => !used.has(item.id));
  const pool = fresh.length ? fresh : list;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  const nextUsed = [...(usedList || []).filter((id) => id !== choice.id), choice.id].slice(
    -maxRemember,
  );
  return { choice, nextUsed };
}

function buildModularFilename(themeSlug, stem) {
  const slug = themeSlug === 'default' ? 'default' : themeSlug;
  return `${slug}_banter_${stem}.mp3`;
}

export function getModularBanterSrcCandidates(themeName, filename) {
  const slug = getIanPosterThemeSlug(themeName);
  const base = `/assets/audio/host/${slug}/tts`;
  return [`${base}/${filename}`, `/assets/audio/host/${slug}/${filename}`];
}

export function buildRoundScopedDedupKey(roundId, eventId, extra = '') {
  const rid = String(roundId || '').trim() || 'noround';
  return `${rid}:${eventId}:${String(extra || '').trim()}`;
}

/**
 * Picker turn — non-spoiling (no "liar"); may include name audio for persona chooser.
 */
export function planPickerTurnBanter({
  themeName = 'Default',
  round = {},
  chooser = null,
  personaOnlyMode = false,
} = {}) {
  const roundId = round.id || `r${round.roundNumber || 0}`;
  const dedupKey = buildRoundScopedDedupKey(roundId, BANTER_EVENT_IDS.pickerTurn);
  if (wasBanterDedupPlayed(dedupKey)) return null;

  const prefixes = MODULAR_BANTER_FIXED_SCRIPTS.filter(
    (s) =>
      s.segmentRole === 'prefix' &&
      s.id.startsWith('banter_picker_') &&
      s.id !== 'banter_picker_alright_lead_v2',
  );
  const usage = getBanterUsageState();
  const { choice: prefixChoice, nextUsed: nextPickerUsed } = pickAntiRepeatVariant(
    prefixes,
    usage.usedPickerScripts || [],
    12,
  );

  const themeSlug = getIanPosterThemeSlug(themeName);
  const filename = buildModularFilename(themeSlug, prefixChoice.filenameStem);
  const segments = [];
  const chooserName = String(chooser?.name || '').trim();
  const fixedSpoken = lineForFixedScript(prefixChoice);
  const composedSubtitle = lineForPickerOrFixedSubtitle(prefixChoice, chooserName);
  const alrightV2Script = MODULAR_BANTER_FIXED_SCRIPTS.find((s) => s.id === 'banter_picker_alright_lead_v2');
  const alrightV2Spoken = lineForFixedScript(alrightV2Script);
  const alrightV2File = buildModularFilename(themeSlug, alrightV2Script.filenameStem);
  if (
    personaOnlyMode &&
    chooser &&
    String(chooser.personaId || '').trim() &&
    chooserName
  ) {
    const nameCandidates = getPersonaCalloutSrcCandidates(themeName, chooser.personaId);
    const bodySeg = {
      line: fixedSpoken,
      subtitleSegment: fixedSpoken,
      audioSrcCandidates: getModularBanterSrcCandidates(themeName, filename),
      fallbackDurationMs: 2800,
    };
    const nameSeg = {
      line: chooserName,
      subtitleSegment: chooserName,
      audioSrcCandidates: nameCandidates,
      fallbackDurationMs: 1800,
    };
    if (prefixChoice.id === 'banter_picker_prefix_v2' && alrightV2Script) {
      /** Audio: lead → NAME → suffix body (subtitle remains “Alright {name} — …”). */
      segments.push(
        {
          line: alrightV2Spoken,
          subtitleSegment: alrightV2Spoken,
          audioSrcCandidates: getModularBanterSrcCandidates(themeName, alrightV2File),
          fallbackDurationMs: 600,
        },
        nameSeg,
        bodySeg,
      );
    } else if (prefixChoice.id === 'banter_picker_prefix_v3') {
      /** Audio: NAME → name-free “stops here.” clip (subtitle: “{name}. … stops here.”). */
      segments.push(nameSeg, bodySeg);
    } else {
      /** v1 and any future variants: NAME → fragment */
      segments.push(nameSeg, bodySeg);
    }
  } else {
    segments.push({
      line: fixedSpoken,
      subtitleSegment: composedSubtitle,
      audioSrcCandidates: getModularBanterSrcCandidates(themeName, filename),
      fallbackDurationMs: 2800,
    });
  }
  const subtitleSegments = segments.map((s) => s.subtitleSegment).filter(Boolean);
  return {
    dedupKey,
    eventId: BANTER_EVENT_IDS.pickerTurn,
    composedSubtitle,
    subtitleSegments,
    segments,
    onCommit: () => {
      rememberDedup(dedupKey);
      saveBanterUsageState({
        ...usage,
        usedPickerScripts: nextPickerUsed,
      });
    },
  };
}

/** Liar reveal (single) — only when liar identity is public on screen */
export function planLiarRevealSingularBanter({
  themeName = 'Default',
  round = {},
  liar = null,
  personaOnlyMode = false,
} = {}) {
  const roundId = round.id || `r${round.roundNumber || 0}`;
  const dedupKey = buildRoundScopedDedupKey(roundId, BANTER_EVENT_IDS.liarRevealSingular);
  if (wasBanterDedupPlayed(dedupKey)) return null;

  const themeSlug = getIanPosterThemeSlug(themeName);
  const prefixScript = MODULAR_BANTER_FIXED_SCRIPTS.find((s) => s.id === 'banter_reveal_liar_is_prefix_v1');
  const suffixScripts = MODULAR_BANTER_FIXED_SCRIPTS.filter(
    (s) => s.segmentRole === 'suffix' && s.id.includes('banter_reveal_suffix'),
  );
  const { choice: suffixChoice } = pickAntiRepeatVariant(suffixScripts, [], 6);
  const prefixSpoken = lineForFixedScript(prefixScript);
  const suffixSpoken = lineForFixedScript(suffixChoice);

  const segments = [
    {
      line: prefixSpoken,
      subtitleSegment: `${prefixSpoken}`,
      audioSrcCandidates: getModularBanterSrcCandidates(
        themeName,
        buildModularFilename(themeSlug, prefixScript.filenameStem),
      ),
      fallbackDurationMs: 1600,
    },
  ];

  const name = String(liar?.name || '').trim();
  if (personaOnlyMode && liar && String(liar.personaId || '').trim() && name) {
    segments.push({
      line: name,
      subtitleSegment: name,
      audioSrcCandidates: getPersonaCalloutSrcCandidates(themeName, liar.personaId),
      fallbackDurationMs: 2200,
    });
  }

  segments.push({
    line: suffixSpoken,
    subtitleSegment: suffixSpoken,
    audioSrcCandidates: getModularBanterSrcCandidates(
      themeName,
      buildModularFilename(themeSlug, suffixChoice.filenameStem),
    ),
    fallbackDurationMs: 2400,
  });
  const middle = name ? `${name}.` : '';
  const subtitle = [prefixSpoken, middle, suffixSpoken]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const subtitleSegments = segments.map((s) => s.subtitleSegment).filter(Boolean);

  return {
    dedupKey,
    eventId: BANTER_EVENT_IDS.liarRevealSingular,
    composedSubtitle: subtitle,
    subtitleSegments,
    segments,
    onCommit: () => {
      rememberDedup(dedupKey);
    },
  };
}

/**
 * Multiple liars — prefix clip + persona name callouts when available; subtitle always lists display names.
 */
export function planLiarRevealPluralBanter({
  themeName = 'Default',
  round = {},
  liars = [],
  personaOnlyMode = false,
} = {}) {
  const roundId = round.id || `r${round.roundNumber || 0}`;
  const dedupKey = buildRoundScopedDedupKey(roundId, BANTER_EVENT_IDS.liarRevealPlural);
  if (wasBanterDedupPlayed(dedupKey)) return null;
  const script = MODULAR_BANTER_FIXED_SCRIPTS.find((s) => s.id === 'banter_reveal_plural_v1');
  const themeSlug = getIanPosterThemeSlug(themeName);
  const prefixSpoken = lineForFixedScript(script);
  const list = Array.isArray(liars) ? liars : [];
  const names = list
    .map((p) => String(p?.name || '').trim())
    .filter(Boolean);
  const nameBit = names.length ? ` ${names.join(', ')}` : '';
  const composedSubtitle = `${prefixSpoken}${nameBit}.`.replace(/\s+/g, ' ').trim();

  const segments = [
    {
      line: prefixSpoken,
      subtitleSegment: prefixSpoken,
      audioSrcCandidates: getModularBanterSrcCandidates(
        themeName,
        buildModularFilename(themeSlug, script.filenameStem),
      ),
      fallbackDurationMs: 2000,
    },
  ];
  if (personaOnlyMode) {
    for (const p of list) {
      const n = String(p?.name || '').trim();
      const pid = String(p?.personaId || '').trim();
      if (!n || !pid) continue;
      segments.push({
        line: n,
        subtitleSegment: n,
        audioSrcCandidates: getPersonaCalloutSrcCandidates(themeName, pid),
        fallbackDurationMs: 2200,
      });
    }
  }

  const subtitleSegments =
    names.length && !personaOnlyMode
      ? [prefixSpoken, names.join(', ')]
      : segments.map((s) => s.subtitleSegment).filter(Boolean);

  return {
    dedupKey,
    eventId: BANTER_EVENT_IDS.liarRevealPlural,
    composedSubtitle,
    subtitleSegments,
    segments,
    onCommit: () => rememberDedup(dedupKey),
  };
}

/** Result screen — uses public imposterCaught only */
export function planResultBanter({
  themeName = 'Default',
  round = {},
  imposterCaught = false,
} = {}) {
  const roundId = round.id || `r${round.roundNumber || 0}`;
  const dedupKey = buildRoundScopedDedupKey(roundId, BANTER_EVENT_IDS.resultBanter, imposterCaught ? 'caught' : 'escaped');
  if (wasBanterDedupPlayed(dedupKey)) return null;

  const usage = getBanterUsageState();
  const roundNum = Number(round.roundNumber) || 0;
  if (
    usage.lastResultRound != null &&
    Math.abs(roundNum - Number(usage.lastResultRound)) < 1 &&
    (usage.recentIdsByBucket?.result || []).includes(dedupKey)
  ) {
    return null;
  }

  const pool = MODULAR_BANTER_FIXED_SCRIPTS.filter((s) => {
    if (s.segmentRole !== 'name_free') return false;
    const id = s.id;
    if (imposterCaught) return id.includes('result_caught');
    return id.includes('result_escaped') || id.includes('result_chaos');
  });
  if (!pool.length) return null;
  const { choice, nextUsed } = pickAntiRepeatVariant(pool, usage.usedResultScripts || [], 12);
  const themeSlug = getIanPosterThemeSlug(themeName);
  const filename = buildModularFilename(themeSlug, choice.filenameStem);
  const lineText = lineForFixedScript(choice);
  return {
    dedupKey,
    eventId: BANTER_EVENT_IDS.resultBanter,
    composedSubtitle: lineText,
    subtitleSegments: [lineText],
    segments: [
      {
        line: lineText,
        subtitleSegment: lineText,
        audioSrcCandidates: getModularBanterSrcCandidates(themeName, filename),
        fallbackDurationMs: 3200,
      },
    ],
    onCommit: () => {
      rememberDedup(dedupKey);
      saveBanterUsageState({
        ...usage,
        lastResultRound: roundNum,
        usedResultScripts: nextUsed,
        recentIdsByBucket: {
          ...(usage.recentIdsByBucket || {}),
          result: [...(usage.recentIdsByBucket?.result || []).slice(-20), dedupKey],
        },
      });
    },
  };
}

export function planFinalWrapBanter({
  themeName = 'Default',
  sessionKey = 'default',
} = {}) {
  const dedupKey = buildRoundScopedDedupKey(sessionKey, BANTER_EVENT_IDS.finalWrap);
  if (wasBanterDedupPlayed(dedupKey)) return null;
  const script = MODULAR_BANTER_FIXED_SCRIPTS.find((s) => s.id === 'banter_wrap_v1');
  const themeSlug = getIanPosterThemeSlug(themeName);
  const lineText = lineForFixedScript(script);
  return {
    dedupKey,
    eventId: BANTER_EVENT_IDS.finalWrap,
    composedSubtitle: lineText,
    subtitleSegments: [lineText],
    segments: [
      {
        line: lineText,
        subtitleSegment: lineText,
        audioSrcCandidates: getModularBanterSrcCandidates(
          themeName,
          buildModularFilename(themeSlug, script.filenameStem),
        ),
        fallbackDurationMs: 3200,
      },
    ],
    onCommit: () => rememberDedup(dedupKey),
  };
}
