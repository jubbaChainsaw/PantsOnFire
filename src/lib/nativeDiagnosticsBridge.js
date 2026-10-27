let latestNativeDiagnostics = {};

export function getNativeDiagnosticsSnapshot() {
  if (typeof window !== 'undefined' && window.__POF_NATIVE_DIAGNOSTICS) {
    return { ...window.__POF_NATIVE_DIAGNOSTICS };
  }
  return { ...latestNativeDiagnostics };
}

/** Listens for diagnostics injected from the Expo WebView shell. */
export function installNativeDiagnosticsBridge(onUpdate) {
  const handler = (event) => {
    const detail = event?.detail;
    if (!detail || typeof detail !== 'object') return;
    latestNativeDiagnostics = { ...detail };
    if (typeof window !== 'undefined') {
      window.__POF_NATIVE_DIAGNOSTICS = latestNativeDiagnostics;
    }
    onUpdate?.(latestNativeDiagnostics);
  };
  window.addEventListener('pof-native-diagnostics', handler);
  return () => window.removeEventListener('pof-native-diagnostics', handler);
}
