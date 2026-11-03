#!/usr/bin/env node
/**
 * Optional release signing from env (never commit keystores).
 *
 * POF_ANDROID_KEYSTORE_PATH — path to upload keystore .jks/.keystore
 * POF_ANDROID_KEYSTORE_PASSWORD
 * POF_ANDROID_KEY_ALIAS
 * POF_ANDROID_KEY_PASSWORD
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appGradle = path.join(root, 'android/app/build.gradle');

if (!fs.existsSync(appGradle)) {
  console.warn('android/app/build.gradle missing; skip signing patch');
  process.exit(0);
}

const storeFile = process.env.POF_ANDROID_KEYSTORE_PATH || '';
const storePassword = process.env.POF_ANDROID_KEYSTORE_PASSWORD || '';
const keyAlias = process.env.POF_ANDROID_KEY_ALIAS || '';
const keyPassword = process.env.POF_ANDROID_KEY_PASSWORD || '';

if (!storeFile || !storePassword || !keyAlias || !keyPassword) {
  console.log(
    'Release signing: using debug/placeholder keystore (set POF_ANDROID_KEYSTORE_* for Play upload key)',
  );
  process.exit(0);
}

const resolvedStore = path.isAbsolute(storeFile)
  ? storeFile
  : path.join(root, storeFile);

let gradle = fs.readFileSync(appGradle, 'utf8');
if (!gradle.includes('pofReleaseSigning')) {
  const signingBlock = `
        release {
            signingConfig signingConfigs.pofReleaseSigning
        }`;
  if (gradle.includes('signingConfigs {')) {
    gradle = gradle.replace(
      /signingConfigs \{\n/,
      `signingConfigs {
        pofReleaseSigning {
            storeFile file("${resolvedStore.replace(/\\/g, '/')}")
            storePassword "${storePassword.replace(/"/g, '\\"')}"
            keyAlias "${keyAlias.replace(/"/g, '\\"')}"
            keyPassword "${keyPassword.replace(/"/g, '\\"')}"
        }
`,
    );
  }
  if (gradle.includes('buildTypes {') && !gradle.includes('pofReleaseSigning')) {
    gradle = gradle.replace(
      /buildTypes \{\n(\s*)release \{/,
      `buildTypes {\n$1release {\n$1    signingConfig signingConfigs.pofReleaseSigning`,
    );
  }
  fs.writeFileSync(appGradle, gradle);
  console.log('Patched android release signing from POF_ANDROID_KEYSTORE_* env');
} else {
  console.log('Android release signing already patched');
}
