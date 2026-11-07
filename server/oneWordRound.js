import { filterProfanity } from '../src/lib/profanityFilter.js';

export const ONE_WORD_TURN_MS = 12_000;
export const ONE_WORD_DISCONNECTED_SKIP_MS = 12_000;

const SINGLE_WORD_RE = /^[\p{L}\p{N}'’-]+$/u;

export function normalizeOneWordInput(raw = '') {
  return String(raw || '').trim().replace(/\s+/g, ' ');
}

export function validateOneWord(raw = '') {
  const trimmed = normalizeOneWordInput(raw);
  if (!trimmed) return { ok: false, error: 'word-required' };
  if (trimmed.includes(' ')) return { ok: false, error: 'single-word-only' };
  if (!SINGLE_WORD_RE.test(trimmed)) return { ok: false, error: 'invalid-characters' };
  const filtered = filterProfanity(trimmed);
  if (filtered !== trimmed) return { ok: false, error: 'word-blocked' };
  return { ok: true, word: trimmed };
}

export function buildOneWordTurnOrder(players = []) {
  return (Array.isArray(players) ? players : [])
    .map((player) => String(player?.id || '').trim())
    .filter(Boolean);
}

export function initializeOneWordPhase(round, players = [], now = new Date()) {
  if (!round) return;
  const turnOrder = buildOneWordTurnOrder(players);
  round.oneWordTurnOrder = turnOrder;
  round.oneWordTurnIndex = 0;
  round.oneWordByPlayerId = round.oneWordByPlayerId && typeof round.oneWordByPlayerId === 'object'
    ? round.oneWordByPlayerId
    : {};
  round.oneWordSpokenByPlayerId = round.oneWordSpokenByPlayerId && typeof round.oneWordSpokenByPlayerId === 'object'
    ? round.oneWordSpokenByPlayerId
    : {};
  round.oneWordSkippedByPlayerId = round.oneWordSkippedByPlayerId && typeof round.oneWordSkippedByPlayerId === 'object'
    ? round.oneWordSkippedByPlayerId
    : {};
  round.oneWordTurnStartedAt = now.toISOString();
  round.oneWordTurnDeadlineAt = new Date(now.getTime() + ONE_WORD_TURN_MS).toISOString();
  round.oneWordCurrentPlayerId = turnOrder[0] || null;
}

export function getOneWordCurrentPlayerId(round) {
  if (!round) return null;
  const explicit = String(round.oneWordCurrentPlayerId || '').trim();
  if (explicit) return explicit;
  const order = Array.isArray(round.oneWordTurnOrder) ? round.oneWordTurnOrder : [];
  const index = Math.max(0, Number(round.oneWordTurnIndex) || 0);
  return order[index] || null;
}

function markTurnComplete(round, playerId, { word = null, spoken = false, skipped = false } = {}) {
  const id = String(playerId || '').trim();
  if (!id) return;
  if (word) {
    round.oneWordByPlayerId = { ...(round.oneWordByPlayerId || {}), [id]: word };
  }
  if (spoken) {
    round.oneWordSpokenByPlayerId = { ...(round.oneWordSpokenByPlayerId || {}), [id]: true };
  }
  if (skipped) {
    round.oneWordSkippedByPlayerId = { ...(round.oneWordSkippedByPlayerId || {}), [id]: true };
  }
}

function advanceOneWordTurnOrDiscussion(round, now = new Date()) {
  const order = Array.isArray(round.oneWordTurnOrder) ? round.oneWordTurnOrder : [];
  const nextIndex = Math.max(0, Number(round.oneWordTurnIndex) || 0) + 1;
  if (nextIndex >= order.length) {
    round.phase = 'discussion';
    round.phaseUpdatedAt = now.toISOString();
    round.oneWordCurrentPlayerId = null;
    round.oneWordTurnDeadlineAt = null;
    return 'discussion';
  }
  round.oneWordTurnIndex = nextIndex;
  round.oneWordCurrentPlayerId = order[nextIndex] || null;
  round.oneWordTurnStartedAt = now.toISOString();
  round.oneWordTurnDeadlineAt = new Date(now.getTime() + ONE_WORD_TURN_MS).toISOString();
  return 'turn-advanced';
}

export function completeOneWordTurnForPlayer(
  round,
  playerId,
  { word = null, spoken = false, skipped = false } = {},
  now = new Date(),
) {
  if (!round || normalizeRoundPhaseLocal(round.phase) !== 'one-word') {
    return { error: 'one-word-not-active' };
  }
  const currentId = getOneWordCurrentPlayerId(round);
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedPlayerId || normalizedPlayerId !== currentId) {
    return { error: 'not-your-turn' };
  }
  if (word) {
    const validated = validateOneWord(word);
    if (!validated.ok) return { error: validated.error };
    markTurnComplete(round, normalizedPlayerId, { word: validated.word, spoken: false, skipped });
  } else {
    markTurnComplete(round, normalizedPlayerId, { spoken: Boolean(spoken), skipped: Boolean(skipped) });
  }
  const result = advanceOneWordTurnOrDiscussion(round, now);
  return { ok: true, phase: round.phase, result };
}

