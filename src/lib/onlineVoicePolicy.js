/**
 * Online party voice: which app screens may open mic / LiveKit (mirrors App.jsx).
 */

export const ONLINE_VOICE_ACTIVE_SCREEN_IDS = Object.freeze([
  'online-lobby-created',
  'online-lobby-waiting',
  'one-word',
  'discussion',
  'voting',
  'twotruths-input',
  'twotruths-voting',
  'twotruths-reveal',
  'results',
]);

/** Whether the current phase may enable party voice (user setting still applies in App). */
export function onlinePhaseAllowsPartyVoice(onlineMode = false, screen = '') {
  return Boolean(
    onlineMode &&
      ONLINE_VOICE_ACTIVE_SCREEN_IDS.includes(String(screen || '').trim()),
  );
}

/** Voice UI is only relevant in online mode on these screens when the user has toggled voice on. */
export function shouldShowOnlinePartyVoiceUi({
  onlineMode = false,
  screen = '',
  onlineVoiceEnabled = false,
} = {}) {
  return Boolean(
    onlineVoiceEnabled &&
      onlinePhaseAllowsPartyVoice(onlineMode, screen),
  );
}
