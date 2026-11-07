/**
 * Pure helpers for native shell game URL selection (bundled / cached / live).
 */

export const GAME_SOURCE_MODES = ['auto', 'bundled', 'live'];

export function compareSemver(a = '', b = '') {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

export function normalizeWebBuildMeta(raw = null) {
  if (!raw || typeof raw !== 'object') return null;
  const webVersion = String(raw.webVersion || '0.0.0').trim() || '0.0.0';
  const webBuildSha = String(raw.webBuildSha || '').trim();
  const webBuildStamp = String(raw.webBuildStamp || webBuildSha || '').trim();
  if (!webBuildStamp && !webBuildSha && !webVersion) return null;
  return { webVersion, webBuildSha, webBuildStamp };
}

export function compareWebBuild(a, b) {
  const left = normalizeWebBuildMeta(a);
  const right = normalizeWebBuildMeta(b);
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;
  const semverCmp = compareSemver(left.webVersion, right.webVersion);
  if (semverCmp !== 0) return semverCmp;
  const stampCmp = left.webBuildStamp.localeCompare(right.webBuildStamp);
  if (stampCmp !== 0) return stampCmp;
  return left.webBuildSha.localeCompare(right.webBuildSha);
}

export function isAtLeastBundled(candidate, bundled) {
  if (!bundled) return true;
  if (!candidate) return false;
  return compareWebBuild(candidate, bundled) >= 0;
}

export function shellGateAllowsLiveWeb(cfg, shellVersion) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (cfg.webKillSwitch || cfg.webDeployBlocked || cfg.forceBundledWeb || cfg.liveWebAllowed === false) {
    return false;
  }
  const minShell = String(cfg.minNativeShell || cfg.minShell || '').trim();
  if (minShell && compareSemver(shellVersion, minShell) < 0) return false;
  const requiredWeb = String(cfg.requiredWebVersion || cfg.minNativeShell || '').trim();
  const webVersion = String(cfg.webVersion || cfg.rollbackWebVersion || '').trim();
  if (requiredWeb && webVersion && compareSemver(webVersion, requiredWeb) < 0) return false;
  return true;
}

export function metaFromShellConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return null;
  return normalizeWebBuildMeta({
    webVersion: cfg.webVersion || cfg.rollbackWebVersion,
    webBuildSha: cfg.webBuildSha,
    webBuildStamp: cfg.webBuildStamp,
  });
}

export function mergeShellConfigs(primary, secondary) {
  const a = metaFromShellConfig(primary);
  const b = metaFromShellConfig(secondary);
  if (!a) return secondary;
  if (!b) return primary;
  return compareWebBuild(a, b) >= 0 ? primary : secondary;
}

export function liveUrlWithCacheBust(baseUrl, meta) {
  const root = String(baseUrl || '').trim().replace(/\/$/, '') || 'https://www.pantsonfire.app';
  const stamp = encodeURIComponent(
    String(meta?.webBuildStamp || meta?.webBuildSha || Date.now()).trim(),
  );
  return `${root}/?pof_build=${stamp}`;
}

/**
 * Pick bundled / cached / live for release auto mode.
 * Never returns live or cached older than bundled.
 */
export function pickAutoGameSource({
  bundledMeta,
  cachedMeta,
  liveMeta,
  liveAllowed,
  cachedIndexExists,
}) {
  const bundled = normalizeWebBuildMeta(bundledMeta);
  const cached =
    cachedIndexExists && isAtLeastBundled(cachedMeta, bundled) ? normalizeWebBuildMeta(cachedMeta) : null;
  const live =
    liveAllowed && isAtLeastBundled(liveMeta, bundled) ? normalizeWebBuildMeta(liveMeta) : null;

  const candidates = [];
  if (live) candidates.push({ kind: 'live', meta: live });
  if (cached) candidates.push({ kind: 'cached', meta: cached });
  if (bundled) candidates.push({ kind: 'bundled', meta: bundled });

  if (!candidates.length) {
    return { kind: 'bundled', meta: bundled, reason: 'fallback-bundled' };
  }

  candidates.sort((x, y) => compareWebBuild(y.meta, x.meta));
  const winner = candidates[0];
  return { kind: winner.kind, meta: winner.meta, reason: 'newest-compatible' };
}
