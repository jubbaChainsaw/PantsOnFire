/** Apply CSS variables for notch / status bar / gesture nav (WebView + mobile browsers). */
export function installSafeAreaInsets() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const host = typeof window !== 'undefined' ? window.__POF_NATIVE_HOST__ : null;
  const injected = host?.safeAreaInsets;

  if (injected && typeof injected === 'object') {
    const { top = 0, bottom = 0, left = 0, right = 0 } = injected;
    root.style.setProperty('--pof-native-safe-top', `${Number(top) || 0}px`);
    root.style.setProperty('--pof-native-safe-bottom', `${Number(bottom) || 0}px`);
    root.style.setProperty('--pof-native-safe-left', `${Number(left) || 0}px`);
    root.style.setProperty('--pof-native-safe-right', `${Number(right) || 0}px`);
    return;
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    root.style.setProperty('--pof-native-safe-top', '32px');
    root.style.setProperty('--pof-native-safe-bottom', '20px');
  } else if (isIos) {
    root.style.setProperty('--pof-native-safe-top', '0px');
    root.style.setProperty('--pof-native-safe-bottom', '0px');
  }
}

export function bindNativeSafeAreaInsetListener() {
  if (typeof window === 'undefined') return () => {};
  const handler = () => installSafeAreaInsets();
  window.addEventListener('pof-native-host-ready', handler);
  return () => window.removeEventListener('pof-native-host-ready', handler);
}
