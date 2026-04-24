#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function usage() {
  console.log('Usage: npm run dlc:new-picture-pack -- <pack-id> [label]');
  console.log('Example: npm run dlc:new-picture-pack -- city-lights-v1 "City Lights Pack"');
}

function buildTemplateManifest(packId, label) {
  return {
    id: packId,
    version: 1,
    label: label || `${packId} picture pack`,
    category: 'picture',
    releaseChannel: 'dlc',
    enabled: true,
    basePath: `/assets/graphic-packs/picture/${packId}/images`,
    entries: [
      {
        entryId: 'sample-01',
        groupId: 'sample',
        groupName: 'Sample',
        hint: 'Picture Prompt • Sample 1',
        main: 'Sample Main Prompt',
        imposter: 'Sample Imposter Prompt',
        mainMediaFile: 'sample-01-main.png',
        imposterMediaFile: 'sample-01-imposter.png',
        previewLabel: 'Graphic pack clue from sample prompts.',
      },
    ],
  };
}

function createPlaceholderReadme(targetDir, packId) {
  const readmePath = path.join(targetDir, 'README.md');
  if (fs.existsSync(readmePath)) return;
  const content = [
    `# ${packId} image folder`,
    '',
    'Put your `.png` files here and reference them from `manifest.json`.',
    'Required per entry:',
    '- `mainMediaFile`',
    '- `imposterMediaFile`',
    '',
    'After editing manifest/assets, run:',
    '- `npm run dlc:sync-picture-manifests`',
  ].join('\n');
  fs.writeFileSync(readmePath, content, 'utf8');
}

function main() {
  const [, , rawPackId, ...labelParts] = process.argv;
  if (!rawPackId) {
    usage();
    process.exit(1);
  }

  const packId = toSlug(rawPackId);
  if (!packId) {
    console.error('Invalid pack id. Use letters, numbers, and dashes only.');
    process.exit(1);
  }

  const label = labelParts.join(' ').trim();
  const repoRoot = path.resolve(__dirname, '..');
  const packDir = path.join(repoRoot, 'public', 'assets', 'graphic-packs', 'picture', packId);
  const imagesDir = path.join(packDir, 'images');
  const manifestPath = path.join(packDir, 'manifest.json');

  if (fs.existsSync(manifestPath)) {
    console.error(`Pack already exists: ${manifestPath}`);
    process.exit(1);
  }

  fs.mkdirSync(imagesDir, { recursive: true });
  const manifest = buildTemplateManifest(packId, label);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  createPlaceholderReadme(imagesDir, packId);

  console.log(`Created picture DLC scaffold for "${packId}"`);
  console.log(`- Manifest: ${manifestPath}`);
  console.log(`- Images:   ${imagesDir}`);
  console.log('Next step: add png files and update manifest entries, then run:');
  console.log('  npm run dlc:sync-picture-manifests');
}

main();
