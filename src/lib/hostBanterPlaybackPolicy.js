/**
 * When bundled Ian host banter may play without overlapping party voice / one-word / discussion.
 * Every client plays the same cue once per `lineKey` + round (snapshot-driven); no extra network broadcast.
 * Host-only actions (phase advance, etc.) stay separate in App — this is playback eligibility only.
 */

/** Phases/screens where party voice or one-word mic is hot; skip ambient / optional Ian banter only. */
const BLOCK_AMBIENT_HOST_BANTER = new Set(['discussion', 'one-word']);

/**
 * Stinger + modular clip queues — still allowed during voice-hot phases (instructional voice).
 */
export function shouldPlayBundledHostBanter() {
  return true;
}

/**
 * Optional ambience (e.g. phase sting, Two Truths narration): skip when party mic is hot.
 * @param {object} [opts]
 * @param {boolean} [opts.onlineMode]
 * @param {string} [opts.screen] App screen id
 * @param {string} [opts.roundPhase] Server round.phase when online
 * @param {boolean} [opts.skipPartyVoiceHotPhases] default true — discussion / one-word
 */
export function shouldPlayAmbientBundledHostBanter({
  onlineMode = false,
  screen = '',
  roundPhase = '',
  skipPartyVoiceHotPhases = true,
} = {}) {
  void onlineMode;
  if (!skipPartyVoiceHotPhases) return true;
  const phase = String(roundPhase || '').trim();
  if (phase && BLOCK_AMBIENT_HOST_BANTER.has(phase)) return false;
  const scr = String(screen || '').trim();
  if (BLOCK_AMBIENT_HOST_BANTER.has(scr)) return false;
  return true;
}
