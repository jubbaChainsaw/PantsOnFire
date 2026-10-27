#!/usr/bin/env node
/**
 * Converts PNG/JPEG in dist/ to WebP and updates references in HTML/JS/CSS.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const IMAGE_EXT = /\.(png|jpe?g)$/i;
const TEXT_EXT = /\.(html|js|css|json)$/i;

if (!fs.existsSync(dist)) {
  console.error('dist/ missing');
  process.exit(1);
}

const replacements = [];

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, onFile);
    else onFile(p);
  }
}

async function convertImages() {
  const files = [];
  walk(dist, (f) => {
    if (IMAGE_EXT.test(f) && !f.endsWith('.webp')) files.push(f);
  });
  let saved = 0;
  for (const file of files) {
    const webpPath = file.replace(IMAGE_EXT, '.webp');
    try {
      await sharp(file)
        .webp({ quality: 78, effort: 4 })
        .toFile(webpPath);
      const before = fs.statSync(file).size;
      const after = fs.statSync(webpPath).size;
      saved += Math.max(0, before - after);
      const relFrom = path.relative(dist, file).split(path.sep).join('/');
      const relTo = path.relative(dist, webpPath).split(path.sep).join('/');
      replacements.push({ from: relFrom, to: relTo });
      fs.unlinkSync(file);
    } catch (err) {
      console.warn(`webp skip ${file}:`, err.message);
    }
  }
  return { count: replacements.length, saved };
}

function patchTextFiles() {
  const textFiles = [];
  walk(dist, (f) => {
    if (TEXT_EXT.test(f)) textFiles.push(f);
  });
  for (const file of textFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const { from, to } of replacements) {
      const encFrom = encodeURI(from);
      const encTo = encodeURI(to);
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
      if (content.includes(encFrom)) {
        content = content.split(encFrom).join(encTo);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(file, content);
  }
}

(async () => {
  const { count, saved } = await convertImages();
  patchTextFiles();
  console.log(
    `WebP: converted ${count} images, saved ~${(saved / 1024 / 1024).toFixed(1)} MiB`,
  );
})();
