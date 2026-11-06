import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  loadHostCommentaryEnabled,
  saveHostCommentaryEnabled,
} from '../lib/hostCommentarySettings.js';

export const HostCommentaryContext = createContext({
  hostCommentaryEnabled: true,
  setHostCommentaryEnabled: () => {},
  /** Bump when disabling commentary so lineKey stale guards skip catch-up replay */
  commentaryGeneration: 0,
  bumpCommentaryGeneration: () => {},
  registerStopHandler: () => () => {},
});

export function HostCommentaryProvider({ children }) {
  const [hostCommentaryEnabled, setHostCommentaryEnabledState] = useState(() =>
    loadHostCommentaryEnabled(),
  );
  const [commentaryGeneration, setCommentaryGeneration] = useState(0);
  const stopHandlersRef = useRef(new Set());

  const bumpCommentaryGeneration = useCallback(() => {
    setCommentaryGeneration((g) => g + 1);
  }, []);

  const setHostCommentaryEnabled = useCallback((next) => {
    const value = Boolean(next);
    setHostCommentaryEnabledState(value);
    saveHostCommentaryEnabled(value);
    if (!value) {
      bumpCommentaryGeneration();
      stopHandlersRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    }
  }, [bumpCommentaryGeneration]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key !== 'imposter-host-commentary-v1') return;
      setHostCommentaryEnabledState(loadHostCommentaryEnabled());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const registerStopHandler = useCallback((fn) => {
    if (typeof fn !== 'function') return () => {};
    stopHandlersRef.current.add(fn);
    return () => {
      stopHandlersRef.current.delete(fn);
    };
  }, []);

  const value = useMemo(
    () => ({
      hostCommentaryEnabled,
      setHostCommentaryEnabled,
      commentaryGeneration,
      bumpCommentaryGeneration,
      registerStopHandler,
    }),
    [
      hostCommentaryEnabled,
      setHostCommentaryEnabled,
      commentaryGeneration,
      bumpCommentaryGeneration,
      registerStopHandler,
    ],
  );

  return React.createElement(
    HostCommentaryContext.Provider,
    { value },
    children,
  );
}

export function useHostCommentary() {
  return useContext(HostCommentaryContext);
}
