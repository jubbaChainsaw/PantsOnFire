// E2 — pure scoring / round-resolution logic extracted verbatim from
// src/App.jsx. No React, no browser APIs, no content imports. Behaviour must
// remain identical to the original App.jsx implementation.

export function calculateRoundResolutionLocal(players, round, votesByPlayerId = {}) {
  const validPlayerIds = new Set(players.map((player) => player.id));
  const normalizedVotes = Object.fromEntries(
    Object.entries(votesByPlayerId || {}).filter(([voterId, targetId]) => {
      if (!validPlayerIds.has(voterId)) return false;
      if (!targetId || !validPlayerIds.has(targetId)) return false;
      return voterId !== targetId;
    }),
  );
  const tally = {};
  Object.values(normalizedVotes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const liarIds = round?.imposterIds || [];
  const topVotes = Math.max(0, ...Object.values(tally));
  const caughtLiars = liarIds.filter(
    (id) => (tally[id] || 0) > 0 && (tally[id] || 0) === topVotes,
  );
  const imposterCaught =
    liarIds.length > 0 ? caughtLiars.length === liarIds.length : false;
  const isGrillRound = round?.roundTypeId === "grill";
  const grillData =
    round?.grillData && typeof round.grillData === "object"
      ? round.grillData
      : {};
  const grillScoreAdjustments =
    grillData?.scoreAdjustmentsByPlayerId &&
    typeof grillData.scoreAdjustmentsByPlayerId === "object"
      ? grillData.scoreAdjustmentsByPlayerId
      : {};
  const grillGuessWinnerId = String(grillData?.guessWinnerId || "").trim();
  const roundGains = {};
  const roundBreakdown = {};
  const nextPlayers = players.map((player) => {
    let gain = 0;
    let voteHit = 0;
    let liarSurvived = 0;
    let grillTeamBonus = 0;
    let grillLiarSwing = 0;
    let grillGuessBonus = 0;
    let grillCheatPenalty = 0;
    if (liarIds.includes(normalizedVotes[player.id])) {
      gain += 1;
      voteHit = 1;
    }
    if (liarIds.includes(player.id) && !imposterCaught) {
      gain += 2;
      liarSurvived = 2;
    }
    if (isGrillRound) {
      if (imposterCaught) {
        gain += 2;
        grillTeamBonus = 2;
      } else if (liarIds.includes(player.id)) {
        gain += 2;
        grillLiarSwing = 2;
      } else {
        gain -= 1;
        grillLiarSwing = -1;
      }
      const extraAdjustment = Number(grillScoreAdjustments[player.id] || 0);
      if (Number.isFinite(extraAdjustment) && extraAdjustment !== 0) {
        gain += extraAdjustment;
        if (player.id === grillGuessWinnerId) {
          grillGuessBonus = extraAdjustment;
        } else if (extraAdjustment < 0) {
          grillCheatPenalty += extraAdjustment;
        }
      }
    }
    roundGains[player.id] = gain;
    roundBreakdown[player.id] = {
      voteHit,
      liarSurvived,
      grillTeamBonus,
      grillLiarSwing,
      grillGuessBonus,
      grillCheatPenalty,
    };
    return {
      ...player,
      score: Math.max(0, Number(player.score || 0) + gain),
    };
  });
  return {
    normalizedVotes,
    tally,
    imposterCaught,
    roundGains,
    roundBreakdown,
    nextPlayers,
  };
}

export function applyGrillRoundDataToRound(round, grillData = {}, players = []) {
  if (!round || round.roundTypeId !== "grill") return round;
  const playerIds = new Set((players || []).map((player) => player.id));
  const normalizedGrillData =
    grillData && typeof grillData === "object" ? grillData : {};
  const scoreAdjustmentsByPlayerId =
    normalizedGrillData.scoreAdjustmentsByPlayerId &&
    typeof normalizedGrillData.scoreAdjustmentsByPlayerId === "object"
      ? normalizedGrillData.scoreAdjustmentsByPlayerId
      : {};
  const sanitizedAdjustments = Object.fromEntries(
    Object.entries(scoreAdjustmentsByPlayerId)
      .filter(([playerId, value]) => {
        if (!playerIds.has(playerId)) return false;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric !== 0;
      })
      .map(([playerId, value]) => [playerId, Number(value)]),
  );
  const disqualifiedPlayerIds = Array.isArray(
    normalizedGrillData.disqualifiedPlayerIds,
  )
    ? normalizedGrillData.disqualifiedPlayerIds
        .map((value) => String(value || "").trim())
        .filter((value) => value && playerIds.has(value))
    : [];
  const guessWinnerId = String(normalizedGrillData.guessWinnerId || "").trim();
  const normalizedGuessWinnerId =
    guessWinnerId && playerIds.has(guessWinnerId) ? guessWinnerId : "";
  return {
    ...round,
    grillData: {
      ...(round.grillData || {}),
      ...normalizedGrillData,
      disqualifiedPlayerIds,
      scoreAdjustmentsByPlayerId: sanitizedAdjustments,
      guessWinnerId: normalizedGuessWinnerId,
      endedByCorrectGuess: Boolean(normalizedGrillData.endedByCorrectGuess),
    },
  };
}
