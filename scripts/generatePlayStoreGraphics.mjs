#!/usr/bin/env node
/**
 * Generate Play Store raster assets under docs/store/graphics/.
 * Uses Chewy font with dark stroke (app neon style). Safe to re-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/store/graphics');
const fontPath = path.join(root, 'public/assets/fonts/chewy/Chewy-Regular.woff2');
const logoPath = path.join(root, 'public/assets/ui/logos/main-logo.png');
const wallpaperHome = path.join(root, 'public/assets/ui/wallpapers/home-page.png');
const wallpaperGame = path.join(root, 'public/assets/ui/wallpapers/in-game.png');

const fontB64 = fs.readFileSync(fontPath).toString('base64');

function outlinedTextSvg({ width, height, lines, fontSize = 72, yStart = 0.42 }) {
  const textBlocks = lines
    .map((line, i) => {
      const y = height * (yStart + i * 0.12);
      return `<text x="50%" y="${y}" text-anchor="middle" class="chewy">${escapeXml(line)}</text>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'Chewy';
        src: url('data:font/woff2;base64,${fontB64}') format('woff2');
      }
      .chewy {
        font-family: 'Chewy', cursive;
        font-size: ${fontSize}px;
        fill: #ffe566;
        stroke: #120012;
        stroke-width: ${Math.max(4, Math.round(fontSize * 0.12))}px;
        paint-order: stroke fill;
      }
    </style>
  </defs>
  ${textBlocks}
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const titleSvg = outlinedTextSvg({
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
  const captionSvg = outlinedTextSvg({
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

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  await writeIcon();
  await writeFeature();
  await writeScreenshot('screenshot-01-home.png', wallpaperHome, ['Party game', 'Pass the phone']);
  await writeScreenshot('screenshot-02-ingame.png', wallpaperGame, ['Spot the liar', 'Themed hosts']);
  await writeScreenshot('screenshot-03-lobby.png', wallpaperGame, ['Online lobbies', 'Voice chat']);
  console.log(`Wrote Play Store graphics to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
