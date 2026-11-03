#!/usr/bin/env node
/**
 * Patches Expo prebuild android/ for standalone APKs (embedded JS bundle) and size.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const gradleProps = path.join(root, 'android/gradle.properties');
const appGradle = path.join(root, 'android/app/build.gradle');
const abis =
  process.env.POF_ANDROID_ABIS ||
  (process.env.POF_ANDROID_EMULATOR_APK === '1' ? 'x86_64' : 'arm64-v8a');
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
app = app.replace(
  /ndk \{\s*abiFilters[^\n]*\n\s*\}/,
  `ndk {\n            abiFilters "${abis}"\n        }`,
);
if (!app.includes('ndk { abiFilters')) {
  app = app.replace(
    /versionName "0.1.0"\n/,
    `versionName "0.1.0"\n\n        ndk {\n            abiFilters "${abis}"\n        }\n`,
  );
}
fs.writeFileSync(appGradle, app);

setGradleProp(
  gradleProps,
  'org.gradle.jvmargs',
  '-Xmx4096m -XX:MaxMetaspaceSize=2048m -Dfile.encoding=UTF-8',
);
setGradleProp(
  gradleProps,
  'kotlin.daemon.jvmargs',
  '-Xmx2048m -XX:MaxMetaspaceSize=2048m',
);
setGradleProp(gradleProps, 'org.gradle.parallel', 'false');
setGradleProp(gradleProps, 'org.gradle.workers.max', '2');
setGradleProp(gradleProps, 'reactNativeArchitectures', abis);
setGradleProp(gradleProps, 'android.enableMinifyInReleaseBuilds', 'true');
setGradleProp(
  gradleProps,
  'android.enableShrinkResourcesInReleaseBuilds',
  'true',
);

const appGradlePath = appGradle;
let gradleApp = fs.readFileSync(appGradlePath, 'utf8');
if (!gradleApp.includes('androidx.webkit:webkit')) {
  gradleApp = gradleApp.replace(
    /dependencies \{\n/,
    `dependencies {\n    implementation 'androidx.webkit:webkit:1.11.0'\n`,
  );
  fs.writeFileSync(appGradlePath, gradleApp);
}

console.log(
  `Patched android native build (bundle in debug, ABIs=${abis}, R8 shrink)`,
);
