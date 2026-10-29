/**
 * Shell ↔ live web compatibility and emergency rollback controls.
 * Served from the lobby API; mirrored in public/shell-version.json for static fallback.
 */

export function getShellConfig() {
  const minNativeShell = String(process.env.POF_MIN_NATIVE_SHELL || '0.1.0').trim() || '0.1.0';
  const webVersion = String(process.env.POF_WEB_VERSION || '0.1.0').trim() || '0.1.0';
  const requiredWebVersion = String(
    process.env.POF_REQUIRED_WEB_VERSION || minNativeShell,
  ).trim();
  const rollbackWebVersion = String(process.env.POF_ROLLBACK_WEB_VERSION || '').trim() || null;
  const webKillSwitch = ['1', 'true', 'yes'].includes(
    String(process.env.POF_WEB_KILL_SWITCH || '').trim().toLowerCase(),
  );
  const webDeployBlocked = ['1', 'true', 'yes'].includes(
    String(process.env.POF_WEB_DEPLOY_BLOCKED || '').trim().toLowerCase(),
  );
  const forceBundledWeb = ['1', 'true', 'yes'].includes(
    String(process.env.POF_FORCE_BUNDLED_WEB || '').trim().toLowerCase(),
  );

  return {
    minNativeShell,
    requiredWebVersion,
    webVersion: rollbackWebVersion || webVersion,
    rollbackWebVersion,
    webKillSwitch,
    webDeployBlocked,
    forceBundledWeb,
    liveWebAllowed: !webKillSwitch && !webDeployBlocked && !forceBundledWeb,
    notes:
      'Native shell must be >= minNativeShell and compatible with requiredWebVersion to load live web. When liveWebAllowed is false, shells should use bundled offline web.',
  };
}
