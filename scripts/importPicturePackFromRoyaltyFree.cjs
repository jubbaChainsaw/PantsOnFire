#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const picturePacksRoot = path.join(repoRoot, 'public', 'assets', 'graphic-packs', 'picture');

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSafeFilename(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function usage() {
  console.log('Usage: npm run dlc:import-picture-pack -- --spec <path> [options]');
  console.log('');
  console.log('Required:');
  console.log('  --spec <path>                  JSON spec describing prompt pairs to import');
  console.log('');
  console.log('Options:');
  console.log('  --provider <pexels|pixabay>    Source provider (default: pexels)');
  console.log('  --api-key <key>                API key (or use env vars PEXELS_API_KEY / PIXABAY_API_KEY)');
  console.log('  --pack-id <id>                 Override pack id from spec');
  console.log('  --label <label>                Override pack label from spec');
  console.log('  --release-channel <base|dlc>   Override release channel (default: dlc)');
  console.log('  --allow-adult                  Disable safe search where provider supports it');
  console.log('  --overwrite                    Allow overwriting an existing manifest');
  console.log('  --no-lint                      Skip lint script after import');
  console.log('  --no-sync                      Skip manifest sync script after import');
  console.log('  --dry-run                      Print intended operations without writing files');
  console.log('');
  console.log('Examples:');
  console.log('  PEXELS_API_KEY=... npm run dlc:import-picture-pack -- --spec tools/royalty-free-import-template/picture-import.spec.example.json');
  console.log('  PIXABAY_API_KEY=... npm run dlc:import-picture-pack -- --provider pixabay --spec ./my-pack-spec.json --pack-id city-pack-v1');
}

function parseArgs(argv) {
  const options = {
    provider: 'pexels',
    lint: true,
    sync: true,
    overwrite: false,
    dryRun: false,
    allowAdult: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--spec') {
      options.specPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--provider') {
      options.provider = String(argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--api-key') {
      options.apiKey = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--pack-id') {
      options.packId = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--label') {
      options.label = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--release-channel') {
      options.releaseChannel = String(argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--allow-adult') {
      options.allowAdult = true;
      continue;
    }
    if (arg === '--overwrite') {
      options.overwrite = true;
      continue;
    }
    if (arg === '--no-lint') {
      options.lint = false;
      continue;
    }
    if (arg === '--no-sync') {
      options.sync = false;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function resolveApiKey(provider, cliKey) {
  if (cliKey) return cliKey;
  if (provider === 'pexels') return process.env.PEXELS_API_KEY || '';
  if (provider === 'pixabay') return process.env.PIXABAY_API_KEY || '';
  return '';
}

function readSpec(specPath) {
  const absolutePath = path.isAbsolute(specPath)
    ? specPath
    : path.join(repoRoot, specPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Spec file not found: ${absolutePath}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse spec JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Spec must be an object');
  }
  if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) {
    throw new Error('Spec must include a non-empty "entries" array');
  }
  return { parsed, absolutePath };
}

function validateAndNormalizeSpec(spec, options) {
  const rawPackId = options.packId || spec.id;
  const packId = toSlug(rawPackId);
  if (!packId) {
    throw new Error('Pack id is required (via spec.id or --pack-id) and must be slug-safe');
  }

  const label = String(options.label || spec.label || `${packId} picture pack`).trim();
  const releaseChannel = options.releaseChannel || spec.releaseChannel || 'dlc';
  if (!['base', 'dlc'].includes(releaseChannel)) {
    throw new Error(`Invalid releaseChannel "${releaseChannel}". Use "base" or "dlc".`);
  }

  const enabled = typeof spec.enabled === 'boolean' ? spec.enabled : true;
  const groupId = String(spec.groupId || packId).trim();
  const groupName = String(spec.groupName || label).trim();
  const previewLabelTemplate = String(
    spec.previewLabelTemplate || `Graphic pack clue from ${label}.`
  ).trim();

  const normalizedEntries = spec.entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`entries[${index}] must be an object`);
    }
    const main = String(entry.main || '').trim();
    const imposter = String(entry.imposter || '').trim();
    if (!main || !imposter) {
      throw new Error(`entries[${index}] requires "main" and "imposter"`);
    }
    const entryId = toSlug(entry.entryId || `${packId}-${String(index + 1).padStart(2, '0')}`);
    if (!entryId) {
      throw new Error(`entries[${index}] has invalid entryId`);
    }
    return {
      entryId,
      groupId: String(entry.groupId || groupId).trim() || groupId,
      groupName: String(entry.groupName || groupName).trim() || groupName,
      hint: String(entry.hint || `Picture Prompt • ${groupName} ${index + 1}`).trim(),
      main,
      imposter,
      mainQuery: String(entry.mainQuery || main).trim(),
      imposterQuery: String(entry.imposterQuery || imposter).trim(),
      previewLabel: String(entry.previewLabel || previewLabelTemplate).trim(),
      adultOnly: Boolean(entry.adultOnly),
    };
  });

  const seen = new Set();
  normalizedEntries.forEach((entry) => {
    if (seen.has(entry.entryId)) {
      throw new Error(`Duplicate entryId in spec: ${entry.entryId}`);
    }
    seen.add(entry.entryId);
  });

  return {
    packId,
    label,
    releaseChannel,
    enabled,
    entries: normalizedEntries,
  };
}

