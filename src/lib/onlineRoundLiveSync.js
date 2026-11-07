/**
 * Stable signature for server lobby snapshots so clients re-sync when the active
 * round changes without relying on React state (phase-only checks miss same-phase updates).
 */

export function buildOnlineRoundLiveSyncSignature(activeRound) {
  if (!activeRound || typeof activeRound !== 'object') return '';
  const snapshotPhase = String(activeRound.phase || '').trim();
  const snapshotTurnIndex = Math.max(0, Number(activeRound.oneWordTurnIndex) || 0);
  const snapshotTwoTruthsInputIdx = Math.max(
    0,
    Number(activeRound.twoTruthsData?.inputPlayerIndex) || 0,
  );
  const voteSig =
    activeRound.twoTruthsData?.votesByVoterId &&
    typeof activeRound.twoTruthsData.votesByVoterId === 'object'
      ? JSON.stringify(activeRound.twoTruthsData.votesByVoterId)
      : '';
  return `${snapshotPhase}:${snapshotTurnIndex}:${activeRound.roundNumber || 0}:${activeRound.phaseUpdatedAt || ''}:${snapshotTwoTruthsInputIdx}:${voteSig}`;
}
