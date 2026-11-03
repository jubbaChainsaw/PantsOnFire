import {
  CURATED_PHRASES_BY_CATEGORY,
  getCuratedPhraseCount,
} from './twoTruthsOneFire/curated/index.js';
import { dedupeMains, phraseToMain } from './twoTruthsOneFire/buildCuratedMains.js';

export const TWO_TRUTHS_ROUNDS_PER_CATEGORY = 100;
export const TWO_TRUTHS_ADULT_ROUNDS_PER_CATEGORY = 35;

export { getCuratedPhraseCount };

const TWO_TRUTHS_HINTS = [
  'Three Picks',
  'Triple List',
  'Blend the Lie',
  'Category Trio',
  'Two Truths Setup',
  'Related Three',
  'Spot the Fib',
  'List Challenge',
  'Truth Trio',
  'Fire Round',
];

const STACKED_QUALIFIER_PATTERN =
  /\b(underrated|overrated|classic|iconic|nostalgic|retro|modern|mainstream|underground|obscure|polarising|unexpected|chaotic|wholesome|guilty-pleasure|debate-starting|all-time favourite)\s+(underrated|overrated|classic|iconic|nostalgic|retro|modern|mainstream|underground|obscure|polarising|unexpected|chaotic|wholesome|guilty-pleasure|debate-starting|all-time favourite)\b/i;

/** Common US spellings / terms we do not want in Two Truths copy. */
export const TWO_TRUTHS_AMERICANISM_RULES = [
  { id: 'favorite', pattern: /\bfavorites?\b/i },
  { id: 'color', pattern: /\bcolors?\b/i },
  { id: 'organize', pattern: /\borganiz(e|ed|es|ing)\b/i },
  { id: 'vacation', pattern: /\bvacations?\b/i },
  { id: 'candy', pattern: /\bcand(y|ies)\b/i },
  { id: 'soccer', pattern: /\bsoccer\b/i },
  { id: 'mom', pattern: /\bmom\b/i },
  { id: 'movies', pattern: /\bmovies\b/i },
  { id: 'movie', pattern: /\bmovie\b/i },
  { id: 'bracket', pattern: /\bbrackets?\b/i },
  { id: 'newbie', pattern: /\bnewbies?\b/i },
  { id: 'starter-pack', pattern: /\bstarter packs?\b/i },
  { id: 'tier-list', pattern: /\btier lists?\b/i },
  { id: 'playoff', pattern: /\bplayoffs?\b/i },
  { id: 'coworker', pattern: /\bcoworkers?\b/i },
  { id: 'roommate', pattern: /\broommates?\b/i },
  { id: 'collab', pattern: /\bcollabs?\b/i },
  { id: 'knock-on-wood', pattern: /\bknock-on-wood\b/i },
  { id: 'theater', pattern: /\btheaters?\b/i },
  { id: 'apartment', pattern: /\bapartments?\b/i },
  { id: 'elevator', pattern: /\belevators?\b/i },
  { id: 'college', pattern: /\bcolleges?\b/i },
];

