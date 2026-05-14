/**
 * Notify the Expo native shell (react-native-purchases) which Supabase / game
 * user id should receive StoreKit / Play Billing updates.
 * @param {string} userId
 */
export function notifyNativePurchasesUser(userId) {
  const id = String(userId || '').trim();
  if (!id) return;
  const bridge = window.ReactNativeWebView;
  if (!bridge?.postMessage) return;
  try {
    bridge.postMessage(JSON.stringify({ type: 'POF_SET_USER', userId: id }));
  } catch {
    /* ignore */
  }
}

/**
 * Ask the native shell to sync RevenueCat and optionally push fresh state.
 */
export function requestNativeEntitlementsRefresh() {
  const bridge = window.ReactNativeWebView;
  if (!bridge?.postMessage) return;
  try {
    bridge.postMessage(JSON.stringify({ type: 'POF_REFRESH_ENTITLEMENTS' }));
  } catch {
    /* ignore */
  }
}
