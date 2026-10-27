#!/usr/bin/env node
/**
 * Installs release APK on a headless emulator, captures screenshot + logcat snippet.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const apk =
  process.argv[2] ||
  path.join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const outDir =
  process.argv[3] || path.join(root, 'artifacts/android-emulator-smoke');
const avdName = process.env.POF_AVD_NAME || 'pof_api35_x86_64';
const pkg = 'app.pantsonfire.liar';

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

function runSilent(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
}

if (!sdk) {
  console.error('ANDROID_HOME not set');
  process.exit(1);
}
if (!fs.existsSync(apk)) {
  console.error('APK missing:', apk);
  process.exit(1);
}

const adb = path.join(sdk, 'platform-tools/adb');
const emulator = path.join(sdk, 'emulator/emulator');

fs.mkdirSync(outDir, { recursive: true });

function devices() {
  const out = runSilent(`"${adb}" devices`);
  return out
    .split('\n')
    .slice(1)
    .map((l) => l.trim().split('\t')[0])
    .filter((id) => id && id !== 'offline');
}

if (devices().length === 0) {
  console.log('Starting emulator', avdName);
  spawnSync(
    emulator,
    [
      '-avd',
      avdName,
      '-no-window',
      '-no-audio',
      '-no-boot-anim',
      '-gpu',
      'swiftshader_indirect',
      '-accel',
      'off',
    ],
    {
    detached: true,
    stdio: 'ignore',
  });
  runSilent(`"${adb}" wait-for-device`);
  for (let i = 0; i < 90; i++) {
    const boot = runSilent(`"${adb}" shell getprop sys.boot_completed`).trim();
    if (boot === '1') break;
    execSync('sleep 2');
  }
}

run(`"${adb}" install -r "${apk}"`, { silent: true });
runSilent(`"${adb}" logcat -c`);
runSilent(
  `"${adb}" shell am start -n ${pkg}/.MainActivity`,
);

const sleep = (s) => execSync(`sleep ${s}`);
sleep(4);

// Tap intro skip if visible (bottom-right area, portrait)
try {
  runSilent(`"${adb}" shell input tap 620 1180`);
  sleep(2);
} catch {
  /* ignore */
}

sleep(5);

const pngPath = path.join(outDir, 'neon-home-emulator.png');
const png = runSilent(`"${adb}" exec-out screencap -p`);
fs.writeFileSync(pngPath, png);

const logPath = path.join(outDir, 'logcat-webview.txt');
const log = runSilent(
  `"${adb}" logcat -d -t 400 | grep -iE 'WebView|chromium|Console|ReactNative|pantsonfire|file://|AndroidRuntime' || true`,
);
fs.writeFileSync(logPath, log);

const size = fs.statSync(png).length;
console.log('Screenshot:', pngPath, `(${Math.round(size / 1024)} KiB)`);
console.log('Logcat snippet:', logPath);

if (size < 8000) {
  console.error('Screenshot too small — emulator may have failed');
  process.exit(1);
}

if (/FATAL EXCEPTION|Unable to load script/i.test(log)) {
  console.error('Fatal errors in logcat');
  process.exit(1);
}
