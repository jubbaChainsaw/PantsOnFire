#!/usr/bin/env node
/**
 * Ensure bundled static assets referenced from dist-android resolve on disk.
 * Scoped for the slim APK bundle: Default theme + shared UI/fonts/images;
 * skips DLC theme paths still present as catalog strings in JS.
 *
 * Usage: node scripts/verifyDistAndroidAssets.mjs [distDir]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.argv[2] || 'dist-android');

const SCAN_EXT = new Set(['.html', '.css', '.js']);
const STRIPPED_MEDIA = /\.(mp4|webm|mov)$/i;
const NON_BUNDLED_THEME = /^assets\/themes\/(?!default(?:\/|$))[^/]+/i;

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function decodeRef(ref) {
  try {
    return decodeURIComponent(ref);
  } catch {
    return ref;
  }
}

function extractCssAndHtmlRefs(text) {
  const refs = [];
  const patterns = [
    /url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi,
    /(?:src|href)=['"]([^'"]+)['"]/gi,
  ];
  for (const re of patterns) {
    let match;
    while ((match = re.exec(text)) !== null) {
      const raw = match[1]?.trim();
      if (raw) refs.push(raw);
    }
  }
  return refs;
}

/** String literals in JS that look like app asset paths (avoids minified noise). */
function extractJsAssetLiterals(text) {
  const refs = [];
  const re =
    /(["'`])(\/assets\/[a-zA-Z0-9_./%-]+|(?:\.\/)?assets\/[a-zA-Z0-9_./%-]+)\1/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    refs.push(match[2]);
  }
  return refs;
}

function shouldVerifyBundledRef(ref) {
  const r = decodeRef(ref.split(/[?#]/)[0].trim());
  if (!r || /^https?:|^data:|^blob:|^#|^javascript:/i.test(r)) return false;
  if (STRIPPED_MEDIA.test(r)) return false;

  const normalized = r.replace(/^\.\//, '').replace(/^\//, '');
  if (NON_BUNDLED_THEME.test(normalized)) return false;
  if (normalized.includes('round-types/grill-logo')) return false;
  if (normalized.startsWith('assets/sfx/')) return false;
  return /^(assets\/|\.\.\/assets\/)/.test(r) || r.startsWith('/assets/');
}

function resolveCandidate(distRoot, fromFile, ref) {
  let r = decodeRef(ref.split(/[?#]/)[0].trim());
  if (!shouldVerifyBundledRef(ref)) return null;

  if (r.startsWith('./') || r.startsWith('../')) {
    return path.normalize(path.join(path.dirname(fromFile), r));
  }
  if (r.startsWith('/assets/')) {
    return path.join(distRoot, r.slice(1));
  }
  if (r.startsWith('assets/')) {
    return path.join(distRoot, r);
  }
  return null;
}

function resolveOnDisk(absPath) {
  if (existsSync(absPath)) return absPath;
  const ext = path.extname(absPath).toLowerCase();
  if (/\.(png|jpe?g)$/i.test(ext)) {
    const webp = absPath.replace(/\.(png|jpe?g)$/i, '.webp');
    if (existsSync(webp)) return webp;
  }
  return null;
}

function recordRef(refsMap, ref, fromFile, distRoot) {
  const abs = resolveCandidate(distRoot, fromFile, ref);
  if (!abs || !abs.startsWith(distRoot)) return;
  const key = decodeRef(ref.split(/[?#]/)[0].trim());
  const list = refsMap.get(key) || { sources: new Set(), abs };
  list.sources.add(path.relative(distRoot, fromFile));
  refsMap.set(key, list);
}

function main() {
  if (!existsSync(distDir)) {
    console.error(`Missing dist directory: ${distDir}`);
    process.exit(1);
  }

  const refsMap = new Map();

  for (const file of walkFiles(distDir)) {
    const ext = path.extname(file).toLowerCase();
    if (!SCAN_EXT.has(ext)) continue;

    const text = readFileSync(file, 'utf8');
    const refs =
      ext === '.js'
        ? extractJsAssetLiterals(text)
        : extractCssAndHtmlRefs(text);

    for (const ref of refs) {
      recordRef(refsMap, ref, file, distDir);
    }
  }

  const missing = [];
  for (const [ref, { sources, abs }] of refsMap) {
    if (!resolveOnDisk(abs)) {
      missing.push({ ref, sources: [...sources] });
    }
  }

  if (missing.length) {
    console.error(
      `FAIL: ${missing.length} unresolved bundled asset reference(s) in ${distDir}`,
    );
    for (const { ref, sources } of missing.sort((a, b) =>
      a.ref.localeCompare(b.ref),
    )) {
      console.error(`  ${ref}`);
      for (const src of sources.slice(0, 4)) console.error(`    cited in ${src}`);
      if (sources.length > 4) {
        console.error(`    … and ${sources.length - 4} more`);
      }
    }
    process.exit(1);
  }

  console.log(
    `OK: ${refsMap.size} bundled asset reference(s) resolve under ${distDir}`,
  );
}

main();
