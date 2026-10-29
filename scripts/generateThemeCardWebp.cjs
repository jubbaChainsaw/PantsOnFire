/**
 * Create .webp siblings for themed prompt card PNGs (mobile VITE_UI_RASTER_EXT=webp).
 * Usage: node scripts/generateThemeCardWebp.cjs
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const THEMES_DIR = path.resolve('public/assets/themes');

async function listCardPngs() {
  const slugs = await fs.readdir(THEMES_DIR, { withFileTypes: true });
  const files = [];
  for (const entry of slugs) {
    if (!entry.isDirectory()) continue;
    const cardsDir = path.join(THEMES_DIR, entry.name, 'cards');
    try {
      const cardFiles = await fs.readdir(cardsDir);
      for (const name of cardFiles) {
        if (!/^prompt-(front|back)(-18)?\.png$/i.test(name)) continue;
        files.push(path.join(cardsDir, name));
      }
    } catch {
      // no cards folder
    }
  }
  return files.sort();
}

async function main() {
  const pngPaths = await listCardPngs();
  let written = 0;
  for (const pngPath of pngPaths) {
    const webpPath = pngPath.replace(/\.png$/i, '.webp');
    await sharp(pngPath)
      .webp({ quality: 88, effort: 4 })
      .toFile(webpPath);
    written += 1;
  }
  console.log(`Wrote ${written} theme card .webp files from ${pngPaths.length} PNGs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
