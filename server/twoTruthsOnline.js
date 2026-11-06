/**
 * Online Two Truths — shared round construction + vote completion (server).
 * Mirrors client rules in src/App.jsx buildLocalRound + src/lib/twoTruthsOneFire.js.
 */

import { randomInt } from 'node:crypto';
import { ROUND_TYPES } from '../src/data/roundTypes.js';
import {
  BANNED_WORD_BANK,
  sanitizeBannedWords,
  TWO_TRUTHS_ONE_FIRE_ROUNDS,
} from '../src/data/categories.js';
import {
  buildPresentationsFromSubmissions,
  calculateTwoTruthsRoundResolution,
  createEmptyTwoTruthsData,
  normalizeTwoTruthsVotes,
} from '../src/lib/twoTruthsOneFire.js';

function shuffle(items = []) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function pickRandom(items = []) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export function randomId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${randomInt(1e9, 1e10).toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Build a full Two Truths round object (server authority) for online play.
 */
export function buildTwoTruthsAuthoritativeRound(
  players = [],
  roundNumber = 1,
  recentPromptKeys = [],
  categoryId = 'sports',
  preferredPromptKey = '',
) {
  if (!players.length) return null;
  const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[categoryId] || TWO_TRUTHS_ONE_FIRE_ROUNDS.sports;
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const promptOptions = pool.map((prompt, index) => ({
    prompt,
    key: `twotruths::${categoryId}::${index}`,
  }));
  const filtered = preferredPromptKey
    ? promptOptions.filter((o) => o.key === preferredPromptKey)
    : promptOptions.filter((o) => !recentPromptKeys.includes(o.key));
  const selected = pickRandom(filtered.length ? filtered : promptOptions);
  if (!selected?.prompt) return null;
  const rt = ROUND_TYPES.twotruths;
  const bannedWords = sanitizeBannedWords(
    categoryId,
    selected.prompt.hint,
    selected.prompt.main,
    '',
    BANNED_WORD_BANK[selected.key] || [],
  );
  return {
    id: randomId('round'),
    createdAt: nowIso(),
    roundNumber,
    roundTypeId: 'twotruths',
    roundTypeName: rt.name,
    roundTypeTagline: rt.tagline,
    categoryId,
    categoryLabel: categoryId,
    categoryEmoji: '🎯',
    promptKey: selected.key,
    hint: selected.prompt.hint,
    commonPrompt: selected.prompt.main,
    imposterPrompt: null,
    aiPrompt: null,
    mediaPreviewLabel: null,
    mediaPackId: null,
    isAdultPrompt: Boolean(selected.prompt.adultOnly),
    bannedWords,
    mode: 'classic',
    imposterIds: [],
    chooserId: pickRandom(players)?.id || players[0].id,
    leaderId: pickRandom(players)?.id || players[0].id,
    phase: 'host-intro',
    phaseUpdatedAt: nowIso(),
    votesByPlayerId: {},
    voteCompletionCount: 0,
    voteTargetCount: players.length,
    resolution: null,
    mediaByPlayerId: {},
    promptsByPlayerId: {},
    twoTruthsData: {
      ...createEmptyTwoTruthsData(),
      promptText: selected.prompt.main,
      submissionsByPlayerId: {},
      presentationsByPlayerId: {},
      votesByVoterId: {},
      inputPlayerIndex: 0,
    },
  };
}

export function countExpectedTwoTruthsVotes(players = []) {
  const n = players.length;
  if (n < 2) return 0;
  return n * (n - 1);
}

export function isTwoTruthsVoteMatrixComplete(players = [], votesByVoterId = {}) {
  const expected = countExpectedTwoTruthsVotes(players);
  if (expected <= 0) return false;
  const normalized = normalizeTwoTruthsVotes(votesByVoterId, players);
  let count = 0;
  for (const voter of players) {
    const byAuthor = normalized[voter.id] || {};
    for (const author of players) {
      if (author.id === voter.id) continue;
      if (typeof byAuthor[author.id] !== 'number') return false;
      count += 1;
    }
  }
  return count === expected;
}

export function mergeTwoTruthsAuthorVote(
  votesByVoterId = {},
  voterId = '',
  authorId = '',
  lieIndex = 0,
) {
  const next = { ...votesByVoterId };
  const v = String(voterId || '').trim();
  const a = String(authorId || '').trim();
  if (!v || !a || v === a) return next;
  next[v] = { ...(next[v] || {}), [a]: Number(lieIndex) };
  return next;
}

/**
 * After all submissions, shuffle presentations server-side (same as client finalize).
 */
export function finalizeTwoTruthsPresentations(round) {
  if (!round?.twoTruthsData) return round;
  const submissions = round.twoTruthsData.submissionsByPlayerId || {};
  const presentationsByPlayerId = buildPresentationsFromSubmissions(submissions);
  return {
    ...round,
    twoTruthsData: {
      ...round.twoTruthsData,
      presentationsByPlayerId,
    },
  };
}

export function applyTwoTruthsVotingResolution(lobby, round) {
  const players = Array.isArray(lobby.players) ? lobby.players : [];
  const votes = round.twoTruthsData?.votesByVoterId || {};
  const resolution = calculateTwoTruthsRoundResolution(players, round, votes);
  const nextPlayers = resolution.nextPlayers.map((p) => ({ ...p }));
  lobby.players = nextPlayers;
  round.resolution = {
    tally: resolution.tally,
    imposterCaught: resolution.imposterCaught,
    roundGains: resolution.roundGains,
    roundBreakdown: resolution.roundBreakdown,
    resolvedAt: nowIso(),
  };
  round.phase = 'twotruths-reveal';
  round.phaseUpdatedAt = nowIso();
  return round;
}

export function allPlayersSubmittedTwoTruths(round, players = []) {
  const subs = round?.twoTruthsData?.submissionsByPlayerId || {};
  return players.every((p) => subs[p.id] != null);
}

/**
 * Strip sensitive Two Truths fields from lobby snapshots.
 * Submissions stay private until voting; presentations until reveal; per-voter votes until reveal.
 */
export function sanitizeTwoTruthsPublicRound(round) {
  if (!round || round.roundTypeId !== 'twotruths') return round;
  const phase = String(round.phase || '').trim();
  const data = round.twoTruthsData || {};
  const safeBase = {
    promptText: data.promptText || round.commonPrompt || null,
    inputPlayerIndex: Number.isFinite(Number(data.inputPlayerIndex))
      ? Number(data.inputPlayerIndex)
      : 0,
    submissionCount: Object.keys(data.submissionsByPlayerId || {}).filter(
      (id) => data.submissionsByPlayerId[id],
    ).length,
  };
  if (phase === 'host-intro' || phase === 'twotruths-input') {
    return {
      ...round,
      twoTruthsData: {
        ...safeBase,
        votesByVoterId: {},
      },
      resolution: null,
    };
  }
  if (phase === 'twotruths-voting') {
    const presentations = data.presentationsByPlayerId || {};
    return {
      ...round,
      twoTruthsData: {
        ...safeBase,
        presentationsByPlayerId: presentations,
        votesByVoterId: data.votesByVoterId && typeof data.votesByVoterId === 'object'
          ? data.votesByVoterId
          : {},
      },
      resolution: null,
    };
  }
  if (phase === 'twotruths-reveal' || phase === 'results') {
    return {
      ...round,
      twoTruthsData: {
        ...data,
        submissionsByPlayerId: data.submissionsByPlayerId || {},
      },
    };
  }
  return {
    ...round,
    twoTruthsData: {
      ...safeBase,
    },
  };
}
