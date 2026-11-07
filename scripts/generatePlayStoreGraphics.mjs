#!/usr/bin/env node
/**
 * Generate Play Store raster assets under docs/store/graphics/.
 *
 * Text uses the real Chewy face via opentype.js → SVG path geometry, then Sharp.
 * (Embedded WOFF/WOFF2 in SVG is not reliably rasterized by Sharp/librsvg, so
 * text previously fell back to a generic serif — root cause of "wrong font".)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/store/graphics');
/** Authoritative TTF from google/fonts (Apache/chewy); matches bundled Chewy webfonts. */
const fontPath = path.join(root, 'public/assets/fonts/chewy/Chewy-Regular.ttf');
const logoPath = path.join(root, 'public/assets/ui/logos/main-logo.png');
const wallpaperHome = path.join(root, 'public/assets/ui/wallpapers/home-page.png');
const wallpaperGame = path.join(root, 'public/assets/ui/wallpapers/in-game.png');

const font = opentype.loadSync(fontPath);

/**
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {string[]} opts.lines
 * @param {number} [opts.fontSize]
 * @param {number} [opts.yStart] fraction of height for first line baseline region
 * @param {number} [opts.lineGap] fraction of height between baselines
 */
function chewyTextSvgLayer({
  width,
  height,
  lines,
  fontSize = 72,
  yStart = 0.42,
  lineGap = 0.12,
}) {
  const strokeWidth = Math.max(3, Math.round(fontSize * 0.14));
  const shadowDx = Math.max(3, Math.round(fontSize * 0.045));
  const shadowDy = Math.max(4, Math.round(fontSize * 0.06));

  const paths = [];
  lines.forEach((line, i) => {
    const lineCaps = String(line || '').toUpperCase();
    const p = font.getPath(lineCaps, 0, 0, fontSize);
    const bb = p.getBoundingBox();
    const pathW = bb.x2 - bb.x1;
    const offsetX = (width - pathW) / 2 - bb.x1;
    const yBaseline = height * (yStart + i * lineGap);
    const g = font.getPath(lineCaps, offsetX, yBaseline, fontSize);
    const d = g.toPathData(2);
    if (!d) return;
    // Drop shadow (soft dark offset) behind stroke+fill
    paths.push(
      `<path d="${d}" fill="#0d000d" fill-opacity="0.45" transform="translate(${shadowDx},${shadowDy})" />`,
    );
    paths.push(
      `<path d="${d}" fill="#ffe566" stroke="#120012" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke fill" />`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${paths.join('\n  ')}
</svg>`;
}

async function magentaGradient(width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff2da8"/>
        <stop offset="55%" stop-color="#b8007a"/>
        <stop offset="100%" stop-color="#1a0520"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function writeIcon() {
  const size = 512;
  const bg = await magentaGradient(size, size);
  const logo = await sharp(logoPath)
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), { fit: 'inside' })
    .png()
    .toBuffer();
  await sharp(bg)
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(outDir, 'icon-512.png'));
}

async function writeFeature() {
  const w = 1024;
  const h = 500;
  const bg = await magentaGradient(w, h);
  const logo = await sharp(logoPath).resize(280, 280, { fit: 'inside' }).png().toBuffer();
  const titleSvg = chewyTextSvgLayer({
    width: w,
    height: h,
    lines: ['PANTS ON FIRE', 'FIND THE LIAR'],
    fontSize: 64,
    yStart: 0.28,
  });
  const titlePng = await sharp(Buffer.from(titleSvg)).png().toBuffer();
  await sharp(bg)
    .composite([
      { input: logo, left: 48, top: Math.round((h - 280) / 2) },
      { input: titlePng, left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(outDir, 'feature-1024x500.png'));
}

async function writeScreenshot(filename, wallpaper, captionLines) {
  const w = 1080;
  const h = 1920;
  const wall = await sharp(wallpaper).resize(w, h, { fit: 'cover', position: 'centre' }).png().toBuffer();
  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="0" y="0" width="${w}" height="${h}" fill="rgba(0,0,0,0.35)"/>
  </svg>`;
  const overlay = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
  const captionSvg = chewyTextSvgLayer({
    width: w,
    height: h,
    lines: captionLines,
    fontSize: 56,
    yStart: 0.78,
  });
  const caption = await sharp(Buffer.from(captionSvg)).png().toBuffer();
  await sharp(wall)
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: caption, left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(outDir, filename));
}

async function verifyOutputs() {
  const expected = [
    ['icon-512.png', 512, 512],
    ['feature-1024x500.png', 1024, 500],
    ['screenshot-01-home.png', 1080, 1920],
    ['screenshot-02-ingame.png', 1080, 1920],
    ['screenshot-03-lobby.png', 1080, 1920],
  ];
  for (const [name, ew, eh] of expected) {
    const file = path.join(outDir, name);
    const meta = await sharp(file).metadata();
    if (meta.width !== ew || meta.height !== eh) {
      throw new Error(`${name}: expected ${ew}x${eh}, got ${meta.width}x${meta.height}`);
    }
  }
}

async function verifyChewyPixels() {
  // If Chewy failed to load, glyph paths would be empty or tiny — check a known string
  const p = font.getPath('gQy', 0, 0, 80);
  const bb = p.getBoundingBox();
  const w = bb.x2 - bb.x1;
  if (w < 20) throw new Error('Chewy font appears unloaded or degenerate (tiny bbox)');
  const svg = chewyTextSvgLayer({
    width: 400,
    height: 120,
    lines: ['Chewy'],
    fontSize: 72,
    yStart: 0.62,
  });
  const { data, info } = await sharp(Buffer.from(svg))
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  let yellow = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 200) continue;
    if (r > 200 && g > 180 && b < 120) yellow += 1;
  }
  if (yellow < 500) {
    throw new Error(`Expected Chewy yellow fill pixels in render, got ${yellow}`);
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  await verifyChewyPixels();
  await writeIcon();
  await writeFeature();
  await writeScreenshot('screenshot-01-home.png', wallpaperHome, ['Party game', 'Pass the phone']);
  await writeScreenshot('screenshot-02-ingame.png', wallpaperGame, ['Spot the liar', 'Themed hosts']);
  await writeScreenshot('screenshot-03-lobby.png', wallpaperGame, ['Online lobbies', 'Voice chat']);
  await verifyOutputs();
  console.log(`Wrote Play Store graphics to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