function detectExtension(url, contentType) {
  const contentTypeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  if (contentTypeMap[contentType]) return contentTypeMap[contentType];

  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext;
    }
  } catch {}
  return '.jpg';
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${message || response.statusText}`);
  }
  return response.json();
}

async function searchPexels(query, apiKey, usedIds) {
  const endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=25&orientation=landscape`;
  const payload = await fetchJson(endpoint, {
    headers: { Authorization: apiKey },
  });

  const candidates = Array.isArray(payload?.photos) ? payload.photos : [];
  for (const photo of candidates) {
    const sourceId = `pexels:${photo.id}`;
    if (usedIds.has(sourceId)) continue;
    const downloadUrl = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
    if (!downloadUrl) continue;
    return {
      sourceId,
      downloadUrl,
      sourcePageUrl: photo.url || '',
      attribution: {
        provider: 'pexels',
        providerId: String(photo.id || ''),
        photographer: photo.photographer || '',
        photographerUrl: photo.photographer_url || '',
        sourcePageUrl: photo.url || '',
        license: 'Pexels License',
        licenseUrl: 'https://www.pexels.com/license/',
      },
    };
  }
  return null;
}

async function searchPixabay(query, apiKey, usedIds, allowAdult) {
  const endpoint = `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=${allowAdult ? 'false' : 'true'}&per_page=50`;
  const payload = await fetchJson(endpoint);
  const candidates = Array.isArray(payload?.hits) ? payload.hits : [];
  for (const hit of candidates) {
    const sourceId = `pixabay:${hit.id}`;
    if (usedIds.has(sourceId)) continue;
    const downloadUrl = hit?.largeImageURL || hit?.webformatURL || hit?.previewURL;
    if (!downloadUrl) continue;
    return {
      sourceId,
      downloadUrl,
      sourcePageUrl: hit.pageURL || '',
      attribution: {
        provider: 'pixabay',
        providerId: String(hit.id || ''),
        contributor: hit.user || '',
        contributorProfile: hit.user_id ? `https://pixabay.com/users/${hit.user}-${hit.user_id}/` : '',
        sourcePageUrl: hit.pageURL || '',
        license: 'Pixabay Content License',
        licenseUrl: 'https://pixabay.com/service/license-summary/',
      },
    };
  }
  return null;
}

