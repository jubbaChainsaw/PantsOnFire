import { useEffect, useRef, useState } from 'react';
import { fx, tapFx } from '../lib/pofFx.js';
import {
  ONLINE_SELECTION_TIMER_SEC,
  SELECTION_FLASH_LAST_SEC,
} from '../data/uiNeonAssets.js';

/**
 * 30s selection timer with cycling highlight in the last 3 seconds.
 * Tap calls onPick immediately; at 0 the highlighted option is chosen.
 */
export function useTimedChoice({
  enabled,
  optionIds = [],
  onPick,
  durationSec =
    import.meta.env.VITE_E2E_FAST_TIMERS === '1'
      ? 3
      : durationSec ?? ONLINE_SELECTION_TIMER_SEC,
  flashLastSec =
    import.meta.env.VITE_E2E_FAST_TIMERS === '1'
      ? 1
      : flashLastSec ?? SELECTION_FLASH_LAST_SEC,
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const userPickedRef = useRef(false);
  const highlightRef = useRef(0);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!enabled || !optionIds.length) return undefined;
    userPickedRef.current = false;
    highlightRef.current = 0;
    setSecondsLeft(durationSec);
    setHighlightIndex(0);
    const started = Date.now();
    let lastFlashSecond = -1;
    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = Math.max(0, durationSec - elapsed);
      setSecondsLeft(left);
      if (left <= flashLastSec && left > 0 && optionIds.length > 1) {
        if (left !== lastFlashSecond) {
          lastFlashSecond = left;
          highlightRef.current =
            (highlightRef.current + 1) % optionIds.length;
          setHighlightIndex(highlightRef.current);
          fx.lastSeconds();
        }
      }
      if (left === 0 && !userPickedRef.current) {
        const id =
          optionIds[highlightRef.current] ?? optionIds[0];
        userPickedRef.current = true;
        fx.autoPick();
        onPickRef.current?.(id);
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [enabled, durationSec, flashLastSec, optionIds.join('|')]);

  const pick = (id) => {
    if (!enabled || userPickedRef.current) return;
    userPickedRef.current = true;
    tapFx();
    onPickRef.current?.(id);
  };

  return {
    secondsLeft,
    highlightIndex,
    highlightedId: optionIds[highlightIndex] ?? optionIds[0] ?? '',
    pick,
    isFlashing: secondsLeft <= flashLastSec && secondsLeft > 0,
  };
}