/** Curated phrase tails we reject (meta, gluing residue, or nonsense). */
const DISALLOWED_PHRASE_TAIL_PATTERN =
  /\b(not horror|not horror but|not you it's me|collaboration|collaborations|known faults|passenger rights|prism references|jump scares|staging gimmicks|officer duties|logo colours|key works|macro photos)\b/i;

function simplifyLabel(text, fallback = 'things') {
  const cleaned = String(text || '').split(/[(/:-]/)[0].trim();
  return cleaned || fallback;
}

export function isCuratedPhraseTailAcceptable(phrase) {
  const tail = String(phrase || '').trim();
  if (!tail) return false;
  if (DISALLOWED_PHRASE_TAIL_PATTERN.test(tail)) return false;
  const main = phraseToMain(tail);
  return validateTwoTruthsPromptMain(main) === null;
}

export function getCuratedMainsForCategory(categoryId, limit = Infinity) {
  const phrases = CURATED_PHRASES_BY_CATEGORY[categoryId] || [];
  const mains = dedupeMains(
    phrases
      .filter(isCuratedPhraseTailAcceptable)
      .map(phraseToMain)
      .filter(Boolean),
  );
  if (!Number.isFinite(limit)) return mains;
  return mains.slice(0, Math.max(0, limit));
}

/**
 * Returns matched Americanism rule ids for this text (empty if none).
 */
export function findAmericanismsInTwoTruthsCopy(text) {
  const value = String(text || '');
  if (!value) return [];
  return TWO_TRUTHS_AMERICANISM_RULES.filter((rule) => rule.pattern.test(value)).map(
    (rule) => rule.id,
  );
}

/**
 * Returns an error string if the prompt main is invalid, otherwise null.
 */
export function validateTwoTruthsPromptMain(main) {
  const text = String(main || '').trim();
  if (!text) return 'empty prompt';
  if (!text.startsWith('Name three ')) return 'must start with “Name three ”';
  if (/^Pick three /i.test(text)) return 'use “Name three”, not “Pick three”';
  if (/\bthis category\b/i.test(text)) return 'generic “this category” placeholder';
  if (STACKED_QUALIFIER_PATTERN.test(text)) return 'stacked qualifiers';
  const americanisms = findAmericanismsInTwoTruthsCopy(text);
  if (americanisms.length) {
    return `Americanism(s): ${americanisms.join(', ')}`;
  }
  const tail = text.slice('Name three '.length);
  if (/\bthat (are|feel|would|spell|belong|sound|remind|split|instantly)\b/i.test(tail)) {
    return 'template-style tail clause';
  }
  if (/\bfrom a (hotel|festival|messy|chaotic|lads)/i.test(tail)) {
    return 'narrative tail clause';
  }
  if (/\byou would (not |never |put |rate |strike |ban |defend |recommend )/i.test(tail)) {
    return 'second-person tail clause';
  }
  if (/\b stories$/i.test(tail) || /\b tales$/i.test(tail)) {
    return 'narrative story tail';
  }
  if (/\bclubs in the UK$/i.test(tail)) {
    return 'cross-product hobby spam';
  }
  if (/\b(composition tips|filter choices|caption ideas|common mistakes)\b/i.test(tail)) {
    return 'photo meta spam';
  }
  return null;
}

/** @deprecated Curated banks replace topic nouns; kept for tests importing the symbol. */
export function getTwoTruthsTopicNounsForCategory(category) {
  return getCuratedMainsForCategory(category?.id).map((main) =>
    main.slice('Name three '.length),
  );
}

export function detectTwoTruthsTopicRedundancy() {
  return null;
}

export function buildTwoTruthsCuratedShortfallReport(categories, targetCountForCategory) {
  return (categories || []).map((category) => {
    const target = targetCountForCategory(category);
    const available = getCuratedMainsForCategory(category.id).length;
    const shortfall = Math.max(0, target - available);
    return {
      categoryId: category.id,
      categoryName: category.name,
      target,
      available,
      shortfall,
    };
  });
}

function toRoundEntries(mains, category, adultOnly) {
  const topicLabel = simplifyLabel(category.name, 'Category');
  return mains.map((main, index) => ({
    hint: `${TWO_TRUTHS_HINTS[index % TWO_TRUTHS_HINTS.length]} • ${topicLabel}`,
    main,
    previewLabel: 'Type two truths and one lie that fit together.',
    ...(adultOnly ? { adultOnly: true } : {}),
  }));
}

export function buildTwoTruthsOneFireRoundsForCategory(
  category,
  count = TWO_TRUTHS_ROUNDS_PER_CATEGORY,
  adultCount = TWO_TRUTHS_ADULT_ROUNDS_PER_CATEGORY,
) {
  const allMains = getCuratedMainsForCategory(category.id);
  const regularCount = Math.max(0, count - adultCount);
  const regularMains = allMains.slice(0, regularCount);
  const adultMains = allMains.slice(regularCount, regularCount + adultCount);
  const regular = toRoundEntries(regularMains, category, false);
  const adult = toRoundEntries(adultMains, category, true);
  return [...regular, ...adult].slice(0, count);
}

export function buildTwoTruthsOneFireRoundsMap(
  categories = [],
  count = TWO_TRUTHS_ROUNDS_PER_CATEGORY,
  adultCount = TWO_TRUTHS_ADULT_ROUNDS_PER_CATEGORY,
) {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      buildTwoTruthsOneFireRoundsForCategory(category, count, adultCount),
    ]),
  );
}
