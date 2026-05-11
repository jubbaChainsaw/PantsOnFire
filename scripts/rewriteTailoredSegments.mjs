#!/usr/bin/env node
/**
 * Regenerates scripts/data/personaAvatarTailored-*.json from live themePersonas
 * using scripts/personaHyperspecificLook.mjs (dense per-id looks + Barry override).
 *
 * Run: node scripts/rewriteTailoredSegments.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { buildHyperspecificLook } from './personaHyperspecificLook.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

async function loadPersonasModule() {
  return import(pathToFileURL(path.join(repoRoot, 'src', 'data', 'themePersonas.js')).href);
}

async function loadCatalogModule() {
  return import(pathToFileURL(path.join(repoRoot, 'src', 'data', 'themeCatalog.js')).href);
}

function routeBucket(personaId) {
  const id = String(personaId || '');
  if (id.startsWith('default-')) return 'default';
  if (id.startsWith('murder-') || id.startsWith('cops-')) return 'mysteryCops';
  if (id.startsWith('ghost-') || id.startsWith('pirates-')) return 'ghostsPirates';
  return 'other';
}

async function main() {
  const { getThemePersonas } = await loadPersonasModule();
  const { ALL_THEME_NAMES = [] } = await loadCatalogModule();
  const themeNames = [...new Set(ALL_THEME_NAMES)];

  const buckets = {
    default: {},
    mysteryCops: {},
    ghostsPirates: {},
    other: {},
  };

  for (const themeName of themeNames) {
    const personas = getThemePersonas(themeName) || [];
    for (const persona of personas) {
      const id = String(persona?.id || '').trim();
      if (!id) continue;
      const look = buildHyperspecificLook({
        id,
        name: persona.name,
        bio: persona.bio,
        themeName,
      });
      const b = routeBucket(id);
      buckets[b === 'default' ? 'default' : b === 'mysteryCops' ? 'mysteryCops' : b === 'ghostsPirates' ? 'ghostsPirates' : 'other'][id] = look;
    }
  }

  const dataDir = path.join(repoRoot, 'scripts', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const writes = [
    ['personaAvatarTailored-part-default.json', buckets.default],
    ['personaAvatarTailored-part-mystery-cops.json', buckets.mysteryCops],
    ['personaAvatarTailored-part-ghosts-pirates.json', buckets.ghostsPirates],
    ['personaAvatarTailored-dlc.json', buckets.other],
  ];

  let total = 0;
  for (const [filename, obj] of writes) {
    const keys = Object.keys(obj).length;
    total += keys;
    fs.writeFileSync(path.join(dataDir, filename), `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
    console.log(`[rewriteTailoredSegments] ${filename}: ${keys} personas`);
  }
  console.log(`[rewriteTailoredSegments] Total tailored entries: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
