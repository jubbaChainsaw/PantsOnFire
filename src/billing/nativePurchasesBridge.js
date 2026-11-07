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

/**
 * Start a native store purchase using Google Play / App Store product ids.
 * @param {{ kind: 'tier'|'addon'|'dlc', productId: string }} params internal catalog id
 * @returns {boolean} true if message was posted to native shell
 */
export function requestNativeStorePurchase({ kind, productId } = {}) {
  const bridge = window.ReactNativeWebView;
  if (!bridge?.postMessage) return false;
  const normalizedKind = String(kind || '').trim();
  const internalId = String(productId || '').trim();
  if (!normalizedKind || !internalId) return false;
  try {
    bridge.postMessage(
      JSON.stringify({
        type: 'POF_PURCHASE',
        kind: normalizedKind,
        internalProductId: internalId,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function isNativeStorePurchaseAvailable() {
  return Boolean(window.ReactNativeWebView?.postMessage);
}
