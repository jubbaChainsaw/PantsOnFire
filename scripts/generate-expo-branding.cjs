#!/usr/bin/env node
/**
 * Generates Expo icon, adaptive icon, and splash from the main game logo.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const logoCandidates = [
  path.join(root, 'public/assets/ui/logos/main-logo.png'),
  path.join(root, 'public/assets/ui/neon/logo.png'),
  path.join(root, 'public/assets/images/logo.png'),
];

const logoPath = logoCandidates.find((p) => fs.existsSync(p));
if (!logoPath) {
  console.error('No logo PNG found');
  process.exit(1);
}

const outDir = path.join(root, 'assets');
fs.mkdirSync(outDir, { recursive: true });

async function squareIcon(size, outFile, padding = 0.12) {
  const inner = Math.round(size * (1 - padding * 2));
  const resized = await sharp(logoPath)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 18, g: 0, b: 56, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toFile(outFile);
}

(async () => {
  await squareIcon(1024, path.join(outDir, 'icon.png'), 0.1);
  await squareIcon(1024, path.join(outDir, 'adaptive-icon.png'), 0.18);
  await squareIcon(1284, path.join(outDir, 'splash-icon.png'), 0.08);
  console.log('Generated Expo branding from', path.relative(root, logoPath));
})();
