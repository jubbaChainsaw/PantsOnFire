import { NATIVE_DLC_ASSET_ORIGIN } from './constants.js';
import { publicAssetUrl, resolveBundledAssetSrcCore } from '../publicAssetUrl.js';

/** @type {Set<string>} */
let installedPackIds = new Set();

/** @type {Map<string, string>} themeSlug -> packId */
let themeSlugToPackId = new Map();

export function setContentPackInstallRegistry({
  installedIds = [],
  slugToPackId = {},
} = {}) {
  installedPackIds = new Set(installedIds);
  themeSlugToPackId = new Map(Object.entries(slugToPackId));
}

export function getInstalledContentPackIds() {
  return [...installedPackIds];
}

function extractThemeSlugFromAssetPath(normalizedPath) {
  const match = normalizedPath.match(/^\/?assets\/themes\/([^/]+)\//i);
  return match ? match[1] : null;
}

/**
 * When a theme pack is installed on device, serve from WebViewAssetLoader /dlc/ path.
 */
export function resolveBundledAssetSrc(src = '') {
  const base = resolveBundledAssetSrcCore(src);
  if (!base || installedPackIds.size === 0) return base;

  const pathOnly = base.replace(/^https?:\/\/[^/]+/i, '');
  const slug = extractThemeSlugFromAssetPath(pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`);
  if (!slug) return base;

  const packId = themeSlugToPackId.get(slug);
  if (!packId || !installedPackIds.has(packId)) return base;

  const rel = pathOnly.replace(/^\//, '');
  const dlcUrl = `${NATIVE_DLC_ASSET_ORIGIN}${packId}/${rel}`;
  return dlcUrl;
}

export function resolvePublicThemeAsset(relativeUnderAssets = '') {
  return resolveBundledAssetSrc(publicAssetUrl(relativeUnderAssets));
}
