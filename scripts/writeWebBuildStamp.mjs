#!/usr/bin/env node
/**
 * Write build-stamp.json (+ optional shell-version fields) into a Vite dist folder.
 * Usage: node scripts/writeWebBuildStamp.mjs [distDir]
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.argv[2] || 'dist');
const sha = String(process.env.VITE_APP_BUILD_SHA || process.env.GITHUB_SHA || '').trim();
const stamp = String(
  process.env.VITE_APP_BUILD_STAMP ||
    (process.env.GITHUB_RUN_NUMBER && sha
      ? `${process.env.GITHUB_RUN_NUMBER}-${sha.slice(0, 7)}`
      : sha.slice(0, 7) || 'dev'),
).trim();
const webVersion =
  String(process.env.POF_WEB_VERSION || process.env.VITE_APP_VERSION || '0.1.0').trim() ||
  '0.1.0';

const payload = {
  webVersion,
  webBuildSha: sha,
  webBuildStamp: stamp,
  builtAt: new Date().toISOString(),
};

writeFileSync(path.join(distDir, 'build-stamp.json'), `${JSON.stringify(payload, null, 2)}\n`);

const shellPath = path.join(distDir, 'shell-version.json');
if (existsSync(shellPath)) {
  try {
    const shell = JSON.parse(readFileSync(shellPath, 'utf8'));
    shell.webVersion = webVersion;
    shell.webBuildSha = sha;
    shell.webBuildStamp = stamp;
    writeFileSync(shellPath, `${JSON.stringify(shell, null, 2)}\n`);
  } catch {
    /* keep existing shell-version.json */
  }
}

console.log(`Wrote ${path.join(distDir, 'build-stamp.json')}`, payload);
