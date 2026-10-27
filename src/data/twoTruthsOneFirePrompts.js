import { CATEGORY_TOPIC_NOUNS } from './twoTruthsOneFire/categoryTopicNouns.js';

export const TWO_TRUTHS_ROUNDS_PER_CATEGORY = 100;
export const TWO_TRUTHS_ADULT_ROUNDS_PER_CATEGORY = 35;

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

/** Natural UK frames — `{topic}` plural phrase, `{category}` lowercase category label. */
const TWO_TRUTHS_FRAME_TEMPLATES = [
  'Name three {topic}',
  'Name three {topic} you would defend in an argument',
  'Name three {topic} everyone here should know',
  'Name three {topic} that sum up {category}',
  'Name three {topic} you are weirdly fussy about',
  'Name three {topic} that are overrated',
  'Name three {topic} that are underrated',
  'Name three {topic} you would recommend to a beginner',
  'Name three {topic} that always start a debate',
  'Name three {topic} you secretly judge people for liking',
  'Name three {topic} you would strike off a {category} list',
  'Name three {topic} that feel nostalgic',
  'Name three {topic} that feel overrated online',
  'Name three {topic} that are guilty pleasures',
  'Name three {topic} that sound made up but are real',
  'Name three {topic} you would put in a pub quiz',
  'Name three {topic} that would start a WhatsApp row',
  'Name three {topic} you would never admit you like',
  'Name three {topic} you would rate as the best',
  'Name three {topic} you would rate as the worst',
  'Name three {topic} you would use as icebreakers',
  'Name three {topic} your mates would argue about',
  'Name three {topic} you came to too late in life',
  'Name three {topic} you loved when you were younger',
  'Name three {topic} everyone pretends to like',
  'Name three {topic} that are hard to explain',
  'Name three {topic} that remind you of {category}',
  'Name three {topic} you would add to a {category} pub quiz',
  'Name three {topic} that split the room',
  'Name three {topic} you would put on a {category} bingo card',
  'Name three {topic} that instantly show your age',
  'Name three {topic} you would ban from a {category} night',
  'Name three {topic} you have strong opinions on',
  'Name three {topic} you would back in a trivia round',
  'Name three {topic} you would nominate for a hall of fame',
  'Name three {topic} you would send to a mate new to {category}',
  'Name three {topic} that are comforting',
  'Name three {topic} that are chaotic',
  'Name three {topic} you would queue for',
  'Name three {topic} you would not shut up about',
];

const TWO_TRUTHS_ADULT_FRAME_TEMPLATES = [
  'Name three {topic} from a messy night out',
  'Name three {topic} you would not post on the work Slack',
  'Name three {topic} that are a little too honest',
  'Name three {topic} from a chaotic weekend',
  'Name three {topic} you would whisper at 2 a.m.',
  'Name three {topic} that are NSFW-ish but not illegal',
  'Name three {topic} you would delete from your search history',
  'Name three {topic} that spell trouble on a first date',
  'Name three {topic} you would not tell your parents about',
  'Name three {topic} from a lads’ or hen-do disaster story',
  'Name three {topic} you would blame on the group chat',
  'Name three {topic} that are after-hours only',
  'Name three {topic} you would swap stories about over brunch',
  'Name three {topic} that are spicy hot takes',
  'Name three {topic} you would put in a “no context” collage',
  'Name three {topic} that feel like a walk of shame',
  'Name three {topic} you would overshare at a party',
  'Name three {topic} that are “we do not talk about that”',
  'Name three {topic} you would use as red flags (playfully)',
  'Name three {topic} from a festival after dark',
  'Name three {topic} you would not put in the family group chat',
  'Name three {topic} that are dangerously relatable',
  'Name three {topic} you would confess over drinks',
  'Name three {topic} you would only admit after midnight',
  'Name three {topic} that are too spicy for polite company',
  'Name three {topic} you would put on a dare list',
  'Name three {topic} that are late-night DM material',
  'Name three {topic} you would not put on LinkedIn',
  'Name three {topic} from a hotel story you barely remember',
  'Name three {topic} you would roast a mate for liking',
  'Name three {topic} that are unhinged but legal',
  'Name three {topic} you would put in an anonymous confession',
  'Name three {topic} you would avoid on a first date',
  'Name three {topic} you would not bring home to meet your parents',
  'Name three {topic} you would only discuss after the second pint',
];

