import * as FileSystem from 'expo-file-system/legacy';

const CACHE_ROOT = `${FileSystem.documentDirectory}pof-cached-web/`;
const CACHE_META_PATH = `${CACHE_ROOT}cache-meta.json`;
const CACHE_INDEX = `${CACHE_ROOT}index.html`;
const PREFS_PATH = `${FileSystem.documentDirectory}pof-shell-prefs.json`;

export const BUNDLED_BUILD_STAMP_URI = 'file:///android_asset/pof-web/build-stamp.json';

export async function readShellPrefs() {
  try {
    const info = await FileSystem.getInfoAsync(PREFS_PATH);
    if (!info.exists) return { gameSourceMode: 'auto' };
    const raw = await FileSystem.readAsStringAsync(PREFS_PATH);
    const parsed = JSON.parse(raw);
    const mode = String(parsed?.gameSourceMode || 'auto').trim().toLowerCase();
    return {
      gameSourceMode: mode === 'bundled' || mode === 'live' ? mode : 'auto',
    };
  } catch {
    return { gameSourceMode: 'auto' };
  }
}

export async function writeShellPrefs(partial) {
  const current = await readShellPrefs();
  const next = { ...current, ...partial };
  await FileSystem.writeAsStringAsync(PREFS_PATH, JSON.stringify(next));
  return next;
}

export async function fetchJson(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function readBundledBuildMeta() {
  const fromAsset = await fetchJson(`${BUNDLED_BUILD_STAMP_URI}?t=${Date.now()}`);
  if (fromAsset) return fromAsset;
  return null;
}

export async function readCachedBuildMeta() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_META_PATH);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(CACHE_META_PATH);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cachedIndexExists() {
  const info = await FileSystem.getInfoAsync(CACHE_INDEX);
  return Boolean(info.exists);
}

export function cachedGameUri() {
  return `${CACHE_INDEX}?t=${Date.now()}`;
}

export async function syncCachedWebFromLive({ productionBaseUrl, liveMeta }) {
  const base = String(productionBaseUrl || '').trim().replace(/\/$/, '');
  if (!base || !liveMeta) return false;
  const bust = encodeURIComponent(liveMeta.webBuildStamp || liveMeta.webBuildSha || Date.now());
  const manifest = await fetchJson(`${base}/web-offline-manifest.json?pof_build=${bust}`, 12000);
  if (!manifest?.files?.length) return false;

  await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true });
  await FileSystem.makeDirectoryAsync(CACHE_ROOT, { intermediates: true });

  for (const row of manifest.files) {
    const rel = String(row.path || '').replace(/^\//, '');
    if (!rel || rel.includes('..')) continue;
    const target = `${CACHE_ROOT}${rel}`;
    const slash = target.lastIndexOf('/');
    if (slash > 0) {
      await FileSystem.makeDirectoryAsync(target.slice(0, slash), { intermediates: true });
    }
    const url = `${base}/${rel}?pof_build=${bust}`;
    await FileSystem.downloadAsync(url, target);
  }

  await FileSystem.writeAsStringAsync(
    CACHE_META_PATH,
    JSON.stringify({
      ...liveMeta,
      cachedAt: new Date().toISOString(),
    }),
  );
  return true;
}
