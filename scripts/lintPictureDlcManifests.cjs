#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const picturePacksRoot = path.join(repoRoot, 'public', 'assets', 'graphic-packs', 'picture');

function walk(dir, matches = []) {
  if (!fs.existsSync(dir)) return matches;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matches);
      continue;
    }
    if (entry.isFile() && entry.name === 'manifest.json') {
      matches.push(fullPath);
    }
  }
  return matches;
}

function parseManifest(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return { __parseError: error.message };
  }
}

function lintManifest(manifest, filePath) {
  const problems = [];
  if (!manifest || typeof manifest !== 'object') problems.push('manifest is not an object');
  if (manifest.__parseError) problems.push(`invalid JSON: ${manifest.__parseError}`);
  if (!manifest.id) problems.push('missing id');
  if (!manifest.label) problems.push('missing label');
  if (!manifest.category) problems.push('missing category');
  if (manifest.category && manifest.category !== 'picture') problems.push(`unsupported category "${manifest.category}"`);
  if (!manifest.basePath) problems.push('missing basePath');
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    problems.push('entries must be a non-empty array');
  } else {
    const entryIds = new Set();
    manifest.entries.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        problems.push(`entries[${index}] must be an object`);
        return;
      }
      if (!entry.entryId) problems.push(`entries[${index}] missing entryId`);
      if (entry.entryId && entryIds.has(entry.entryId)) problems.push(`duplicate entryId "${entry.entryId}"`);
      if (entry.entryId) entryIds.add(entry.entryId);
      if (!entry.main) problems.push(`entries[${index}] missing main`);
      if (!entry.imposter) problems.push(`entries[${index}] missing imposter`);
      if (!entry.mainMediaFile) problems.push(`entries[${index}] missing mainMediaFile`);
      if (!entry.imposterMediaFile) problems.push(`entries[${index}] missing imposterMediaFile`);
      if (entry.mainMediaFile) {
        const mediaPath = path.join(repoRoot, 'public', manifest.basePath.replace(/^\/+/, ''), entry.mainMediaFile);
        if (!fs.existsSync(mediaPath)) problems.push(`entries[${index}] main media missing on disk: ${entry.mainMediaFile}`);
      }
      if (entry.imposterMediaFile) {
        const mediaPath = path.join(repoRoot, 'public', manifest.basePath.replace(/^\/+/, ''), entry.imposterMediaFile);
        if (!fs.existsSync(mediaPath)) problems.push(`entries[${index}] imposter media missing on disk: ${entry.imposterMediaFile}`);
      }
    });
  }

  if (problems.length) {
    console.error(`[lintPictureDlcManifests] ${filePath}`);
    problems.forEach((problem) => console.error(`  - ${problem}`));
    return false;
  }
  return true;
}

function main() {
  const manifestFiles = walk(picturePacksRoot).sort();
  if (!manifestFiles.length) {
    console.error('[lintPictureDlcManifests] No picture manifest files found.');
    process.exit(1);
  }
  const ok = manifestFiles
    .map((filePath) => lintManifest(parseManifest(filePath), filePath))
    .every(Boolean);

  if (!ok) {
    console.error('[lintPictureDlcManifests] Validation failed.');
    process.exit(1);
  }

  console.log(`[lintPictureDlcManifests] OK (${manifestFiles.length} manifests)`);
}

main();