const STACKED_QUALIFIER_PATTERN =
  /\b(underrated|overrated|classic|iconic|nostalgic|retro|modern|mainstream|underground|obscure|polarising|unexpected|chaotic|wholesome|guilty-pleasure|debate-starting|all-time favourite)\s+(underrated|overrated|classic|iconic|nostalgic|retro|modern|mainstream|underground|obscure|polarising|unexpected|chaotic|wholesome|guilty-pleasure|debate-starting|all-time favourite)\b/i;

/** Stem groups: topic and tail must not repeat the same idea. */
const REDUNDANCY_STEM_GROUPS = [
  ['childhood', 'child', 'children', 'kid', 'kids', 'younger', 'young', 'schoolyard', 'playground'],
  ['holiday', 'holidays', 'festive', 'christmas'],
  ['school', 'uni', 'university', 'lecture', 'exam'],
];

/** Common US spellings / terms we do not want in generated Two Truths copy. */
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

/** Bare mass-noun category labels — invalid before a “that …” clause (need plural phrases from the map). */
const BARE_UNCOUNTABLE_TOPIC_WORDS = new Set([
  'music',
  'food',
  'art',
  'science',
  'comedy',
  'horror',
  'party',
  'weird',
  'tech',
  'tv',
  'anime',
]);

