import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getHostVoiceSrcCandidatesForLine } from '../data/hostVoiceLineMap.js';
import { resolveBundledAssetSrc } from './contentPacks/resolveAsset.js';
import { HostCommentaryContext } from '../context/HostCommentaryContext.jsx';

/** Short pause after a voice clip before auto-advancing dialogue. */
export const HOST_SPEECH_PAUSE_AFTER_MS = 320;

function normalizeHostVoiceLine(line = '') {
  return String(line || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function resolveVoiceCandidates(line, themeName, audioSrcCandidates) {
  const normalized = normalizeHostVoiceLine(line);
  if (!normalized) return [];
  const mappedSrcCandidates =
    Array.isArray(audioSrcCandidates) && audioSrcCandidates.length
      ? audioSrcCandidates.filter(Boolean)
      : getHostVoiceSrcCandidatesForLine(normalized, themeName);
  return mappedSrcCandidates.map((src) => resolveBundledAssetSrc(src)).filter(Boolean);
}

/**
 * Play one host voice line, keyed by lineKey so stale async work is ignored after advance.
 * Calls onFinished when playback ends (or fallback elapses when no audio file exists).
 */
export function useIanPosterHostVoicePlayback({
  enabled = false,
  line = '',
  lineKey = '',
  themeName = 'Default',
  fallbackDurationMs = 6000,
  audioSrcCandidates = null,
  onFinished = null,
  nextLine = '',
  nextThemeName = null,
} = {}) {
  const commentaryCtx = useContext(HostCommentaryContext);
  const hostCommentaryEnabled = commentaryCtx?.hostCommentaryEnabled !== false;
  const commentaryGeneration = commentaryCtx?.commentaryGeneration ?? 0;
  const registerStopHandler = commentaryCtx?.registerStopHandler;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const sessionRef = useRef(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const stopActiveAudio = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (typeof registerStopHandler !== 'function') return undefined;
    return registerStopHandler(stopActiveAudio);
  }, [registerStopHandler, stopActiveAudio]);

  const effectiveEnabled = Boolean(enabled && hostCommentaryEnabled);
  const guardedLineKey = `${lineKey}:cg${commentaryGeneration}`;

  useEffect(() => {
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    stopActiveAudio();

    const normalized = normalizeHostVoiceLine(line);
    if (!effectiveEnabled || !normalized) {
      return undefined;
    }

    const fallbackMs = Math.max(600, Number(fallbackDurationMs) || 6000);
    const resolvedSrcCandidates = resolveVoiceCandidates(
      line,
      themeName,
      audioSrcCandidates,
    );

    const notifyFinished = (reason) => {
      if (sessionRef.current !== session) return;
      setIsPlaying(false);
      const cb = onFinishedRef.current;
      if (typeof cb === 'function') {
        cb({ session, reason, lineKey: guardedLineKey });
      }
    };

    const nextCandidates = resolveVoiceCandidates(
      nextLine,
      nextThemeName || themeName,
      null,
    );
    if (nextCandidates[0]) {
      try {
        const preload = new Audio(nextCandidates[0]);
        preload.preload = 'auto';
        preload.load();
      } catch {
        /* ignore preload failures */
      }
    }

    if (!resolvedSrcCandidates.length) {
      setIsPlaying(true);
      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        notifyFinished('fallback-no-audio');
      }, fallbackMs);
      return () => {
        if (sessionRef.current === session) {
          stopActiveAudio();
        }
      };
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    setIsPlaying(true);

    let activeCandidateIndex = 0;
    const tryPlayAtIndex = (index) => {
      activeCandidateIndex = index;
      audio.src = resolvedSrcCandidates[index];
      audio.load();
      return audio.play();
    };
    const tryNextCandidateOrFallback = () => {
      const nextIndex = activeCandidateIndex + 1;
      if (nextIndex < resolvedSrcCandidates.length) {
        tryPlayAtIndex(nextIndex).catch(() => tryNextCandidateOrFallback());
        return;
      }
      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        notifyFinished('fallback-error');
      }, fallbackMs);
    };

    const handleEnded = () => {
      if (sessionRef.current !== session) return;
      notifyFinished('ended');
    };
    const handleError = () => {
      if (sessionRef.current !== session) return;
      tryNextCandidateOrFallback();
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    tryPlayAtIndex(0).catch(() => tryNextCandidateOrFallback());

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      if (sessionRef.current === session) {
        stopActiveAudio();
      }
    };
  }, [
    effectiveEnabled,
    line,
    guardedLineKey,
    themeName,
    fallbackDurationMs,
    audioSrcCandidates,
    nextLine,
    nextThemeName,
    stopActiveAudio,
  ]);

  return { isPlaying, stopPlayback: stopActiveAudio, bumpSession: () => {
    sessionRef.current += 1;
    stopActiveAudio();
  } };
}

