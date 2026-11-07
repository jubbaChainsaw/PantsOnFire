#!/usr/bin/env node
/**
 * One-time rename: *-18 → *-classic (default), plain prompt-* → *-alt.
 * Run: node scripts/renameThemeCardStyleFiles.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const THEMES_DIR = path.resolve('public/assets/themes');

const RENAMES = [
  ['prompt-front-18.png', 'prompt-front-classic.png'],
  ['prompt-back-18.png', 'prompt-back-classic.png'],
  ['prompt-front-18.webp', 'prompt-front-classic.webp'],
  ['prompt-back-18.webp', 'prompt-back-classic.webp'],
  ['prompt-front.png', 'prompt-front-alt.png'],
  ['prompt-back.png', 'prompt-back-alt.png'],
  ['prompt-front.webp', 'prompt-front-alt.webp'],
  ['prompt-back.webp', 'prompt-back-alt.webp'],
];

function main() {
  let count = 0;
  for (const slug of fs.readdirSync(THEMES_DIR)) {
    const cardsDir = path.join(THEMES_DIR, slug, 'cards');
    if (!fs.existsSync(cardsDir)) continue;
    for (const [from, to] of RENAMES) {
      const src = path.join(cardsDir, from);
      const dest = path.join(cardsDir, to);
      if (!fs.existsSync(src)) continue;
      if (fs.existsSync(dest)) {
        console.warn('skip (dest exists)', dest);
        continue;
      }
      fs.renameSync(src, dest);
      count += 1;
    }
  }
  console.log(`Renamed ${count} theme card files.`);
}

main();
