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
import {
  CONTENT_PACK_ACCESS,
  PROTECTED_DLC_PACKS,
  PUBLIC_CORE_PACKS,
} from '../server/contentPackCatalog.js';

const publicRoot = path.resolve('public');
const assetsThemes = path.join(publicRoot, 'assets/themes');
const outRoot = path.resolve(process.argv[2] || 'dist/content-packs');
const publicBaseUrl =
  process.env.CONTENT_PACK_PUBLIC_BASE_URL ||
  'https://www.pantsonfire.app/content-packs/public/';

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
  const zipName = def.zipFile || `${def.id}-v1.zip`;
  const accessDir = def.access === CONTENT_PACK_ACCESS.PROTECTED ? 'protected' : 'public';
  const zipPath = path.join(outRoot, accessDir, zipName);
  zipFolder(stageDir, zipPath);
  const sizeBytes = statSync(zipPath).size;
  const sha256 = await sha256File(zipPath);
  const meta = {
    id: def.id,
    name: def.name,
    kind: 'theme',
    themeSlug: def.themeSlug || slugs[0],
    entitlementPackId: def.entitlementPackId,
    tier: def.tier || (def.access === CONTENT_PACK_ACCESS.PROTECTED ? 'paid' : 'free'),
    access: def.access,
    version: '1.0.0',
    sizeBytes,
    sha256,
    file: zipName,
  };
  writeFileSync(
    path.join(outRoot, accessDir, `${def.id}-meta.json`),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
  return meta;
}

async function main() {
  mkdirSync(path.join(outRoot, 'public'), { recursive: true });
  mkdirSync(path.join(outRoot, 'protected'), { recursive: true });
  mkdirSync(path.join(publicRoot, 'content-packs/public'), { recursive: true });

  const publicPacks = [];
  const protectedPacks = [];
  for (const def of PUBLIC_CORE_PACKS) {
    publicPacks.push(await buildPack(def));
  }
  for (const def of PROTECTED_DLC_PACKS) {
    protectedPacks.push(await buildPack(def));
  }

  const publicManifest = {
    version: 1,
    baseUrl: publicBaseUrl.replace(/\/?$/, '/'),
    generatedAt: new Date().toISOString(),
    packs: publicPacks.map((pack) => ({
      ...pack,
      access: CONTENT_PACK_ACCESS.PUBLIC,
    })),
  };

  writeFileSync(
    path.join(outRoot, 'public/manifest.json'),
    `${JSON.stringify(publicManifest, null, 2)}\n`,
  );
  writeFileSync(
    path.join(publicRoot, 'content-packs/public/manifest.json'),
    `${JSON.stringify(publicManifest, null, 2)}\n`,
  );
  writeFileSync(
    path.join(outRoot, 'manifest-full.internal.json'),
    `${JSON.stringify({ public: publicPacks, protected: protectedPacks }, null, 2)}\n`,
  );
  console.log(
    `Wrote ${publicPacks.length} public + ${protectedPacks.length} protected packs under ${outRoot}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
