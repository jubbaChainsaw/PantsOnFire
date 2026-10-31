let latestNativeDiagnostics = {};

export function getNativeDiagnosticsSnapshot() {
  if (typeof window !== 'undefined' && window.__POF_NATIVE_DIAGNOSTICS) {
    return { ...window.__POF_NATIVE_DIAGNOSTICS };
  }
  return { ...latestNativeDiagnostics };
}

/** Listens for diagnostics injected from the Expo WebView shell. */
export function installNativeDiagnosticsBridge(onUpdate) {
  const mergeHostBuild = () => {
    if (typeof window === 'undefined' || !window.__POF_NATIVE_HOST__) return;
    const host = window.__POF_NATIVE_HOST__;
    latestNativeDiagnostics = {
      ...latestNativeDiagnostics,
      shellVersion: host.shellVersion || latestNativeDiagnostics.shellVersion,
      androidVersionCode:
        host.androidVersionCode || latestNativeDiagnostics.androidVersionCode,
      webBuildSha: host.webBuildSha || latestNativeDiagnostics.webBuildSha,
      gameSurface: host.gameSurface || latestNativeDiagnostics.gameSurface,
    };
    window.__POF_NATIVE_DIAGNOSTICS = latestNativeDiagnostics;
    onUpdate?.(latestNativeDiagnostics);
  };

  const handler = (event) => {
    const detail = event?.detail;
    if (!detail || typeof detail !== 'object') return;
    latestNativeDiagnostics = { ...latestNativeDiagnostics, ...detail };
    if (typeof window !== 'undefined') {
      window.__POF_NATIVE_DIAGNOSTICS = latestNativeDiagnostics;
    }
    onUpdate?.(latestNativeDiagnostics);
  };
  window.addEventListener('pof-native-diagnostics', handler);
  window.addEventListener('pof-native-host-ready', mergeHostBuild);
  mergeHostBuild();
  return () => {
    window.removeEventListener('pof-native-diagnostics', handler);
    window.removeEventListener('pof-native-host-ready', mergeHostBuild);
  };
}
