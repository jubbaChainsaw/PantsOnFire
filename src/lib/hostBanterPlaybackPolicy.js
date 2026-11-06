/**
 * When bundled Ian host banter may play without overlapping party voice / one-word / discussion.
 * Every client plays the same cue once per `lineKey` + round (snapshot-driven); no extra network broadcast.
 * Host-only actions (phase advance, etc.) stay separate in App — this is playback eligibility only.
 */

/** Phases/screens where party voice or one-word mic is hot; skip ambient Ian banter. */
const BLOCK_HOST_BANTER = new Set(['discussion', 'one-word']);

/**
 * @param {object} [opts]
 * @param {boolean} [opts.onlineMode]
 * @param {string} [opts.screen] App screen id
 * @param {string} [opts.roundPhase] Server round.phase when online
 * @param {boolean} [opts.skipPartyVoiceHotPhases] default true — discussion / one-word
 */
export function shouldPlayBundledHostBanter({
  onlineMode = false,
  screen = '',
  roundPhase = '',
  skipPartyVoiceHotPhases = true,
} = {}) {
  void onlineMode;
  if (!skipPartyVoiceHotPhases) return true;
  const phase = String(roundPhase || '').trim();
  if (phase && BLOCK_HOST_BANTER.has(phase)) return false;
  const scr = String(screen || '').trim();
  if (BLOCK_HOST_BANTER.has(scr)) return false;
  return true;
}
