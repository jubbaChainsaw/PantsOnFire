#!/usr/bin/env node
/** Sync versionName/versionCode from app.json into android/app/build.gradle when present. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const appGradle = path.join(root, 'android/app/build.gradle');

if (!fs.existsSync(appGradle) || !fs.existsSync(appJsonPath)) {
  process.exit(0);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const versionName = String(appJson.expo?.version || '0.1.0');
const versionCode = Number(
  appJson.expo?.android?.versionCode ||
    process.env.POF_ANDROID_VERSION_CODE ||
    1,
);

let gradle = fs.readFileSync(appGradle, 'utf8');
gradle = gradle.replace(/versionName "[^"]*"/, `versionName "${versionName}"`);
gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
fs.writeFileSync(appGradle, gradle);
console.log(`Android versionName=${versionName} versionCode=${versionCode}`);
