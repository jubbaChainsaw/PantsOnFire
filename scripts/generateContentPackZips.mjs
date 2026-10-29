#!/usr/bin/env node
/**
 * Build versioned content-pack zips + manifest.json for CDN deploy (not uploaded by CI).
 */
import {
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const publicRoot = path.resolve('public');
const assetsThemes = path.join(publicRoot, 'assets/themes');
const outRoot = path.resolve(process.argv[2] || 'dist/content-packs');
const baseUrl =
  process.env.CONTENT_PACK_BASE_URL || 'https://www.pantsonfire.app/content-packs/';

const CORE_PACKS = [
  { id: 'core-murder-mystery', name: 'Murder Mystery', themeSlug: 'murder-mystery', tier: 'free' },
  { id: 'core-pirates', name: 'Pirates', themeSlug: 'pirates', tier: 'free' },
  {
    id: 'core-cops-and-robbers',
    name: 'Cops and Robbers',
    themeSlug: 'gangsters',
    tier: 'free',
  },
  {
    id: 'core-ghosts-and-ghouls',
    name: 'Ghosts and Ghouls',
    themeSlug: 'ghosts-and-ghouls',
    tier: 'free',
  },
];

const DLC_PACKS = [
  {
    id: 'dlc-ye-olde-baloney',
    entitlementPackId: 'ye-olde-baloney',
    name: 'Ye Olde Baloney',
    themeSlugs: ['vikings', 'gladiators', 'medieval'],
    tier: 'paid',
  },
  {
    id: 'dlc-myth-taken-identity',
    entitlementPackId: 'myth-taken-identity',
    name: 'Myth-Taken Identity',
    themeSlugs: ['royalty', 'mythology-gods-and-legends', 'time-travelers'],
    tier: 'paid',
  },
  {
    id: 'dlc-licence-to-fib',
    entitlementPackId: 'licence-to-fib',
    name: 'Licence to Fib',
    themeSlugs: ['ninjas', 'spies', 'cyberpunk'],
    tier: 'paid',
  },
  {
    id: 'dlc-fever-dream-1',
    entitlementPackId: 'fever-dream-1',
    name: 'Fever Dream I',
    themeSlugs: ['fever-dream-1'],
    tier: 'paid',
  },
];

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (c) => hash.update(c))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

function zipFolder(sourceDir, zipPath) {
  mkdirSync(path.dirname(zipPath), { recursive: true });
  if (existsSync(zipPath)) {
    require('node:fs').rmSync(zipPath, { force: true });
  }
  const parent = path.dirname(sourceDir);
  const folderName = path.basename(sourceDir);
  const result = spawnSync(
    'zip',
    ['-r', '-q', zipPath, folderName],
    { cwd: parent, stdio: 'inherit' },
  );
  if (result.status !== 0) {
    throw new Error(`zip failed for ${sourceDir}`);
  }
}

function stagePackTree(themeSlugs, stageDir) {
  rmSync(stageDir, { recursive: true, force: true });
  mkdirSync(stageDir, { recursive: true });
  for (const slug of themeSlugs) {
    const src = path.join(assetsThemes, slug);
    if (!existsSync(src)) {
      console.warn(`Skip missing theme folder: ${slug}`);
      continue;
    }
    const dest = path.join(stageDir, 'assets', 'themes', slug);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
  }
}

async function buildPack(def) {
  const stageDir = path.join(outRoot, '.staging', def.id);
  const slugs = def.themeSlugs || [def.themeSlug];
  stagePackTree(slugs, stageDir);
  const zipName = `${def.id}-v1.zip`;
  const zipPath = path.join(outRoot, zipName);
  zipFolder(stageDir, zipPath);
  const sizeBytes = statSync(zipPath).size;
  const sha256 = await sha256File(zipPath);
  return {
    id: def.id,
    name: def.name,
    kind: 'theme',
    themeSlug: def.themeSlug || slugs[0],
    entitlementPackId: def.entitlementPackId,
    tier: def.tier,
    version: '1.0.0',
    sizeBytes,
    sha256,
    file: zipName,
  };
}

async function main() {
  mkdirSync(outRoot, { recursive: true });
  const packs = [];
  for (const def of CORE_PACKS) {
    packs.push(await buildPack(def));
  }
  for (const def of DLC_PACKS) {
    packs.push(await buildPack(def));
  }
  const manifest = {
    version: 1,
    baseUrl,
    generatedAt: new Date().toISOString(),
    packs,
  };
  writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    path.join(publicRoot, 'content-packs/manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Wrote ${packs.length} packs to ${outRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
