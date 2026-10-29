/** Android WebViewAssetLoader path for unpacked DLC (see scripts/patch-rn-webview-asset-loader.mjs). */
export const NATIVE_DLC_ASSET_ORIGIN = 'https://appassets.androidplatform.net/dlc/';

export const CONTENT_PACK_STORAGE_KEYS = {
  promptDismissed: 'pof-content-packs-prompt-dismissed-v1',
  installedMeta: 'pof-content-packs-installed-meta-v1',
};

export const CONTENT_PACK_MESSAGE = {
  LIST: 'POF_CONTENT_PACK_LIST',
  LIST_RESULT: 'POF_CONTENT_PACK_LIST_RESULT',
  DOWNLOAD: 'POF_CONTENT_PACK_DOWNLOAD',
  CANCEL: 'POF_CONTENT_PACK_CANCEL',
  DELETE: 'POF_CONTENT_PACK_DELETE',
  PROGRESS: 'POF_CONTENT_PACK_PROGRESS',
  STATE: 'POF_CONTENT_PACK_STATE',
  ERROR: 'POF_CONTENT_PACK_ERROR',
};

const viteManifestUrl =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CONTENT_PACK_MANIFEST_URL : '';

export const DEFAULT_MANIFEST_URL =
  (viteManifestUrl && String(viteManifestUrl).trim()) ||
  './content-packs/public/manifest.json';
