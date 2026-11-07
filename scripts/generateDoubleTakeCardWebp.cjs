#!/usr/bin/env node
const path = require('node:path');
const sharp = require('sharp');

const CARD_DIR = path.resolve('public/assets/ui/cards');
const BASENAMES = ['double-take-back', 'double-take-front', 'double-take-liar-front'];

async function main() {
  for (const base of BASENAMES) {
    const pngPath = path.join(CARD_DIR, `${base}.png`);
    const webpPath = path.join(CARD_DIR, `${base}.webp`);
    await sharp(pngPath).webp({ quality: 88, effort: 4 }).toFile(webpPath);
    console.log('wrote', webpPath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
