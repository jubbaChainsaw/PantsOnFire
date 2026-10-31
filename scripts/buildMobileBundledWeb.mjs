#!/usr/bin/env node
/**
 * Slim Android/offline web bundle: Default theme in APK, WebP rasters, CDN manifest URL.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] || 'dist-android');
const manifestUrl =
  process.env.VITE_CONTENT_PACK_MANIFEST_URL ||
  'https://www.pantsonfire.app/content-packs/public/manifest.json';

const env = {
  ...process.env,
  VITE_UI_RASTER_EXT: 'webp',
  VITE_MOBILE_SLIM_BUNDLE: '1',
  VITE_CONTENT_PACK_MANIFEST_URL: manifestUrl,
  VITE_WEB_JOIN_ONLY: '0',
};

const vite = spawnSync(
  'npx',
  ['vite', 'build', '--base', './', '--outDir', outDir],
  { stdio: 'inherit', env, shell: false },
);
if (vite.status !== 0) process.exit(vite.status || 1);

const trim = spawnSync('node', ['scripts/trimMobileBundledDist.mjs', outDir], {
  stdio: 'inherit',
  shell: false,
});
if (trim.status !== 0) process.exit(trim.status || 1);

const verify = spawnSync('node', ['scripts/verifyDistAndroidAssets.mjs', outDir], {
  stdio: 'inherit',
  shell: false,
});
if (verify.status !== 0) process.exit(verify.status || 1);

console.log(`Mobile bundled web ready at ${outDir}`);
