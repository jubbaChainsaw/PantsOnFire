/**
 * Platform detection and capability gating.
 *
 * Product decision: the web build is for JOINING games only. Hosting games
 * (online lobbies and local pass-the-phone) and purchases are app-only,
 * via the Expo native shell with RevenueCat.
 *
 * Resolution order for hosting/purchasing capability:
 * 1. Native app shell (react-native-webview) → always allowed.
 * 2. VITE_WEB_JOIN_ONLY=true → force join-only anywhere (for testing the
 *    join-only experience, even in dev).
 * 3. Production web → join-only by default; VITE_ENABLE_WEB_HOSTING="true"
 *    restores hosting (staging escape hatch — not for the live storefront).
 * 4. Dev builds → full capability, so the local workflow is unchanged.
 */

export function isNativeAppShell() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
}

function isForcedJoinOnly() {
  return String(import.meta.env?.VITE_WEB_JOIN_ONLY ?? 'false').trim() !== 'false';
}

/** Can this client create online lobbies or start local pass-the-phone games? */
export function isGameHostingAllowed() {
  if (isNativeAppShell()) return true;
  if (isForcedJoinOnly()) return false;
  if (!import.meta.env?.PROD) return true;
  return import.meta.env?.VITE_ENABLE_WEB_HOSTING === 'true';
}

/** Can this client initiate purchases? (Real purchases only exist in the app.) */
export function isPurchasingAllowed() {
  return isGameHostingAllowed();
}

export const APP_ONLY_HOSTING_MESSAGE =
  'Hosting games is available in the Pants on Fire app. On the web you can join a ' +
  "friend's lobby with their code.";

export const APP_ONLY_PURCHASE_MESSAGE =
  'Purchases are made in the Pants on Fire app (App Store / Google Play). ' +
  'Unlocked content syncs to your account everywhere.';
