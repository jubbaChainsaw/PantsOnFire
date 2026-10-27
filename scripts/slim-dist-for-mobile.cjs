#!/usr/bin/env node
/**
 * Shrinks dist/ before bundling into the Android APK (offline WebView).
 * Drops host videos, optional DLC theme art, heavy audio packs, and source maps.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

/** Offline APK ships one full theme pack plus shared UI; other themes load when playing online or after a slimmer art CDN ships. */
const CORE_THEME_DIRS = new Set(['default']);

const DROP_TOP_LEVEL = [
  'assets/graphic-packs',
  'assets/host-generation',
  'assets/audio/host',
  'assets/new-ui',
];

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, onFile);
    else onFile(p);
  }
}

let removedFiles = 0;
let removedBytes = 0;

function statSize(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return 0;
  }
}

if (!fs.existsSync(dist)) {
  console.error('dist/ missing — run npm run build first');
  process.exit(1);
}

for (const rel of DROP_TOP_LEVEL) {
  const abs = path.join(dist, rel);
  const size = fs.existsSync(abs) ? statSize(abs) : 0;
  rmrf(abs);
  if (size) {
    removedBytes += size;
    console.log(`Removed ${rel}`);
  }
}

const themesDir = path.join(dist, 'assets/themes');
if (fs.existsSync(themesDir)) {
  for (const name of fs.readdirSync(themesDir)) {
    if (!CORE_THEME_DIRS.has(name)) {
      const abs = path.join(themesDir, name);
      removedBytes += statSize(abs);
      rmrf(abs);
      console.log(`Removed theme assets: ${name}`);
    }
  }
}

walk(dist, (file) => {
  const base = path.basename(file).toLowerCase();
  if (base.includes('persona-host-talk-') && base.endsWith('.png')) {
    removedBytes += statSize(file);
    fs.unlinkSync(file);
    removedFiles += 1;
    return;
  }
  if (file.includes('/fonts/pants-on-fire/source')) {
    removedBytes += statSize(file);
    fs.unlinkSync(file);
    removedFiles += 1;
    return;
  }
  if (base.endsWith('.map')) {
    removedBytes += statSize(file);
    fs.unlinkSync(file);
    removedFiles += 1;
    return;
  }
  if (base.endsWith('.mp4') || base.endsWith('.webm')) {
    removedBytes += statSize(file);
    fs.unlinkSync(file);
    removedFiles += 1;
  }
});

const fontsDir = path.join(dist, 'assets/fonts/pants-on-fire');
if (fs.existsSync(fontsDir)) {
  for (const name of fs.readdirSync(fontsDir)) {
    if (name === 'PantsOnFireNarrow-Regular.woff2') continue;
    if (name === 'README.md') continue;
    const abs = path.join(fontsDir, name);
    if (fs.statSync(abs).isFile()) {
      removedBytes += statSize(abs);
      fs.unlinkSync(abs);
      removedFiles += 1;
    }
  }
}

console.log(
  `Slim complete: dropped ${removedFiles} files, ~${(removedBytes / 1024 / 1024).toFixed(1)} MiB`,
);
