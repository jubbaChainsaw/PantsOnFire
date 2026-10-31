#!/usr/bin/env node
/**
 * Post-process Vite dist-android: keep Default theme only, drop unused round assets,
 * prefer WebP rasters, downscale large images for mobile display sizes.
 */
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const distDir = path.resolve(process.argv[2] || 'dist-android');
const themesRoot = path.join(distDir, 'assets/themes');

const KEEP_THEME_SLUGS = new Set(['default']);
const REMOVE_THEME_SLUGS = new Set(['grillem', 'grill-em']);

const MAX_PERSONA = 512;
const MAX_CARD = 768;
const MAX_BG = 1280;

const REQUIRED_POF_FONT_FILES = [
  'PantsOnFireNarrow-Regular.woff2',
  'PantsOnFireNarrow-Regular.ttf',
];

function rewriteCssRootAbsoluteAssetUrls(distDir) {
  const assetsCssDir = path.join(distDir, 'assets');
  for (const file of walkFiles(distDir)) {
    if (!file.endsWith('.css')) continue;
    if (path.dirname(file) !== assetsCssDir) continue;
    const text = readFileSync(file, 'utf8');
    const updated = text
      .replace(/url\(\s*\/assets\//g, 'url(./')
      .replace(/url\(\s*"\/assets\//g, 'url("./')
      .replace(/url\(\s*'\/assets\//g, "url('./");
    if (updated !== text) writeFileSync(file, updated);
  }
}

function assertRequiredBundledFonts(distDir) {
  const fontDir = path.join(distDir, 'assets/fonts/pants-on-fire');
  const missing = REQUIRED_POF_FONT_FILES.filter(
    (name) => !existsSync(path.join(fontDir, name)),
  );
  if (missing.length) {
    console.error(
      `Missing PoF font files in dist (add under public/assets/fonts/pants-on-fire): ${missing.join(', ')}`,
    );
    process.exit(1);
  }
}

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

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

function classifyMaxDim(relPath) {
  const lower = relPath.toLowerCase();
  if (lower.includes('/personas/') || lower.includes('/hosts/persona-host')) return MAX_PERSONA;
  if (lower.includes('/cards/') || lower.includes('card-style')) return MAX_CARD;
  if (lower.includes('/backgrounds/') || lower.includes('/ui/banner')) return MAX_BG;
  if (lower.endsWith('.webp') || lower.endsWith('.png') || lower.endsWith('.jpg')) return MAX_BG;
  return null;
}

async function optimizeRaster(filePath) {
  const rel = path.relative(distDir, filePath);
  const maxDim = classifyMaxDim(rel);
  if (!maxDim) return { before: statSync(filePath).size, after: statSync(filePath).size };

  const before = statSync(filePath).size;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp') {
    const img = sharp(filePath);
    const meta = await img.metadata();
    if ((meta.width || 0) <= maxDim && (meta.height || 0) <= maxDim) {
      return { before, after: before };
    }
    const buf = await img
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    writeFileSync(filePath, buf);
    return { before, after: buf.length };
  }
  if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');
    const buf = await sharp(filePath)
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    writeFileSync(webpPath, buf);
    rmSync(filePath, { force: true });
    return { before, after: buf.length, converted: true };
  }
  return { before, after: before };
}

function dirSizeBytes(root) {
  let total = 0;
  for (const file of walkFiles(root)) {
    total += statSync(file).size;
  }
  return total;
}

async function main() {
  if (!existsSync(distDir)) {
    console.error(`Missing dist: ${distDir}`);
    process.exit(1);
  }

  const beforeBytes = dirSizeBytes(distDir);
  let removedThemes = 0;

  if (existsSync(themesRoot)) {
    for (const slug of readdirSync(themesRoot)) {
      if (REMOVE_THEME_SLUGS.has(slug)) {
        rmSync(path.join(themesRoot, slug), { recursive: true, force: true });
        removedThemes += 1;
        continue;
      }
      if (!KEEP_THEME_SLUGS.has(slug)) {
        rmSync(path.join(themesRoot, slug), { recursive: true, force: true });
        removedThemes += 1;
      }
    }
  }

  let mediaBytesRemoved = 0;
  for (const file of walkFiles(distDir)) {
    if (!/\.(mp4|webm|mov)$/i.test(file)) continue;
    try {
      mediaBytesRemoved += statSync(file).size;
      rmSync(file, { force: true });
    } catch {
      /* ignore */
    }
  }

  const grillRound = path.join(distDir, 'assets/images/round-types/grill-logo.svg');
  if (existsSync(grillRound)) rmSync(grillRound, { force: true });

  let grillAudioBytesRemoved = 0;
  for (const file of walkFiles(distDir)) {
    if (!/stinger_grill/i.test(path.basename(file))) continue;
    try {
      grillAudioBytesRemoved += statSync(file).size;
      rmSync(file, { force: true });
    } catch {
      /* ignore */
    }
  }

  let rasterBefore = 0;
  let rasterAfter = 0;
  let pngDropped = 0;
  const files = walkFiles(distDir);
  for (const file of files) {
    if (!/\.(webp|png|jpe?g)$/i.test(file)) continue;
    const result = await optimizeRaster(file);
    rasterBefore += result.before;
    rasterAfter += result.after;
    if (result.converted) pngDropped += 1;
  }

  for (const file of walkFiles(distDir)) {
    if (!file.endsWith('.png')) continue;
    const webp = file.replace(/\.png$/i, '.webp');
    if (existsSync(webp)) {
      rmSync(file, { force: true });
      pngDropped += 1;
    }
  }

  rewriteCssRootAbsoluteAssetUrls(distDir);
  assertRequiredBundledFonts(distDir);

  const afterBytes = dirSizeBytes(distDir);
  const requiredFlameBasenames = ['flame-4', 'flame-6', 'flame-7', 'flame-8', 'flame-9'];
  const missingFlames = requiredFlameBasenames.filter((base) => {
    const png = path.join(distDir, 'assets/images/flames', `${base}.png`);
    const webp = path.join(distDir, 'assets/images/flames', `${base}.webp`);
    return !existsSync(png) && !existsSync(webp);
  });
  if (missingFlames.length) {
    console.error(`Missing card flame assets after trim: ${missingFlames.join(', ')}`);
    process.exit(1);
  }

  const report = {
    distDir,
    beforeBytes,
    afterBytes,
    removedThemeFolders: removedThemes,
    rasterBefore,
    rasterAfter,
    pngDuplicatesRemoved: pngDropped,
    mediaBytesRemoved,
    grillAudioBytesRemoved,
    sha256: await sha256File(path.join(distDir, 'index.html')).catch(() => null),
  };
  writeFileSync(path.join(distDir, 'mobile-trim-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
