/**
 * Assembles scripts/twoTruthsCurated/prioritySeeds.json from curated exports + fixes.
 * Run: node scripts/twoTruthsCurated/assemblePrioritySeeds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_COUNTS } from './expectedCounts.mjs';
import { isValidPhrase } from './aggressiveClean.mjs';
import { isCuratedPhraseTailAcceptable } from '../../src/data/twoTruthsOneFirePrompts.js';
import {
  HOBBIES_TOP_UP,
  PIC_MIX_TOP_UP,
  JOBS_TOP_UP,
  ANIME_TOP_UP,
  TRAVEL_TOP_UP,
  INTERNET_SLANG_TOP_UP,
  DATING_BIOS_TOP_UP,
  CONSPIRACY_TOP_UP,
  MUSICALS_TOP_UP,
} from './topUpPhrases.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURATED_DIR = path.join(__dirname, '../../src/data/twoTruthsOneFire/curated/categories');
const PRIORITY_PATH = path.join(__dirname, 'prioritySeeds.json');
const PRIORITY_OVERRIDE_KEYS = new Set(['sports', 'food', 'places']);

function acceptable(phrase) {
  return isValidPhrase(phrase) && isCuratedPhraseTailAcceptable(phrase);
}

function sanitizePhrase(phrase) {
  let p = String(phrase || '').trim();
  if (!p) return p;

  const replacements = [
    [/ key works$/i, ' masterpieces'],
    [/ logo colours$/i, ' headquarters cities'],
    [/^health and safety officer duties$/i, 'workplace health and safety rules'],
    [/Eurovision staging gimmicks people remember/i, 'memorable Eurovision stage props'],
    [/Eurovision winning songs from the (\d{4})s/gi, (_, decade) => {
      const map = {
        1970: 'seventies',
        1980: 'eighties',
        1990: 'nineties',
        2000: 'noughties',
        2010: 'twenty-tens',
        2020: 'twenty-twenties',
      };
      const key = `${decade.slice(0, 3)}0`;
      const label = map[key] || decade;
      return `Eurovision winning songs of the ${label}`;
    }],
    [/passport left at home stories$/i, 'passport left at home panics'],
    [/missed flight stories$/i, 'missed flight excuses'],
    [/Ryanair stories people share$/i, 'Ryanair carry-on rows'],
    [/easyJet delay stories$/i, 'easyJet delay excuses'],
    [/boarding gate sprint stories$/i, 'boarding gate sprints'],
    [/middle seat horror stories$/i, 'middle seat flight woes'],
    [/bag sent to another country stories$/i, 'bags sent to the wrong country'],
    [/driving abroad wrong-side stories$/i, 'driving on the wrong side abroad'],
    [/food poisoning holiday stories$/i, 'holiday food poisoning mishaps'],
    [/bumped from a flight stories$/i, 'getting bumped from overbooked flights'],
    [/Eurostar delay tales$/i, 'Eurostar delay excuses'],
    [/coach toilet horror stories$/i, 'coach toilet nightmares'],
    [/refund waiting horror stories$/i, 'holiday refund waits'],
    [/border queue horror stories$/i, 'border queue nightmares'],
    [/bird poop scam stories$/i, 'bird poop tourist scams'],
    [/deposit dispute stories$/i, 'deposit dispute rows'],
    [/fire alarm at 3am stories$/i, 'fire alarms at 3am in flats'],
    [/bath overflow stories$/i, 'bath overflow mishaps'],
    [/SpareRoom horror stories$/i, 'SpareRoom viewing nightmares'],
    [/strange ghost stories$/i, 'famous ghost legends'],
    [/bizarre time slip stories$/i, 'bizarre time slip legends'],
    [/strange glitches in the matrix stories$/i, 'matrix glitch memes'],
    [/Rainbow reading stories$/i, 'Rainbow TV characters'],
    [/Minnie the Minx stories$/i, 'Beano comic characters'],
    [/Newsround stories remembered$/i, 'Newsround presenters from childhood'],
    [/odd old wives' tales$/i, "odd old wives' superstitions"],
    [/frost leaf macro photos$/i, 'frost on leaf close-up photos'],
    [/dew spiderweb macro photos$/i, 'dew on spiderweb close-up photos'],
    [/Teams potato filter era$/i, 'Teams potato filter moments'],
  ];

  for (const [re, rep] of replacements) {
    if (typeof rep === 'function') p = p.replace(re, rep);
    else p = p.replace(re, rep);
  }

  if (/\bclubs in the UK$/i.test(p)) return '';
  if (/\bbeginner kit items$/i.test(p)) return '';
  if (/\bcompetitions$/i.test(p) && /^(gardening|knitting|crochet|sewing|woodworking|metalworking|pottery|painting|drawing|photography|birdwatching|hiking|camping|fishing|cycling|running|swimming|yoga|pilates|climbing)\b/i.test(p)) {
    return '';
  }
  if (/\bfamous magazines$/i.test(p) || /\bYouTube channels$/i.test(p)) return '';
  if (/\bcomposition tips$/i.test(p)) return '';
  if (/\bfilter choices$/i.test(p)) return '';
  if (/\bcaption ideas$/i.test(p)) return '';
  if (/\bcommon mistakes$/i.test(p)) return '';
  if (/\bresponsibilities\b/i.test(p)) return '';
  if (/\bfamous directors\b/i.test(p)) return '';
  if (/\bpeople warn about\b/i.test(p)) return '';
  if (/\bconfusion$/i.test(p)) return '';
  if (/\bmeltdowns\b/i.test(p)) return '';
  if (/\boverlay styles\b/i.test(p)) return '';
  if (/\bGreat Reset phrases\b/i.test(p)) return '';

  return p.trim();
}

function topUpPool(categoryId) {
  const pools = {
    hobbies: HOBBIES_TOP_UP,
    'pic-mix': PIC_MIX_TOP_UP,
    jobs: JOBS_TOP_UP,
    anime: ANIME_TOP_UP,
    'travel-disasters': TRAVEL_TOP_UP,
    'internet-slang': INTERNET_SLANG_TOP_UP,
    'dating-bios': DATING_BIOS_TOP_UP,
    'conspiracy-lite': CONSPIRACY_TOP_UP,
    musicals: MUSICALS_TOP_UP,
  };
  return pools[categoryId] || [];
}

async function loadCuratedPhrases(categoryId) {
  const mod = await import(path.join(CURATED_DIR, `${categoryId}.js`));
  return mod.PHRASES || [];
}

function mergeUnique(phrases, target) {
  const seen = new Set();
  const out = [];
  for (const raw of phrases) {
    const p = sanitizePhrase(raw);
    if (!p) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    if (!acceptable(p)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= target) break;
  }
  return out;
}

async function buildCategory(categoryId, target, overrideList, existingList) {
  const fromPriority = overrideList ?? existingList;
  let list = mergeUnique(fromPriority || [], target);
  if (list.length < target) {
    const curated = await loadCuratedPhrases(categoryId);
    list = mergeUnique([...list, ...curated], target);
  }
  if (list.length < target) {
    const extra = topUpPool(categoryId);
    list = mergeUnique([...list, ...extra], target);
  }
  if (list.length < target) {
    throw new Error(`${categoryId}: only ${list.length} phrases after cleanup, need ${target}`);
  }
  return list.slice(0, target);
}

async function main() {
  const existingPriority = JSON.parse(fs.readFileSync(PRIORITY_PATH, 'utf8'));
  const out = {};

  for (const [categoryId, target] of Object.entries(EXPECTED_COUNTS)) {
    const override =
      PRIORITY_OVERRIDE_KEYS.has(categoryId) && Array.isArray(existingPriority[categoryId])
        ? existingPriority[categoryId]
        : null;
    out[categoryId] = await buildCategory(
      categoryId,
      target,
      override,
      existingPriority[categoryId],
    );
  }

  fs.writeFileSync(PRIORITY_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${Object.keys(out).length} categories to prioritySeeds.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
