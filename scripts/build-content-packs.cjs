#!/usr/bin/env node
/**
 * Builds per-theme zip packs + public/content-packs/manifest.json for GitHub Releases hosting.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const outDir = path.join(root, 'content-packs', 'dist');
const manifestOut = path.join(root, 'public', 'content-packs', 'manifest.json');

const BASE_URL =
  process.env.POF_CONTENT_PACK_BASE_URL ||
  'https://github.com/jubbaChainsaw/PantsOnFire/releases/download/content-packs-v1/';

/** Free core themes shipped separately from Default in the slim APK. */
const CORE_THEME_PACKS = [
  { id: 'theme-murder-mystery', name: 'Murder Mystery Theme', themeSlug: 'murder-mystery' },
  { id: 'theme-pirates', name: 'Pirates Theme', themeSlug: 'pirates' },
  { id: 'theme-ghosts-and-ghouls', name: 'Ghosts & Ghouls Theme', themeSlug: 'ghosts-and-ghouls' },
  { id: 'theme-gangsters', name: 'Cops & Robbers Theme', themeSlug: 'gangsters' },
];

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function zipThemePack(pack) {
  const themeDir = path.join(publicRoot, 'assets', 'themes', pack.themeSlug);
  if (!fs.existsSync(themeDir)) {
    console.warn(`Skip ${pack.id}: missing ${themeDir}`);
    return null;
  }
  fs.mkdirSync(outDir, { recursive: true });
  const zipName = `${pack.id}.zip`;
  const zipPath = path.join(outDir, zipName);
  fs.rmSync(zipPath, { force: true });
  const relTheme = `assets/themes/${pack.themeSlug}`;
  execSync(`zip -r -q "${zipPath}" "${relTheme}"`, { cwd: publicRoot, stdio: 'inherit' });
  const stat = fs.statSync(zipPath);
  return {
    id: pack.id,
    name: pack.name,
    kind: 'theme',
    themeSlug: pack.themeSlug,
    tier: 'free',
    version: '1.0.0',
    sizeBytes: stat.size,
    sha256: sha256File(zipPath),
    file: zipName,
  };
}

const packs = CORE_THEME_PACKS.map(zipThemePack).filter(Boolean);
const manifest = {
  version: 1,
  baseUrl: BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`,
  packs,
};

fs.mkdirSync(path.dirname(manifestOut), { recursive: true });
fs.writeFileSync(manifestOut, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifestOut} (${packs.length} packs)`);
console.log(`Zip artifacts in ${outDir}`);
