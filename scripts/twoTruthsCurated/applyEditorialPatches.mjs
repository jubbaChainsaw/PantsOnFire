/**
 * Editorial fixes for prioritySeeds.json — replace blocked tails and fill shortfalls.
 * Run: node scripts/twoTruthsCurated/applyEditorialPatches.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_COUNTS } from './expectedCounts.mjs';
import { isValidPhrase } from './aggressiveClean.mjs';
import {
  JOBS_TOP_UP,
  ANIME_TOP_UP,
  TRAVEL_TOP_UP,
  INTERNET_SLANG_TOP_UP,
  DATING_BIOS_TOP_UP,
  CONSPIRACY_TOP_UP,
  PIC_MIX_TOP_UP,
} from './topUpPhrases.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIORITY_PATH = path.join(__dirname, 'prioritySeeds.json');

const EXACT_REPLACEMENTS = new Map(
  Object.entries({
    'product manager responsibilities': 'product manager buzzwords',
    'UX designer responsibilities': 'UX design software',
    'QA tester responsibilities': 'software testing terms',
    'estate agent responsibilities': 'estate agent jargon',
    'letting agent responsibilities': 'letting agent jargon',
    'heatwave holiday meltdowns': 'heatwave holiday disasters',
    'metro ticket machine confusion': 'metro ticket machine mistakes',
    'pickpocket cities people warn about': 'cities known for pickpockets',
    'DTR talk phrases': 'define-the-relationship dating talks',
    'Great Reset phrases': 'Great Reset conspiracy theories',
    'New World Order phrases': 'New World Order conspiracy theories',
    'Agenda 21 phrases': 'Agenda 21 conspiracy theories',
    'Agenda 2030 phrases': 'Agenda 2030 conspiracy theories',
    'film grain overlay styles': 'film grain photo edits',
  }),
);

const ANIME_DIRECTOR_RE = /^(.+) famous directors$/i;

const INTERNET_SLANG_EDITORIAL = [
  'Gen Z slang words',
  'millennial slang words',
  'boomer slang words',
  'British internet slang words',
  'TikTok trends',
  'TikTok sounds',
  'TikTok dances',
  'meme formats',
  'viral catchphrases',
  'text abbreviations',
  'internet acronyms',
  'emoji people overuse',
  'reaction GIFs',
  'Discord emotes',
  'Twitch emotes',
  'Reddit acronyms',
  'forum acronyms',
  'dating app slang terms',
  'Love Island catchphrases',
  'reality TV catchphrases',
  'football Twitter insults',
  'British slang for drunk',
  'British slang for tired',
  'words for very good online',
  'words for very bad online',
  'slang for attractive people',
  'Gen Z insults',
  'millennial insults',
  'boomer insults',
  'Karen memes',
  'no cap slang meanings',
  'rizz slang meanings',
  'delulu slang meanings',
  'stan culture terms',
  'fandom ship names',
  'OTP couples on TV',
  'copypasta memes',
  'shitpost memes',
  'ratio meme replies',
  'OK boomer comebacks',
  'touch grass comebacks',
  'skill issue comebacks',
  'NPC meme insults',
  'sigma male memes',
  'based meme meanings',
  'cringe internet words',
  'cheugy fashion words',
  'bussin food slang',
  'mid insults online',
  'L and W slang',
  'cope replies online',
  'FOMO acronyms',
  'IYKYK acronyms',
  'TLDR acronyms',
  'NSFW forum tags',
  'spoiler forum tags',
  'hot take openers',
  'unpopular opinion openers',
  'glow-up Instagram captions',
  'throwback Instagram captions',
  'stan Twitter accounts',
  'meme stocks',
  'crypto bro slang',
  'LinkedIn hustle culture buzzwords',
  'podcast bro slang',
  'greentext memes',
  'YouTube comment slang',
  'TikTok comment slang',
  'Instagram comment slang',
  'WhatsApp group chat slang',
  'group chat abbreviations',
  'Snapchat slang words',
  'BeReal slang words',
  'Threads app slang',
  'AI chatbot memes',
  'ChatGPT meme prompts',
  'Oppenheimer memes',
  'Wednesday Addams memes',
  'Skibidi toilet memes',
  'brain rot memes',
  'Roman Empire memes',
  'girl dinner memes',
  'quiet quitting buzzwords',
  'lazy girl job buzzwords',
  'main character meme jokes',
  'delulu meme jokes',
  'situationship dating slang',
  'ghosting dating slang',
  'red flag dating slang',
  'green flag dating slang',
  'ick dating slang',
  'beige flag dating slang',
  'soft launch dating slang',
  'hard launch dating slang',
  'sigma grindset memes',
  'Ohio meme jokes',
  'fanum tax memes',
  'Skibidi slang words',
  'mewing trend words',
  'British slang for angry',
  'British slang for happy',
  'words for embarrassing online',
  'meme sound effects',
  'viral dance songs on TikTok',
  'Twitter/X slang words',
  'Discord slang words',
  'Reddit slang words',
  'Twitch slang words',
  'football meme accounts',
  'Love Island meme moments',
  'reality TV meme moments',
  'British TikTok creators',
  'podcast clip memes',
  'LinkedIn cringe posts',
  'Facebook mum group memes',
  'Nextdoor drama memes',
  'Spotify Wrapped meme jokes',
  'Wordle score brags',
  'Duolingo owl memes',
  'Among Us meme references',
  'Minecraft meme references',
  'Fortnite meme references',
  'Roblox meme references',
  'Genshin Impact meme references',
];

const TOP_UP_BY_CATEGORY = {
  jobs: JOBS_TOP_UP,
  anime: ANIME_TOP_UP,
  'travel-disasters': TRAVEL_TOP_UP,
  'internet-slang': INTERNET_SLANG_TOP_UP,
  'dating-bios': DATING_BIOS_TOP_UP,
  'conspiracy-lite': CONSPIRACY_TOP_UP,
  'pic-mix': PIC_MIX_TOP_UP,
};

function dropAnimeSpam(phrase) {
  const p = String(phrase || '').trim();
  if (!p) return '';
  if (/\banime .+ premiere cities$/i.test(p)) return '';
  if (/\b(tropes|famous examples)$/i.test(p)) return '';
  if (/\baward winners$/i.test(p) && /\banime\b/i.test(p)) return '';
  if (/\bTV series$/i.test(p) && /\b(Animation|Studio|Pictures|Works|Entertainment|SARU)\b/i.test(p)) {
    return '';
  }
  return p;
}

function normalisePhrase(raw, categoryId) {
  let p = String(raw || '').trim();
  if (categoryId === 'anime') p = dropAnimeSpam(p);
  if (!p) return p;
  const key = p.toLowerCase();
  if (EXACT_REPLACEMENTS.has(key)) return EXACT_REPLACEMENTS.get(key);
  const m = p.match(ANIME_DIRECTOR_RE);
  if (m) return `${m[1]} anime series`;
  return p;
}

function mergeToTarget(phrases, target, extraPool = [], categoryId = '') {
  const seen = new Set();
  const out = [];
  for (const raw of [...phrases, ...extraPool]) {
    const p = normalisePhrase(raw, categoryId);
    if (!p || !isValidPhrase(p)) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= target) break;
  }
  return out;
}

function main() {
  const priority = JSON.parse(fs.readFileSync(PRIORITY_PATH, 'utf8'));

  priority['internet-slang'] = INTERNET_SLANG_EDITORIAL.slice(
    0,
    EXPECTED_COUNTS['internet-slang'],
  );

  for (const [categoryId, target] of Object.entries(EXPECTED_COUNTS)) {
    if (categoryId === 'internet-slang') continue;
    const pool = TOP_UP_BY_CATEGORY[categoryId] || [];
    const merged = mergeToTarget(priority[categoryId] || [], target, pool, categoryId);
    if (merged.length < target) {
      throw new Error(`${categoryId}: only ${merged.length} valid phrases after patch, need ${target}`);
    }
    priority[categoryId] = merged;
  }

  fs.writeFileSync(PRIORITY_PATH, `${JSON.stringify(priority, null, 2)}\n`, 'utf8');
  console.log('Patched prioritySeeds.json for all categories.');
}

main();
