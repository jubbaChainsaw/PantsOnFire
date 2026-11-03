/**
 * Builds curated Two Truths phrase banks from priority seeds + cleaned legacy tails.
 * Run: node scripts/buildTwoTruthsCurated.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidPhrase } from './twoTruthsCurated/aggressiveClean.mjs';
import { EXPECTED_COUNTS } from './twoTruthsCurated/expectedCounts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../src/data/twoTruthsOneFire/curated/categories');

const PRIORITY = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'twoTruthsCurated/prioritySeeds.json'), 'utf8'),
);

function scorePhrase(categoryId, phrase) {
  const p = phrase.toLowerCase();
  let score = 0;
  if (
    /\b(clubs|winners|champions|actors|songs|characters|franchises|teams|countries|cities|films|books|games|bands|artists)\b/.test(
      p,
    )
  ) {
    score += 3;
  }
  if (/\b(capital cities|confusion countries|surprise countries|mistake countries)\b/.test(p)) {
    score -= 8;
  }
  if (/\b(cheeses|breads|street foods|curry dishes|desserts|snacks)\b/.test(p) && /\b(french|welsh|scottish|irish|italian|spanish|german)\b/.test(p)) {
    score -= 6;
  }
  if (/\b(delay excuses|queue horror stories|lost luggage stories)\b/.test(p)) {
    score -= 8;
  }
  if (/\bflatmate arguments\b/.test(p) || /\bpassive-aggressive notes\b/.test(p)) {
    score -= 8;
  }
  if (/\b(animation|studio|production|entertainment)\b/.test(p) && /\bfilms\b/.test(p)) {
    score -= 5;
  }
  if (/\b(underrated|overrated|debates|gimmicks|faults|witnesses|rights|prism)\b/.test(p)) {
    score -= 4;
  }
  if (p.length > 52) score -= 2;
  if (/\bhorror jokes\b/.test(p)) score -= 10;
  return score;
}

function mergePhrases(categoryId, target) {
  const seen = new Set();
  const out = [];
  for (const phrase of PRIORITY[categoryId] || []) {
    const trimmed = String(phrase || '').trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    if (!isValidPhrase(trimmed)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  if (out.length < target) {
    throw new Error(
      `${categoryId}: only ${out.length} editorial priority phrases, need ${target}`,
    );
  }
  return out.slice(0, target);
}

function escapeString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function writeCategoryFile(categoryId, phrases) {
  const lines = phrases.map((p) => `  '${escapeString(p)}',`);
  const body = `/** Curated phrase tails — ${categoryId} (${phrases.length}) */\nexport const PHRASES = [\n${lines.join('\n')}\n];\n`;
  fs.writeFileSync(path.join(OUT_DIR, `${categoryId}.js`), body, 'utf8');
}

function importName(categoryId) {
  return categoryId.replace(/[^a-zA-Z0-9]/g, '_');
}

function writeIndex() {
  const ids = Object.keys(EXPECTED_COUNTS);
  const imports = ids
    .map((id) => `import { PHRASES as ${importName(id)} } from './categories/${id}.js';`)
    .join('\n');
  const entries = ids.map((id) => `  '${id}': ${importName(id)},`).join('\n');
  const indexBody = `/** Curated “Name three …” phrase tails for Two Truths One Fire (UK English). */\n${imports}\n\nexport const CURATED_PHRASES_BY_CATEGORY = {\n${entries}\n};\n\nexport function getCuratedPhraseCount(categoryId) {\n  const phrases = CURATED_PHRASES_BY_CATEGORY[categoryId];\n  return Array.isArray(phrases) ? phrases.length : 0;\n}\n`;
  fs.writeFileSync(
    path.join(__dirname, '../src/data/twoTruthsOneFire/curated/index.js'),
    indexBody,
    'utf8',
  );
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const failures = [];
  for (const [categoryId, target] of Object.entries(EXPECTED_COUNTS)) {
    try {
      const phrases = mergePhrases(categoryId, target);
      if (phrases.length !== target) {
        failures.push(`${categoryId}: length ${phrases.length} !== ${target}`);
        continue;
      }
      writeCategoryFile(categoryId, phrases);
    } catch (err) {
      failures.push(`${categoryId}: ${err.message}`);
    }
  }
  writeIndex();
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(`Wrote ${Object.keys(EXPECTED_COUNTS).length} category files`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
