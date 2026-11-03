#!/usr/bin/env node
/**
 * Copies Vite dist/ into Android assets for offline WebView loading.
 * Run after `npm run build` and `npx expo prebuild --platform android`.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'dist');
const dest = path.join(root, 'android/app/src/main/assets/pof-web');

if (!fs.existsSync(src)) {
  console.error('Run npm run build first.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

function copyRecursive(from, to) {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(src, dest);
console.log(`Copied web bundle to ${dest}`);
