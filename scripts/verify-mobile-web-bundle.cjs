#!/usr/bin/env node
/**
 * Renders the mobile dist/ (same as APK pof-web assets) and captures a screenshot.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync, spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(
  root,
  'artifacts/android-emulator-smoke/neon-home-bundled-web.png',
);

if (!fs.existsSync(dist)) {
  console.error('Run npm run build:mobile first');
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });

const port = 4177;
const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: root, stdio: 'ignore', detached: true },
);

const wait = (ms) => execSync(`sleep ${Math.ceil(ms / 1000)}`);
try {
  wait(3500);
  execSync(
    `npx playwright screenshot --browser chromium http://127.0.0.1:${port}/ "${out}"`,
    { cwd: root, stdio: 'inherit' },
  );
  console.log('Screenshot:', out);
} finally {
  try {
    process.kill(-preview.pid);
  } catch {
    preview.kill();
  }
}