async function findRemoteImage({ provider, apiKey, query, usedIds, allowAdult }) {
  if (provider === 'pexels') {
    return searchPexels(query, apiKey, usedIds);
  }
  if (provider === 'pixabay') {
    return searchPixabay(query, apiKey, usedIds, allowAdult);
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

async function downloadBinary(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  return { buffer, contentType };
}

function runNodeScript(scriptPath) {
  const result = spawnSync('node', [scriptPath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(scriptPath)} failed with exit code ${result.status}`);
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage();
    process.exit(1);
  }

  if (options.help) {
    usage();
    process.exit(0);
  }

  if (!options.specPath) {
    usage();
    process.exit(1);
  }

  if (!['pexels', 'pixabay'].includes(options.provider)) {
    throw new Error(`Unsupported provider "${options.provider}". Use "pexels" or "pixabay".`);
  }

  const apiKey = resolveApiKey(options.provider, options.apiKey);
  if (!apiKey) {
    const envVar = options.provider === 'pexels' ? 'PEXELS_API_KEY' : 'PIXABAY_API_KEY';
    throw new Error(`Missing API key. Provide --api-key or set ${envVar}.`);
  }

  const { parsed: spec, absolutePath: specAbsolutePath } = readSpec(options.specPath);
  const normalized = validateAndNormalizeSpec(spec, options);

  const packDir = path.join(picturePacksRoot, normalized.packId);
  const imagesDir = path.join(packDir, 'images');
  const manifestPath = path.join(packDir, 'manifest.json');
  const attributionPath = path.join(packDir, 'import-attribution.json');

  if (fs.existsSync(manifestPath) && !options.overwrite) {
    throw new Error(`Manifest already exists at ${manifestPath}. Re-run with --overwrite to replace it.`);
  }

  if (!options.dryRun) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const usedSourceIds = new Set();
  const manifestEntries = [];
  const attributionEntries = [];

  console.log(`[importPicturePackFromRoyaltyFree] Provider: ${options.provider}`);
  console.log(`[importPicturePackFromRoyaltyFree] Spec:     ${specAbsolutePath}`);
  console.log(`[importPicturePackFromRoyaltyFree] Pack:     ${normalized.packId}`);
  console.log(`[importPicturePackFromRoyaltyFree] Entries:  ${normalized.entries.length}`);

  for (let i = 0; i < normalized.entries.length; i += 1) {
    const entry = normalized.entries[i];
    console.log(`- [${i + 1}/${normalized.entries.length}] ${entry.entryId}`);

    const mainRemote = await findRemoteImage({
      provider: options.provider,
      apiKey,
      query: entry.mainQuery,
      usedIds: usedSourceIds,
      allowAdult: options.allowAdult,
    });
    if (!mainRemote) {
      throw new Error(`No image results found for mainQuery "${entry.mainQuery}" (entry ${entry.entryId})`);
    }
    usedSourceIds.add(mainRemote.sourceId);

    const imposterRemote = await findRemoteImage({
      provider: options.provider,
      apiKey,
      query: entry.imposterQuery,
      usedIds: usedSourceIds,
      allowAdult: options.allowAdult,
    });
    if (!imposterRemote) {
      throw new Error(`No image results found for imposterQuery "${entry.imposterQuery}" (entry ${entry.entryId})`);
    }
    usedSourceIds.add(imposterRemote.sourceId);

    let mainMediaFile = '';
    let imposterMediaFile = '';

    if (!options.dryRun) {
      const mainAsset = await downloadBinary(mainRemote.downloadUrl);
      const mainExt = detectExtension(mainRemote.downloadUrl, mainAsset.contentType);
      mainMediaFile = `${toSafeFilename(entry.entryId)}-main${mainExt}`;
      fs.writeFileSync(path.join(imagesDir, mainMediaFile), mainAsset.buffer);

      const imposterAsset = await downloadBinary(imposterRemote.downloadUrl);
      const imposterExt = detectExtension(imposterRemote.downloadUrl, imposterAsset.contentType);
      imposterMediaFile = `${toSafeFilename(entry.entryId)}-imposter${imposterExt}`;
      fs.writeFileSync(path.join(imagesDir, imposterMediaFile), imposterAsset.buffer);
    } else {
      mainMediaFile = `${toSafeFilename(entry.entryId)}-main.jpg`;
      imposterMediaFile = `${toSafeFilename(entry.entryId)}-imposter.jpg`;
    }

    manifestEntries.push({
      entryId: entry.entryId,
      groupId: entry.groupId,
      groupName: entry.groupName,
      hint: entry.hint,
      main: entry.main,
      imposter: entry.imposter,
      mainMediaFile,
      imposterMediaFile,
      previewLabel: entry.previewLabel,
      ...(entry.adultOnly ? { adultOnly: true } : {}),
      sourceMain: mainRemote.attribution,
      sourceImposter: imposterRemote.attribution,
    });

    attributionEntries.push({
      entryId: entry.entryId,
      mainQuery: entry.mainQuery,
      imposterQuery: entry.imposterQuery,
      sourceMain: mainRemote.attribution,
      sourceImposter: imposterRemote.attribution,
    });
  }

  const manifest = {
    id: normalized.packId,
    version: 1,
    label: normalized.label,
    category: 'picture',
    releaseChannel: normalized.releaseChannel,
    enabled: normalized.enabled,
    basePath: `/assets/graphic-packs/picture/${normalized.packId}/images`,
    entries: manifestEntries,
  };

  const attribution = {
    generatedAt: new Date().toISOString(),
    provider: options.provider,
    specPath: path.relative(repoRoot, specAbsolutePath),
    packId: normalized.packId,
    label: normalized.label,
    entries: attributionEntries,
  };

  if (options.dryRun) {
    console.log('');
    console.log('[dry-run] Manifest preview:');
    console.log(JSON.stringify(manifest, null, 2));
    process.exit(0);
  }

  fs.mkdirSync(packDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(attributionPath, `${JSON.stringify(attribution, null, 2)}\n`, 'utf8');

  console.log(`[importPicturePackFromRoyaltyFree] Wrote manifest: ${manifestPath}`);
  console.log(`[importPicturePackFromRoyaltyFree] Wrote attribution log: ${attributionPath}`);

  if (options.lint) {
    runNodeScript(path.join(repoRoot, 'scripts', 'lintPictureDlcManifests.cjs'));
  }
  if (options.sync) {
    runNodeScript(path.join(repoRoot, 'scripts', 'syncPictureDlcManifests.cjs'));
  }
}

main().catch((error) => {
  console.error(`[importPicturePackFromRoyaltyFree] ${error.message}`);
  process.exit(1);
});
