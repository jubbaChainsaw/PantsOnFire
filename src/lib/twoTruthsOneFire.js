/** Two Truths, One Fire — shuffle, timeout, scoring (isolated for easy tuning). */

export const TWO_TRUTHS_ONLINE_INPUT_TIMER_SEC = 60;
export const TWO_TRUTHS_TIMEOUT_WARNING_SEC = 10;

export function shuffleLiePresentation(items, lieIndex) {
  const triple = (items || []).map((text) => String(text || '').trim()).slice(0, 3);
  if (triple.length !== 3) {
    return { items: triple, lieIndex: Math.max(0, Math.min(2, Number(lieIndex) || 0)) };
  }
  const tagged = triple.map((text, index) => ({ text, wasLie: index === lieIndex }));
  for (let i = tagged.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }
  const shuffledLieIndex = tagged.findIndex((entry) => entry.wasLie);
  return {
    items: tagged.map((entry) => entry.text),
    lieIndex: shuffledLieIndex >= 0 ? shuffledLieIndex : 0,
  };
}

export function buildPresentationsFromSubmissions(submissionsByPlayerId = {}) {
  const presentationsByPlayerId = {};
  for (const [playerId, submission] of Object.entries(submissionsByPlayerId || {})) {
    if (!submission || submission.burnedOut) {
      presentationsByPlayerId[playerId] = {
        items: [],
        lieIndex: -1,
        burnedOut: true,
      };
      continue;
    }
    const items = submission.items || [];
    const lieIndex = Number(submission.lieIndex);
    if (items.length !== 3 || !Number.isFinite(lieIndex)) {
      presentationsByPlayerId[playerId] = {
        items: [],
        lieIndex: -1,
        burnedOut: true,
      };
      continue;
    }
    const shuffled = shuffleLiePresentation(items, lieIndex);
    presentationsByPlayerId[playerId] = {
      items: shuffled.items,
      lieIndex: shuffled.lieIndex,
      burnedOut: false,
    };
  }
  return presentationsByPlayerId;
}

/**
 * Provisional timeout policy (change in this function only).
 * - All 3 fields filled but lie not marked → random lie index, submit.
 * - Otherwise → skip entry (burned out), score 0 for author, still votable if others submitted.
 */
export function handleTwoTruthsTimeout({
  items = ['', '', ''],
  lieIndex = null,
  randomLieIndex = () => Math.floor(Math.random() * 3),
} = {}) {
  const normalized = items.map((value) => String(value || '').trim());
  const allFilled = normalized.every(Boolean);
  const lieMarked =
    lieIndex !== null &&
    lieIndex !== undefined &&
    lieIndex !== '' &&
    Number.isFinite(Number(lieIndex));

  if (allFilled && !lieMarked) {
    const autoLie = randomLieIndex();
    return {
      action: 'auto-submit',
      submission: {
        items: normalized,
        lieIndex: autoLie,
        timedOut: true,
        burnedOut: false,
      },
    };
  }

  if (allFilled && lieMarked) {
    return {
      action: 'submit',
      submission: {
        items: normalized,
        lieIndex: Number(lieIndex),
        timedOut: true,
        burnedOut: false,
      },
    };
  }

  return {
    action: 'burn-out',
    submission: {
      items: normalized,
      lieIndex: -1,
      timedOut: true,
      burnedOut: true,
    },
  };
}

export function normalizeTwoTruthsVotes(votesByVoterId = {}, players = []) {
  const validIds = new Set((players || []).map((p) => p.id));
  const normalized = {};
  for (const [voterId, byAuthor] of Object.entries(votesByVoterId || {})) {
    if (!validIds.has(voterId)) continue;
    if (!byAuthor || typeof byAuthor !== 'object') continue;
    const authorVotes = {};
    for (const [authorId, lieIndex] of Object.entries(byAuthor)) {
      if (!validIds.has(authorId) || authorId === voterId) continue;
      const idx = Number(lieIndex);
      if (!Number.isFinite(idx) || idx < 0 || idx > 2) continue;
      authorVotes[authorId] = idx;
    }
    if (Object.keys(authorVotes).length) normalized[voterId] = authorVotes;
  }
  return normalized;
}

export function calculateTwoTruthsRoundResolution(
  players,
  round,
  votesByVoterId = {},
) {
  const presentations =
    round?.twoTruthsData?.presentationsByPlayerId &&
    typeof round.twoTruthsData.presentationsByPlayerId === 'object'
      ? round.twoTruthsData.presentationsByPlayerId
      : {};
  const submissions =
    round?.twoTruthsData?.submissionsByPlayerId &&
    typeof round.twoTruthsData.submissionsByPlayerId === 'object'
      ? round.twoTruthsData.submissionsByPlayerId
      : {};

  const normalizedVotes = normalizeTwoTruthsVotes(votesByVoterId, players);
  const roundGains = {};
  const roundBreakdown = {};
  const tally = {};

  for (const player of players) {
    roundGains[player.id] = 0;
    roundBreakdown[player.id] = {
      voteHit: 0,
      fooledCount: 0,
      burnedOut: Boolean(submissions[player.id]?.burnedOut),
    };
  }

  const authors = players.filter((player) => {
    const presentation = presentations[player.id];
    return presentation && !presentation.burnedOut && presentation.items?.length === 3;
  });

  for (const author of authors) {
    const presentation = presentations[author.id];
    const correctLieIndex = presentation.lieIndex;
    let fooled = 0;
    let spotted = 0;
    for (const voter of players) {
      if (voter.id === author.id) continue;
      const pick = normalizedVotes[voter.id]?.[author.id];
      if (pick === undefined) continue;
      if (pick === correctLieIndex) {
        roundGains[voter.id] = (roundGains[voter.id] || 0) + 1;
        roundBreakdown[voter.id].voteHit =
          (roundBreakdown[voter.id].voteHit || 0) + 1;
        spotted += 1;
      } else {
        fooled += 1;
        roundGains[author.id] = (roundGains[author.id] || 0) + 1;
      }
    }
    roundBreakdown[author.id].fooledCount = fooled;
    tally[author.id] = { spotted, fooled };
  }

  const nextPlayers = players.map((player) => ({
    ...player,
    score: Math.max(0, Number(player.score || 0) + (roundGains[player.id] || 0)),
  }));

  return {
    normalizedVotes,
    tally,
    imposterCaught: false,
    roundGains,
    roundBreakdown,
    nextPlayers,
  };
}

export function createEmptyTwoTruthsData() {
  return {
    submissionsByPlayerId: {},
    presentationsByPlayerId: {},
    votesByVoterId: {},
  };
}
