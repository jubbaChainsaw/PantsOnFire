#!/usr/bin/env node
/**
 * Convert a white-background game mode logo JPG/PNG into a 768×768 transparent PNG + WebP.
 *
 * Usage: node scripts/process-game-mode-logo.cjs <input> <outputBasename>
 * Example: node scripts/process-game-mode-logo.cjs uploads/foo.jpg twotruths
 * Writes public/assets/ui/game-modes/<basename>.png and .webp
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const SIZE = 768;
const WHITE_THRESHOLD = 248;
const EDGE_SOFTNESS = 18;

async function removeNearWhiteBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    if (min >= WHITE_THRESHOLD && max - min <= 12) {
      data[i + 3] = 0;
      continue;
    }
    if (avg >= WHITE_THRESHOLD - EDGE_SOFTNESS) {
      const t = (WHITE_THRESHOLD - avg) / EDGE_SOFTNESS;
      const alpha = Math.round(Math.max(0, Math.min(1, t)) * 255);
      data[i + 3] = Math.min(data[i + 3], alpha);
    }
  }
  return sharp(data, { raw: { width, height, channels } });
}

async function processLogo(inputPath, baseName) {
  const outDir = path.join(root, 'public/assets/ui/game-modes');
  fs.mkdirSync(outDir, { recursive: true });
  const pngOut = path.join(outDir, `${baseName}.png`);
  const webpOut = path.join(outDir, `${baseName}.webp`);

  const keyed = await removeNearWhiteBackground(fs.readFileSync(inputPath));
  const fitted = await keyed
    .resize(SIZE, SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp(fitted).toFile(pngOut);
  await sharp(fitted).webp({ quality: 82, effort: 4 }).toFile(webpOut);

  const meta = await sharp(pngOut).metadata();
  console.log(
    `Wrote ${path.relative(root, pngOut)} (${meta.width}×${meta.height}) + webp`,
  );
}

async function main() {
  const input = process.argv[2];
  const baseName = process.argv[3];
  if (!input || !baseName) {
    console.error('Usage: node scripts/process-game-mode-logo.cjs <input> <basename>');
    process.exit(1);
  }
  const abs = path.isAbsolute(input) ? input : path.join(root, input);
  if (!fs.existsSync(abs)) {
    console.error('Input not found:', abs);
    process.exit(1);
  }
  await processLogo(abs, baseName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
