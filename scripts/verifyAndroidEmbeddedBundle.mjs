#!/usr/bin/env node
/**
 * Verify React Native JS bundle is packaged in APK/AAB (standalone, no Metro).
 * Usage: node scripts/verifyAndroidEmbeddedBundle.mjs <path-to.apk|path-to.aab>
 */
import { existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const archivePath = path.resolve(process.argv[2] || '');
if (!archivePath || !existsSync(archivePath)) {
  console.error('Usage: node scripts/verifyAndroidEmbeddedBundle.mjs <apk-or-aab>');
  process.exit(1);
}

const listing = execSync(`unzip -l ${JSON.stringify(archivePath)}`, {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

const bundleLines = listing
  .split('\n')
  .filter((line) => /index\.android\.bundle/.test(line));

if (!bundleLines.length) {
  console.error('FAIL: no index.android.bundle in archive listing');
  console.error(listing.slice(-2000));
  process.exit(1);
}

console.log('OK: index.android.bundle entries:');
let maxBytes = 0;
for (const line of bundleLines) {
  console.log(line.trim());
  const parts = line.trim().split(/\s+/);
  const bytes = Number(parts[0]);
  if (Number.isFinite(bytes)) maxBytes = Math.max(maxBytes, bytes);
}

if (maxBytes < 100_000) {
  console.error(`FAIL: bundle looks too small (${maxBytes} bytes)`);
  process.exit(1);
}

console.log(`Bundle size (largest entry): ${maxBytes} bytes`);
console.log(`Archive: ${archivePath} (${statSync(archivePath).size} bytes)`);
