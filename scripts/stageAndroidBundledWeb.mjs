#!/usr/bin/env node
/**
 * Copy Vite dist into the generated Android assets folder (after expo prebuild).
 * Usage: node scripts/stageAndroidBundledWeb.mjs [distDir]
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.argv[2] || 'dist-android');
const assetRoot = path.resolve('android/app/src/main/assets/pof-web');

if (!existsSync(distDir)) {
  console.error(`Missing dist directory: ${distDir}`);
  process.exit(1);
}
if (!existsSync(path.resolve('android/app/src/main/assets'))) {
  console.error('Run npx expo prebuild --platform android before staging bundled web assets.');
  process.exit(1);
}

rmSync(assetRoot, { recursive: true, force: true });
mkdirSync(assetRoot, { recursive: true });
cpSync(distDir, assetRoot, { recursive: true });
console.log(`Staged ${distDir} -> ${assetRoot}`);
