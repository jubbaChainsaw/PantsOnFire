#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const apk =
  process.argv[2] ||
  path.join(
    __dirname,
    '../android/app/build/outputs/apk/release/app-release.apk',
  );

if (!fs.existsSync(apk)) {
  console.error('APK not found:', apk);
  process.exit(1);
}

const listing = execSync(`unzip -l "${apk}"`, { encoding: 'utf8' });
const hasBundle =
  /index\.android\.bundle/.test(listing) ||
  /index\.android\.bundle\.hbc/.test(listing);
const hasWeb = /pof-web\/index\.html/.test(listing);

console.log('APK:', apk);
console.log('Size:', (fs.statSync(apk).size / 1024 / 1024).toFixed(2), 'MB');
console.log('index.android.bundle:', hasBundle ? 'YES' : 'NO');
console.log('pof-web/index.html:', hasWeb ? 'YES' : 'NO');

if (!hasBundle || !hasWeb) {
  process.exit(1);
}
