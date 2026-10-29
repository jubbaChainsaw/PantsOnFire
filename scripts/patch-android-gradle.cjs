#!/usr/bin/env node
/** Expo 55 prebuild pins Gradle 9.0; AGP needs 8.13+ and Gradle 9 breaks on this VM's JDK. */
const fs = require('node:fs');
const path = require('node:path');

const propsPath = path.join(__dirname, '../android/gradle/wrapper/gradle-wrapper.properties');
if (!fs.existsSync(propsPath)) {
  console.warn('No android gradle wrapper; skip patch.');
  process.exit(0);
}
let text = fs.readFileSync(propsPath, 'utf8');
text = text.replace(
  /gradle-9\.0\.0-bin\.zip/g,
  'gradle-8.13-bin.zip',
);
fs.writeFileSync(propsPath, text);
console.log('Patched Gradle wrapper to 8.13');
