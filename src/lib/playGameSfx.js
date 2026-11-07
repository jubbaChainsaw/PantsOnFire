import { loadFx } from './pofFx.js';

/**
 * UI / game SFX — independent of host commentary mute (see HostCommentaryContext).
 * @returns {boolean} whether playback was attempted
 */
export function playGameSfx(src, { volume = 0.55 } = {}) {
  const fxSettings = loadFx();
  if (!fxSettings.sfx) return false;
  if (!src) return false;
  const volScale = (Number(fxSettings.sfxVol) || 80) / 100;
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(
      0,
      Math.min(1, (Number(volume) || 0.55) * volScale),
    );
    audio.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}