function simplifyLabel(text, fallback = 'things') {
  const cleaned = String(text || '').split(/[(/:-]/)[0].trim();
  return cleaned || fallback;
}

function categoryPhraseFor(category) {
  return simplifyLabel(category?.name, 'topic').toLowerCase();
}

function fallbackTopicsForCategory(category) {
  const label = simplifyLabel(category.name, 'things').toLowerCase();
  return [
    `${label} picks`,
    `iconic ${label} moments`,
    `underrated ${label} deep cuts`,
    `chaotic ${label} stories`,
    `${label} hot takes`,
  ];
}

export function getTwoTruthsTopicNounsForCategory(category) {
  const fromMap = CATEGORY_TOPIC_NOUNS[category?.id];
  if (fromMap?.length) {
    return [...new Map(fromMap.map((t) => [String(t).trim().toLowerCase(), String(t).trim()])).values()];
  }
  return fallbackTopicsForCategory(category);
}

function tokenizeCopy(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns an error string if topic wording is repeated in the prompt tail, else null.
 */
export function detectTwoTruthsTopicRedundancy(topic, main) {
  const topicText = String(topic || '').trim();
  const mainText = String(main || '').trim();
  if (!topicText || !mainText.startsWith('Name three ')) return null;
  const expectedPrefix = `Name three ${topicText}`;
  if (!mainText.startsWith(expectedPrefix)) return null;
  const suffix = mainText.slice(expectedPrefix.length);
  const topicWords = tokenizeCopy(topicText).filter((w) => w.length >= 4);
  const suffixWords = new Set(tokenizeCopy(suffix));
  for (const word of topicWords) {
    if (suffixWords.has(word)) {
      return `redundant content word “${word}” in topic and tail`;
    }
  }
  const topicTokens = new Set(tokenizeCopy(topicText));
  const suffixTokens = tokenizeCopy(suffix);
  for (const group of REDUNDANCY_STEM_GROUPS) {
    const topicHit = group.some((stem) => topicTokens.has(stem));
    if (!topicHit) continue;
    const suffixHit = group.some((stem) => suffixTokens.includes(stem));
    if (suffixHit) {
      return 'redundant stem overlap between topic and tail';
    }
  }
  return null;
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
 * Pass `topic` when validating a fully built main string.
 */
export function validateTwoTruthsPromptMain(main, options = {}) {
  const text = String(main || '').trim();
  if (!text) return 'empty prompt';
  if (!text.startsWith('Name three ')) return 'must start with “Name three ”';
  if (/^Pick three /i.test(text)) return 'use “Name three”, not “Pick three”';
  if (/\bthis category\b/i.test(text)) return 'generic “this category” placeholder';
  if (STACKED_QUALIFIER_PATTERN.test(text)) return 'stacked qualifiers';
  if (/\byou grew up with\b/i.test(text)) return 'invalid topic phrase';
  if (/\bthat aged poorly\b/i.test(text)) return 'invalid topic phrase';
  const americanisms = findAmericanismsInTwoTruthsCopy(text);
  if (americanisms.length) {
    return `Americanism(s): ${americanisms.join(', ')}`;
  }
  const topic = options.topic;
  if (topic) {
    const redundancy = detectTwoTruthsTopicRedundancy(topic, text);
    if (redundancy) return redundancy;
  }
  const thatClause = text.match(/^Name three (.+?)\s+that\s+/i);
  if (thatClause) {
    const topicPhrase = thatClause[1].trim();
    const words = topicPhrase.split(/\s+/);
    if (words.length === 1 && BARE_UNCOUNTABLE_TOPIC_WORDS.has(words[0].toLowerCase())) {
      return `uncountable bare topic “${words[0]}” before “that …”`;
    }
  }
  return null;
}

function renderPromptFrame(frame, topic, categoryPhrase) {
  return frame.replace(/\{topic\}/g, topic).replace(/\{category\}/g, categoryPhrase);
}

function buildPromptList(category, frameTemplates, targetCount, adultOnly) {
  const topics = getTwoTruthsTopicNounsForCategory(category);
  const topicLabel = simplifyLabel(category.name, 'Category');
  const categoryPhrase = categoryPhraseFor(category);
  const seen = new Set();
  const rounds = [];
  let guard = 0;
  const maxGuard = Math.max(targetCount * frameTemplates.length * topics.length * 2, 800);
  while (rounds.length < targetCount && guard < maxGuard) {
    const frame = frameTemplates[guard % frameTemplates.length];
    const topic =
      topics[Math.floor(guard / frameTemplates.length) % topics.length];
    guard += 1;
    const main = renderPromptFrame(frame, topic, categoryPhrase);
    const validationError = validateTwoTruthsPromptMain(main, { topic });
    if (validationError) continue;
    if (seen.has(main)) continue;
    seen.add(main);
    rounds.push({
      hint: `${TWO_TRUTHS_HINTS[rounds.length % TWO_TRUTHS_HINTS.length]} • ${topicLabel}`,
      main,
      previewLabel: 'Type two truths and one lie that fit together.',
      ...(adultOnly ? { adultOnly: true } : {}),
    });
  }
  if (rounds.length < targetCount) {
    throw new Error(
      `Two Truths prompt generation fell short for ${category.id}: ${rounds.length}/${targetCount}`,
    );
  }
  return rounds;
}

export function buildTwoTruthsOneFireRoundsForCategory(
  category,
  count = TWO_TRUTHS_ROUNDS_PER_CATEGORY,
  adultCount = TWO_TRUTHS_ADULT_ROUNDS_PER_CATEGORY,
) {
  const regularCount = Math.max(0, count - adultCount);
  const regular = buildPromptList(
    category,
    TWO_TRUTHS_FRAME_TEMPLATES,
    regularCount,
    false,
  );
  const adult = buildPromptList(
    category,
    TWO_TRUTHS_ADULT_FRAME_TEMPLATES,
    adultCount,
    true,
  );
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
