#!/usr/bin/env node
/**
 * Patches Expo prebuild android/ for standalone APKs (embedded JS bundle) and size.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gradleProps = path.join(root, 'android/gradle.properties');
const appGradle = path.join(root, 'android/app/build.gradle');
const wrapperProps = path.join(
  root,
  'android/gradle/wrapper/gradle-wrapper.properties',
);

function setGradleProp(file, key, value) {
  let text = fs.readFileSync(file, 'utf8');
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) text = text.replace(re, line);
  else text += `\n${line}\n`;
  fs.writeFileSync(file, text);
}

if (!fs.existsSync(appGradle)) {
  console.warn('android/ missing; run expo prebuild first');
  process.exit(0);
}

if (fs.existsSync(wrapperProps)) {
  let w = fs.readFileSync(wrapperProps, 'utf8');
  w = w.replace(/gradle-9\.0\.0-bin\.zip/g, 'gradle-8.13-bin.zip');
  fs.writeFileSync(wrapperProps, w);
}

let app = fs.readFileSync(appGradle, 'utf8');
if (!app.includes('debuggableVariants = []')) {
  app = app.replace(
    /react \{\n/,
    `react {\n    // Embed JS in debug APKs (no Metro required)\n    debuggableVariants = []\n`,
  );
}
if (!app.includes('ndk { abiFilters')) {
  app = app.replace(
    /versionName "0.1.0"\n/,
    `versionName "0.1.0"\n\n        ndk {\n            abiFilters "arm64-v8a"\n        }\n`,
  );
}
fs.writeFileSync(appGradle, app);

setGradleProp(gradleProps, 'reactNativeArchitectures', 'arm64-v8a');
setGradleProp(gradleProps, 'android.enableMinifyInReleaseBuilds', 'true');
setGradleProp(
  gradleProps,
  'android.enableShrinkResourcesInReleaseBuilds',
  'true',
);

console.log('Patched android native build (bundle in debug, arm64, R8 shrink)');
