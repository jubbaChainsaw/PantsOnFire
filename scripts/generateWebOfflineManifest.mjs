#!/usr/bin/env node
/**
 * List static files under dist for native offline cache sync.
 * Usage: node scripts/generateWebOfflineManifest.mjs [distDir]
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.argv[2] || 'dist');
const files = [];

function walk(relDir = '') {
  const abs = path.join(distDir, relDir);
  for (const name of readdirSync(abs)) {
    const rel = relDir ? `${relDir}/${name}` : name;
    const full = path.join(distDir, rel);
    const st = statSync(full);
    if (st.isDirectory()) walk(rel);
    else files.push({ path: rel.replace(/\\/g, '/'), bytes: st.size });
  }
}

walk('');
files.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  version: 1,
  fileCount: files.length,
  totalBytes: files.reduce((sum, row) => sum + row.bytes, 0),
  files,
};

writeFileSync(
  path.join(distDir, 'web-offline-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Wrote web-offline-manifest.json (${manifest.fileCount} files, ${manifest.totalBytes} bytes)`,
);
