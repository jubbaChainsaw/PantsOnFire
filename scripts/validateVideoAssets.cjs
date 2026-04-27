#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(repoRoot, 'public');

function toRelative(fullPath) {
  return path.relative(repoRoot, fullPath).split(path.sep).join('/');
}

function resolvePublicPath(publicLikePath) {
  const normalized = String(publicLikePath || '').trim();
  if (!normalized.startsWith('/')) return null;
  return path.join(publicRoot, normalized.replace(/^\/+/, ''));
}

function ensureFileExists(publicLikePath, errors, label) {
  const resolved = resolvePublicPath(publicLikePath);
  if (!resolved || !fs.existsSync(resolved)) {
    errors.push(`${label} missing: ${publicLikePath}`);
    return null;
  }
  return resolved;
}

function ensureWebmSiblingForMp4(publicLikePath, errors, label) {
  if (!String(publicLikePath || '').toLowerCase().endsWith('.mp4')) return;
  const webmPath = String(publicLikePath).slice(0, -4) + '.webm';
  const resolved = resolvePublicPath(webmPath);
  if (!resolved || !fs.existsSync(resolved)) {
    errors.push(`${label} webm sibling missing: ${webmPath}`);
  }
}

function walkFiles(rootDir, accumulator = []) {
  if (!fs.existsSync(rootDir)) return accumulator;
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, accumulator);
      continue;
    }
    if (entry.isFile()) accumulator.push(fullPath);
  }
  return accumulator;
}

function parseByteblitzVideoRefs(appJsPath) {
  const source = fs.readFileSync(appJsPath, 'utf8');
  const refs = new Set();
  const literalMatches = [...source.matchAll(/videoSrc:\s*'([^']+)'/g)];
  literalMatches.forEach((match) => {
    const value = String(match[1] || '').trim();
    if (value) refs.add(value);
  });
  const placeholderConstMatch = source.match(/const\s+BYTEBLITZ_VIDEO_PLACEHOLDER_SRC\s*=\s*'([^']+)'/);
  if (placeholderConstMatch?.[1]) refs.add(String(placeholderConstMatch[1]).trim());
  return [...refs];
}

function parseCoreVideoConstants(appJsPath) {
  const source = fs.readFileSync(appJsPath, 'utf8');
  const keys = ['INTRO_LOGO_VIDEO_SRC', 'FIRE_FRAME_VIDEO_SRC'];
  const refs = [];
  keys.forEach((key) => {
    const regex = new RegExp(`const\\s+${key}\\s*=\\s*'([^']+)'`);
    const match = source.match(regex);
    if (match?.[1]) refs.push(match[1]);
  });
  return refs;
}

function parseThemeHostTalkingVideos(themeAssetsPath) {
  const source = fs.readFileSync(themeAssetsPath, 'utf8');
  const objectMatch = source.match(/export const THEME_ASSETS\s*=\s*\{([\s\S]*?)\n\};/);
  const themeBlock = objectMatch?.[1] || source;
  const matches = [...themeBlock.matchAll(/^\s{2}(?:'([^']+)'|([A-Za-z][A-Za-z0-9]*))\s*:\s*\{/gm)];
  const themeNames = [...new Set(matches.map((match) => String(match[1] || match[2] || '').trim()).filter(Boolean))];
  return themeNames.map((themeName) => {
    const slug = String(themeName || 'default')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `/assets/videos/hosts/${slug}/talking-placeholder.mp4`;
  });
}

function lintVideoExtensionInventory(errors) {
  const videosRoot = path.join(publicRoot, 'assets', 'videos');
  const files = walkFiles(videosRoot);
  const mp4Files = files.filter((fullPath) => fullPath.toLowerCase().endsWith('.mp4'));
  mp4Files.forEach((fullPath) => {
    const webmSibling = fullPath.slice(0, -4) + '.webm';
    if (!fs.existsSync(webmSibling)) {
      errors.push(`webm sibling missing for ${toRelative(fullPath)}`);
    }
  });
}

function main() {
  const errors = [];
  const appJsPath = path.join(repoRoot, 'src', 'App.jsx');
  const themeAssetsPath = path.join(repoRoot, 'src', 'data', 'themeAssets.js');

  if (!fs.existsSync(appJsPath)) {
    console.error('[validateVideoAssets] Missing src/App.jsx');
    process.exit(1);
  }
  if (!fs.existsSync(themeAssetsPath)) {
    console.error('[validateVideoAssets] Missing src/data/themeAssets.js');
    process.exit(1);
  }

  const coreRefs = parseCoreVideoConstants(appJsPath);
  const byteblitzRefs = parseByteblitzVideoRefs(appJsPath);
  const hostTalkingRefs = parseThemeHostTalkingVideos(themeAssetsPath);
  const allRefs = [...new Set([...coreRefs, ...byteblitzRefs, ...hostTalkingRefs])];

  allRefs.forEach((publicLikePath) => {
    const label = `video reference ${publicLikePath}`;
    const resolved = ensureFileExists(publicLikePath, errors, label);
    if (!resolved) return;
    ensureWebmSiblingForMp4(publicLikePath, errors, label);
  });

  lintVideoExtensionInventory(errors);

  if (errors.length) {
    console.error('[validateVideoAssets] Validation failed:');
    errors.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }

  console.log(`[validateVideoAssets] OK (${allRefs.length} references validated)`);
}

main();
