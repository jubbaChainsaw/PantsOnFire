import { useCallback, useEffect, useRef, useState } from 'react';
import { getHostVoiceSrcCandidatesForLine } from '../data/hostVoiceLineMap.js';
import { resolveBundledAssetSrc } from './contentPacks/resolveAsset.js';

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
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    stopActiveAudio();

    const normalized = normalizeHostVoiceLine(line);
    if (!enabled || !normalized) {
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
        cb({ session, reason, lineKey });
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
    enabled,
    line,
    lineKey,
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
  const advanceTimerRef = useRef(null);

  const clearAdvanceTimer = useCallback(() => {
    if (!advanceTimerRef.current) return;
    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
  }, []);

  const handleFinished = useCallback(() => {
    if (stepIndex >= stepCount - 1) return;
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      onAdvanceStep?.();
    }, Math.max(0, Number(pauseAfterMs) || HOST_SPEECH_PAUSE_AFTER_MS));
  }, [stepIndex, stepCount, onAdvanceStep, pauseAfterMs, clearAdvanceTimer]);

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

  return { isPlaying, stopPlayback, bumpSession, clearAdvanceTimer };
}
