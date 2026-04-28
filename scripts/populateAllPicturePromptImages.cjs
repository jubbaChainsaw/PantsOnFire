#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const pictureRoot = path.join(repoRoot, 'public', 'assets', 'graphic-packs', 'picture');
const manifestsSyncScript = path.join(repoRoot, 'scripts', 'syncPictureDlcManifests.cjs');
const manifestsLintScript = path.join(repoRoot, 'scripts', 'lintPictureDlcManifests.cjs');
const localApiKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');

function usage() {
  console.log('Usage: npm run dlc:populate-picture-images -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --provider <pexels|pixabay>     Provider for image sourcing (default: pixabay)');
  console.log('  --pack-id <id>                  Limit to one picture pack id');
  console.log('  --fallback-provider <provider>  Optional fallback provider when no results');
  console.log('  --skip-existing                 Keep already existing image files');
  console.log('  --dry-run                       Print actions without writing');
  console.log('  --help                          Show this help');
}

function parseArgs(argv) {
  const options = {
    provider: 'pixabay',
    fallbackProvider: '',
    skipExisting: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--provider') {
      options.provider = String(argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--pack-id') {
      options.packId = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (arg === '--fallback-provider') {
      options.fallbackProvider = String(argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--skip-existing') {
      options.skipExisting = true;
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

function readLocalApiKeys() {
  if (!fs.existsSync(localApiKeysPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(localApiKeysPath, 'utf8'));
  } catch {
    return {};
  }
}

function resolveApiKey(provider, localApiKeys) {
  if (provider === 'pixabay') {
    return process.env.PIXABAY_API_KEY || String(localApiKeys.pixabayApiKey || '').trim();
  }
  if (provider === 'pexels') {
    return process.env.PEXELS_API_KEY || String(localApiKeys.pexelsApiKey || '').trim();
  }
  return '';
}

function findManifestFiles() {
  if (!fs.existsSync(pictureRoot)) return [];
  const dirs = fs.readdirSync(pictureRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const files = [];
  dirs.forEach((dir) => {
    const manifestPath = path.join(pictureRoot, dir, 'manifest.json');
    if (fs.existsSync(manifestPath)) files.push(manifestPath);
  });
  return files.sort();
}

function buildSpecFromManifest(manifest, packDirPath) {
  return {
    id: manifest.id,
    label: manifest.label,
    releaseChannel: manifest.releaseChannel || 'dlc',
    enabled: manifest.enabled !== false,
    groupId: manifest.id,
    groupName: manifest.label,
    entries: (manifest.entries || []).map((entry, index) => ({
      entryId: entry.entryId || `${manifest.id}-${String(index + 1).padStart(2, '0')}`,
      groupId: entry.groupId || manifest.id,
      groupName: entry.groupName || manifest.label,
      hint: entry.hint || `Picture Prompt • ${manifest.label} ${index + 1}`,
      main: entry.main,
      imposter: entry.imposter,
      previewLabel: entry.previewLabel || `Graphic pack clue from ${manifest.label}.`,
      mainQuery: entry.main,
      imposterQuery: entry.imposter,
      adultOnly: Boolean(entry.adultOnly),
    })),
    _packDirPath: packDirPath,
  };
}

function runNodeScript(scriptPath, args = []) {
  const result = spawnSync('node', [scriptPath, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(scriptPath)} failed with exit code ${result.status}`);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms));
}

function runImporterWithRetry(specPath, options) {
  const attempts = [
    { waitMs: 0, provider: options.provider, fallbackProvider: options.fallbackProvider },
    { waitMs: 4000, provider: options.provider, fallbackProvider: options.fallbackProvider },
    {
      waitMs: 8000,
      provider: options.fallbackProvider || options.provider,
      fallbackProvider:
        options.fallbackProvider && options.fallbackProvider !== options.provider
          ? options.provider
          : '',
    },
    {
      waitMs: 16000,
      provider: options.fallbackProvider || options.provider,
      fallbackProvider:
        options.fallbackProvider && options.fallbackProvider !== options.provider
          ? options.provider
          : '',
    },
  ];

  let lastError = null;
  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    if (attempt.waitMs > 0) {
      console.log(
        `  retry ${index + 1}/${attempts.length} in ${Math.floor(attempt.waitMs / 1000)}s (${attempt.provider}${attempt.fallbackProvider ? ` -> ${attempt.fallbackProvider}` : ''})`
      );
      sleep(attempt.waitMs);
    }
    try {
      runImporter(specPath, {
        ...options,
        provider: attempt.provider,
        fallbackProvider: attempt.fallbackProvider,
      });
      return;
    } catch (error) {
      lastError = error;
      console.warn(`  attempt ${index + 1}/${attempts.length} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('Importer failed after retries.');
}

function runImporter(specPath, options) {
  const importerScript = path.join(repoRoot, 'scripts', 'importPicturePackFromRoyaltyFree.cjs');
  const args = [
    importerScript,
    '--provider', options.provider,
    '--spec', specPath,
    '--overwrite',
    '--no-lint',
    '--no-sync',
  ];
  if (options.dryRun) args.push('--dry-run');
  if (options.apiKey) {
    args.push('--api-key', options.apiKey);
  }
  if (options.fallbackProvider) {
    args.push('--fallback-provider', options.fallbackProvider);
    if (options.fallbackApiKey) {
      args.push('--fallback-api-key', options.fallbackApiKey);
    }
  }
  runNodeScript(path.join(repoRoot, 'scripts', 'importPicturePackFromRoyaltyFree.cjs'), args.slice(1));
}

function main() {
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

  if (!['pexels', 'pixabay'].includes(options.provider)) {
    console.error(`Unsupported provider "${options.provider}".`);
    process.exit(1);
  }
  if (options.fallbackProvider && !['pexels', 'pixabay'].includes(options.fallbackProvider)) {
    console.error(`Unsupported fallback provider "${options.fallbackProvider}".`);
    process.exit(1);
  }
  if (options.fallbackProvider && options.fallbackProvider === options.provider) {
    console.error('Fallback provider must differ from primary provider.');
    process.exit(1);
  }

  const localApiKeys = readLocalApiKeys();
  options.apiKey = resolveApiKey(options.provider, localApiKeys);
  if (!options.apiKey) {
    console.error(`Missing API key for primary provider "${options.provider}".`);
    process.exit(1);
  }
  if (options.fallbackProvider) {
    options.fallbackApiKey = resolveApiKey(options.fallbackProvider, localApiKeys);
    if (!options.fallbackApiKey) {
      console.error(`Missing API key for fallback provider "${options.fallbackProvider}".`);
      process.exit(1);
    }
  }

  const manifestFiles = findManifestFiles();
  if (!manifestFiles.length) {
    console.error('No picture manifests found.');
    process.exit(1);
  }

  const specsDir = path.join(repoRoot, '.tmp', 'bulk-picture-specs');
  if (!options.dryRun) fs.mkdirSync(specsDir, { recursive: true });

  const selectedManifests = [];
  for (const manifestPath of manifestFiles) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (options.packId && manifest.id !== options.packId) continue;
    selectedManifests.push({ manifestPath, manifest });
  }

  if (!selectedManifests.length) {
    console.error('No manifests matched the provided filters.');
    process.exit(1);
  }

  console.log(`[populateAllPicturePromptImages] Provider: ${options.provider}`);
  if (options.fallbackProvider) {
    console.log(`[populateAllPicturePromptImages] Fallback provider: ${options.fallbackProvider}`);
  }
  console.log(`[populateAllPicturePromptImages] Packs: ${selectedManifests.length}`);

  for (const { manifestPath, manifest } of selectedManifests) {
    const packDirPath = path.dirname(manifestPath);
    const imagesDir = path.join(packDirPath, 'images');
    const spec = buildSpecFromManifest(manifest, packDirPath);
    let entries = spec.entries;

    if (options.skipExisting) {
      entries = entries.filter((entry) => {
        const original = (manifest.entries || []).find((mEntry) => mEntry.entryId === entry.entryId);
        if (!original) return true;
        const mainPath = original.mainMediaFile ? path.join(imagesDir, original.mainMediaFile) : '';
        const imposterPath = original.imposterMediaFile ? path.join(imagesDir, original.imposterMediaFile) : '';
        const hasMain = mainPath && fs.existsSync(mainPath);
        const hasImposter = imposterPath && fs.existsSync(imposterPath);
        return !(hasMain && hasImposter);
      });
    }

    if (!entries.length) {
      console.log(`- ${manifest.id}: skipped (all entries already have files)`);
      continue;
    }

    const runSpec = {
      id: spec.id,
      label: spec.label,
      releaseChannel: spec.releaseChannel,
      enabled: spec.enabled,
      groupId: spec.groupId,
      groupName: spec.groupName,
      entries,
    };

    const specPath = path.join(specsDir, `${manifest.id}.json`);
    if (!options.dryRun) {
      fs.writeFileSync(specPath, `${JSON.stringify(runSpec, null, 2)}\n`, 'utf8');
    }

    console.log(`- ${manifest.id}: importing ${entries.length} entries`);
    runImporterWithRetry(specPath, options);
  }

  if (!options.dryRun) {
    runNodeScript(manifestsLintScript);
    runNodeScript(manifestsSyncScript);
  }

  console.log('[populateAllPicturePromptImages] Completed.');
}

main();