export function maybeTimeoutOneWordTurn(
  round,
  { isPlayerConnected = () => true } = {},
  now = new Date(),
) {
  if (!round || normalizeRoundPhaseLocal(round.phase) !== 'one-word') {
    return { changed: false };
  }
  const deadlineMs = Date.parse(String(round.oneWordTurnDeadlineAt || ''));
  if (!Number.isFinite(deadlineMs) || now.getTime() < deadlineMs) {
    return { changed: false };
  }
  const currentId = getOneWordCurrentPlayerId(round);
  if (!currentId) {
    round.phase = 'discussion';
    round.phaseUpdatedAt = now.toISOString();
    return { changed: true, phase: 'discussion' };
  }
  const connected = Boolean(isPlayerConnected(currentId));
  const turnStartedMs = Date.parse(String(round.oneWordTurnStartedAt || ''));
  const disconnectedLongEnough =
    !connected &&
    Number.isFinite(turnStartedMs) &&
    now.getTime() - turnStartedMs >= ONE_WORD_DISCONNECTED_SKIP_MS;
  if (!connected && !disconnectedLongEnough) {
    return { changed: false };
  }
  completeOneWordTurnForPlayer(round, currentId, { skipped: true }, now);
  return { changed: true, phase: round.phase };
}

function normalizeRoundPhaseLocal(rawPhase) {
  const phase = String(rawPhase || '').trim();
  if (phase === 'one-word') return 'one-word';
  return phase;
}

export function hydrateOneWordFields(rawRound) {
  if (!rawRound || typeof rawRound !== 'object') return;
  if (normalizeRoundPhaseLocal(rawRound.phase) !== 'one-word') return;
  if (!Array.isArray(rawRound.oneWordTurnOrder)) {
    rawRound.oneWordTurnOrder = [];
  }
  rawRound.oneWordTurnIndex = Math.max(0, Number(rawRound.oneWordTurnIndex) || 0);
  rawRound.oneWordByPlayerId =
    rawRound.oneWordByPlayerId && typeof rawRound.oneWordByPlayerId === 'object'
      ? rawRound.oneWordByPlayerId
      : {};
  rawRound.oneWordSpokenByPlayerId =
    rawRound.oneWordSpokenByPlayerId && typeof rawRound.oneWordSpokenByPlayerId === 'object'
      ? rawRound.oneWordSpokenByPlayerId
      : {};
  rawRound.oneWordSkippedByPlayerId =
    rawRound.oneWordSkippedByPlayerId && typeof rawRound.oneWordSkippedByPlayerId === 'object'
      ? rawRound.oneWordSkippedByPlayerId
      : {};
}
