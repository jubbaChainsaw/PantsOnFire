#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = process.argv[2] ? path.resolve(process.argv[2]) : '';

const SCAN_ROOTS = [path.join(root, 'src/data'), path.join(root, 'src/components')];
const SKIP_FILES = /personaAvatar|host-generation|\.test\./i;

const CATEGORIES = {
  alcohol: /\b(alcohol|beer|wine|vodka|whiskey|whisky|drunk|drinking|cocktail|hangover|booze)\b/i,
  drugs: /\b(cocaine|heroin|marijuana|cannabis|\bweed\b|mdma|ecstasy|methamphetamine)\b/i,
  gambling: /\b(gambling|casino|slot machine|roulette|sports bet|\bwager\b)\b/i,
  sexual: /\b(sexual|nude|nudity|porn|orgasm|hookup|onlyfans)\b/i,
  strongSwearing: /\b(fuck|shit|cunt|motherfucker)\b/i,
};

function collectFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectFiles(full, out);
    else if (/\.(js|jsx)$/i.test(name) && !SKIP_FILES.test(full)) out.push(full);
  }
  return out;
}

async function scanFile(filePath) {
  const rel = path.relative(root, filePath);
  const hits = [];
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const adultOnlyContext =
      /adultOnly\s*:\s*true/.test(trimmed) ||
      /adultImposter|adultMain|_ADULT|ADULT_|adultHints|adultPrompts/.test(trimmed);
    for (const [category, re] of Object.entries(CATEGORIES)) {
      if (!re.test(trimmed)) continue;
      hits.push({
        category,
        file: rel,
        line: lineNo,
        excerpt: trimmed.slice(0, 200),
        adultOnlyContext,
      });
    }
    if (/logo-18plus|LOGO_18PLUS|UI_LOGO_18PLUS/.test(trimmed)) {
      hits.push({
        category: 'adultReachability',
        file: rel,
        line: lineNo,
        excerpt: trimmed.slice(0, 120),
        adultOnlyContext: false,
      });
    }
  }
  return hits;
}

const files = [...new Set(SCAN_ROOTS.flatMap((d) => collectFiles(d)))];
const allHits = [];
for (const file of files) {
  // eslint-disable-next-line no-await-in-loop
  allHits.push(...(await scanFile(file)));
}

function summarize(category) {
  const rows = allHits.filter((h) => h.category === category);
  return {
    total: rows.length,
    releaseReachable: rows.filter((h) => !h.adultOnlyContext).length,
  };
}

const summary = Object.fromEntries(
  [...Object.keys(CATEGORIES), 'adultReachability'].map((c) => [c, summarize(c)]),
);

const examples = {};
for (const cat of Object.keys(summary)) {
  examples[cat] = allHits
    .filter((h) => h.category === cat && !h.adultOnlyContext)
    .slice(0, 8);
}

const report = {
  scannedAt: new Date().toISOString(),
  scannedFileCount: files.length,
  summary,
  examples,
  adultOnlyExamples: allHits.filter((h) => h.adultOnlyContext).slice(0, 10),
  releaseBehaviour: {
    adultOnlyPromptsExcluded: 'buildLocalRound filters prompt.adultOnly (App.jsx).',
    logo18Plus: 'logo-18plus asset exists; no release UI route sets adultMode.',
  },
};

const json = JSON.stringify(report, null, 2);
if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json);
}
console.log(outPath ? `Wrote ${outPath}` : json);