/** Auto-advance host dialogue when the current line's audio finishes (+ short pause). */
export function useHostSpeechAutoAdvance({
  stepIndex = 0,
  stepCount = 0,
  lineKey = '',
  voiceEnabled = false,
  voiceLine = '',
  nextVoiceLine = '',
  themeName = 'Default',
  fallbackDurationMs = 6000,
  onAdvanceStep,
  pauseAfterMs = HOST_SPEECH_PAUSE_AFTER_MS,
} = {}) {
  const commentaryCtx = useContext(HostCommentaryContext);
  const hostCommentaryEnabled = commentaryCtx?.hostCommentaryEnabled !== false;
  const registerStopHandler = commentaryCtx?.registerStopHandler;

  const advanceTimerRef = useRef(null);

  const clearAdvanceTimer = useCallback(() => {
    if (!advanceTimerRef.current) return;
    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof registerStopHandler !== 'function') return undefined;
    return registerStopHandler(clearAdvanceTimer);
  }, [registerStopHandler, clearAdvanceTimer]);

  const handleFinished = useCallback(() => {
    if (!hostCommentaryEnabled) return;
    if (stepIndex >= stepCount - 1) return;
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      onAdvanceStep?.();
    }, Math.max(0, Number(pauseAfterMs) || HOST_SPEECH_PAUSE_AFTER_MS));
  }, [
    hostCommentaryEnabled,
    stepIndex,
    stepCount,
    onAdvanceStep,
    pauseAfterMs,
    clearAdvanceTimer,
  ]);

  useEffect(() => clearAdvanceTimer, [lineKey, clearAdvanceTimer]);

  const { isPlaying, stopPlayback, bumpSession } = useIanPosterHostVoicePlayback({
    enabled: voiceEnabled && Boolean(voiceLine),
    line: voiceLine,
    lineKey,
    themeName,
    fallbackDurationMs,
    nextLine: nextVoiceLine,
    onFinished: handleFinished,
  });

  /** When commentary is off, advance dialogue without waiting for host MP3 */
  useEffect(() => {
    if (hostCommentaryEnabled) return undefined;
    if (!voiceEnabled || !voiceLine || stepIndex >= stepCount - 1) return undefined;
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      onAdvanceStep?.();
    }, 120);
    return () => clearAdvanceTimer();
  }, [
    hostCommentaryEnabled,
    voiceEnabled,
    voiceLine,
    stepIndex,
    stepCount,
    lineKey,
    onAdvanceStep,
    clearAdvanceTimer,
  ]);

  return { isPlaying, stopPlayback, bumpSession, clearAdvanceTimer };
}

const SEGMENT_PAUSE_MS = 120;

/**
 * Play a chain of host voice segments (modular banter). Stops and clears queue when commentary off.
 */
export function useModularHostBanterQueue({
  plan = null,
  themeName = 'Default',
  lineKeyPrefix = 'banter',
} = {}) {
  const commentaryCtx = useContext(HostCommentaryContext);
  const hostCommentaryEnabled = commentaryCtx?.hostCommentaryEnabled !== false;
  const commentaryGeneration = commentaryCtx?.commentaryGeneration ?? 0;
  const registerStopHandler = commentaryCtx?.registerStopHandler;

  const [segmentIndex, setSegmentIndex] = useState(0);
  const committedOnceRef = useRef('');
  const pauseTimerRef = useRef(null);

  const segments = plan?.segments;
  const segCount = Array.isArray(segments) ? segments.length : 0;
  const current = segCount ? segments[Math.min(segmentIndex, segCount - 1)] : null;

  const clearPause = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  const stopQueue = useCallback(() => {
    clearPause();
    setSegmentIndex(0);
  }, [clearPause]);

  useEffect(() => {
    if (typeof registerStopHandler !== 'function') return undefined;
    return registerStopHandler(stopQueue);
  }, [registerStopHandler, stopQueue]);

  useEffect(() => {
    stopQueue();
    committedOnceRef.current = '';
  }, [plan?.dedupKey, commentaryGeneration, stopQueue]);

  /** Dedup / anti-repeat when the moment is shown — not deferred until audio ends (t221u: subtitles without audio) */
  useEffect(() => {
    if (!plan?.onCommit || !plan.dedupKey) return;
    if (committedOnceRef.current === plan.dedupKey) return;
    committedOnceRef.current = plan.dedupKey;
    plan.onCommit();
  }, [plan]);

  const handleSegmentFinished = useCallback(() => {
    if (!hostCommentaryEnabled) return;
    if (!segCount) return;
    if (segmentIndex >= segCount - 1) {
      return;
    }
    clearPause();
    pauseTimerRef.current = setTimeout(() => {
      pauseTimerRef.current = null;
      setSegmentIndex((i) => i + 1);
    }, SEGMENT_PAUSE_MS);
  }, [hostCommentaryEnabled, segCount, segmentIndex, clearPause]);

  const effectiveLineKey = `${lineKeyPrefix}:${plan?.dedupKey || 'none'}:s${segmentIndex}:cg${commentaryGeneration}`;

  useIanPosterHostVoicePlayback({
    enabled:
      hostCommentaryEnabled &&
      Boolean(plan) &&
      Boolean(current?.line) &&
      segCount > 0,
    line: current?.line || '',
    lineKey: effectiveLineKey,
    themeName,
    audioSrcCandidates: current?.audioSrcCandidates || null,
    fallbackDurationMs: current?.fallbackDurationMs ?? 2600,
    onFinished: handleSegmentFinished,
  });

  return {
    composedSubtitle: plan?.composedSubtitle || '',
    subtitleVisible: Boolean(plan?.composedSubtitle),
  };
}
