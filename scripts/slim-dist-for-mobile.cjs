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

/** Strip heavy theme art from non-default packs but keep store thumbnails (`ui/banner`). */
const THEME_STRIP_SUBDIRS = new Set([
  'hosts',
  'cards',
  'personas',
  'icons',
  'audio',
]);

const themesDir = path.join(dist, 'assets/themes');
if (fs.existsSync(themesDir)) {
  for (const name of fs.readdirSync(themesDir)) {
    const themePath = path.join(themesDir, name);
    if (!fs.existsSync(themePath) || !fs.statSync(themePath).isDirectory()) continue;
    if (CORE_THEME_DIRS.has(name)) continue;
    for (const sub of fs.readdirSync(themePath)) {
      if (!THEME_STRIP_SUBDIRS.has(sub)) continue;
      const abs = path.join(themePath, sub);
      removedBytes += statSize(abs);
      rmrf(abs);
      console.log(`Stripped themes/${name}/${sub}`);
    }
  }
}

function isBundledDefaultHostMedia(file) {
  const normalized = file.split(path.sep).join('/');
  return normalized.includes('/assets/themes/default/hosts/');
}

walk(dist, (file) => {
  const base = path.basename(file).toLowerCase();
  if (
    base.includes('persona-host-talk-') &&
    base.endsWith('.png') &&
    !isBundledDefaultHostMedia(file)
  ) {
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
  if (
    (base.endsWith('.mp4') || base.endsWith('.webm')) &&
    !isBundledDefaultHostMedia(file)
  ) {
    removedBytes += statSize(file);
    fs.unlinkSync(file);
    removedFiles += 1;
  }
});

const KEEP_PANTS_ON_FIRE_FONT_FILES = new Set([
  'PoFDisplay-Narrow-Regular.woff2',
  'PoFDisplay-Narrow-Regular.ttf',
  'README.md',
]);

const fontsDir = path.join(dist, 'assets/fonts/pants-on-fire');
if (fs.existsSync(fontsDir)) {
  for (const name of fs.readdirSync(fontsDir)) {
    if (KEEP_PANTS_ON_FIRE_FONT_FILES.has(name)) continue;
    const abs = path.join(fontsDir, name);
    if (fs.statSync(abs).isDirectory()) {
      if (name === 'derived') {
        rmrf(abs);
        console.log('Removed fonts/pants-on-fire/derived from mobile bundle');
      }
      continue;
    }
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
