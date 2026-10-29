import { CONTENT_PACK_MESSAGE } from './constants.js';

function postNative(message) {
  const bridge = window.ReactNativeWebView;
  if (!bridge?.postMessage) return false;
  try {
    bridge.postMessage(JSON.stringify(message));
    return true;
  } catch {
    return false;
  }
}

export function isNativeContentPackBridgeAvailable() {
  return Boolean(window.ReactNativeWebView?.postMessage);
}

export function requestInstalledContentPacks() {
  return postNative({ type: CONTENT_PACK_MESSAGE.LIST });
}

export function requestContentPackDownload(pack, manifest, { downloadUrl } = {}) {
  return postNative({
    type: CONTENT_PACK_MESSAGE.DOWNLOAD,
    pack,
    manifestVersion: manifest?.version,
    baseUrl: manifest?.baseUrl,
    downloadUrl: downloadUrl ? String(downloadUrl) : undefined,
  });
}

export function requestContentPackCancel(packId) {
  return postNative({ type: CONTENT_PACK_MESSAGE.CANCEL, packId });
}

export function requestContentPackDelete(packId) {
  return postNative({ type: CONTENT_PACK_MESSAGE.DELETE, packId });
}

const EVENT_NAME = 'pof-content-pack-native';

export function subscribeContentPackNativeEvents(handler) {
  const listener = (event) => {
    handler(event?.detail || {});
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/** Test/dev injection (Playwright, unit page). */
export function dispatchContentPackNativeEvent(detail) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}
