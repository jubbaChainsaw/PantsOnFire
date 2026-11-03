import { useEffect, useRef, useState } from 'react';
import {
  TWO_TRUTHS_ONLINE_INPUT_TIMER_SEC,
  TWO_TRUTHS_TIMEOUT_WARNING_SEC,
} from '../lib/twoTruthsOneFire.js';

export function useTwoTruthsInputTimer({
  enabled,
  onTimeout,
  durationSec: durationSecInput,
  warningSec = TWO_TRUTHS_TIMEOUT_WARNING_SEC,
}) {
  const useFastTimers = import.meta.env.VITE_E2E_FAST_TIMERS === '1';
  const durationSec =
    durationSecInput ?? (useFastTimers ? 5 : TWO_TRUTHS_ONLINE_INPUT_TIMER_SEC);
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return undefined;
    firedRef.current = false;
    setSecondsLeft(durationSec);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = Math.max(0, durationSec - elapsed);
      setSecondsLeft(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current?.();
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [enabled, durationSec]);

  return {
    secondsLeft,
    totalSeconds: durationSec,
    warningActive: enabled && secondsLeft > 0 && secondsLeft <= warningSec,
  };
}
