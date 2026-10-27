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

const TWO_TRUTHS_FRAME_TEMPLATES = [
  'Name three {topic}',
  'Name your three favorite {topic}',
  'Pick three {topic} you would defend in an argument',
  'Name three {topic} everyone here should know',
  'Name three {topic} that scream this category',
  'Name three {topic} you are weirdly picky about',
  'Name three {topic} you would put on a starter pack',
  'Name three underrated {topic}',
  'Name three {topic} that are overrated',
  'Name three chaotic {topic}',
  'Name three wholesome {topic}',
  'Name three {topic} from your childhood',
  'Name three {topic} you discovered too late',
  'Name three {topic} you would recommend to a newbie',
  'Name three {topic} that always start debates',
  'Name three {topic} you secretly judge people for liking',
  'Name three {topic} you would ban from this category',
  'Name three {topic} that instantly date you',
  'Name three {topic} you would take to a desert island',
  'Name three {topic} you would put in a time capsule',
  'Name three {topic} you would use as passwords (bad idea)',
  'Name three {topic} that feel nostalgic',
  'Name three {topic} that feel overrated on social media',
  'Name three {topic} you would pitch as a collab',
  'Name three {topic} that belong in a montage',
  'Name three {topic} you would cast in a reboot',
  'Name three {topic} that are guilty pleasures',
  'Name three {topic} you would put on a bingo card',
  'Name three {topic} that sound fake but are real',
  'Name three {topic} you would explain to an alien',
  'Name three {topic} you would put on a pub quiz',
  'Name three {topic} that would start a group chat war',
  'Name three {topic} you would never admit you like',
  'Name three {topic} you would put on a tier list S-row',
  'Name three {topic} you would put on a tier list F-row',
  'Name three {topic} that feel very “main character”',
  'Name three {topic} that feel very “side quest”',
  'Name three {topic} you would use as icebreakers',
  'Name three {topic} you would put in a care package',
  'Name three {topic} that belong in a chaotic bundle',
];

const TWO_TRUTHS_TOPIC_QUALIFIERS = [
  'famous',
  'underrated',
  'overrated',
  'chaotic',
  'wholesome',
  'nostalgic',
  'iconic',
  'cringe',
  'elite',
  'mid',
  'forbidden',
  'unhinged',
  'cozy',
  'cursed',
  'legendary',
  'obscure',
  'mainstream',
  'underground',
  'retro',
  'modern',
  'classic',
  'spicy',
  'mild',
  'unexpected',
  'polarizing',
  'comfort',
  'guilty-pleasure',
  'debate-starting',
  'room-dividing',
  'all-time',
];

const TWO_TRUTHS_ADULT_FRAME_TEMPLATES = [
  'Name three {topic} from a messy night out',
  'Name three {topic} you would not put on a work Slack',
  'Name three {topic} that are a little too honest',
  'Name three {topic} from a chaotic weekend',
  'Name three {topic} you would whisper at 2AM',
  'Name three {topic} that are NSFW-ish but not illegal',
  'Name three {topic} you would delete from your search history',
  'Name three {topic} that spell trouble on a first date',
  'Name three {topic} you would not tell your parents about',
  'Name three {topic} from a “what happens in Vegas” story',
  'Name three {topic} that are horny on main energy',
  'Name three {topic} you would blame on the group chat',
  'Name three {topic} that are after-hours only',
  'Name three {topic} you would swap stories about at brunch',
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
  'Name three {topic} that are chaotic flirting energy',
  'Name three {topic} you would meme about the next morning',
  'Name three {topic} that are “I was in my twenties” coded',
  'Name three {topic} you would put on a dare list',
  'Name three {topic} that are late-night DM material',
  'Name three {topic} you would not put on LinkedIn',
  'Name three {topic} from a hotel story you barely remember',
  'Name three {topic} that are “no receipts” energy',
  'Name three {topic} you would roast a friend for liking',
  'Name three {topic} that are unhinged but legal',
  'Name three {topic} you would put in an anonymous confession',
];

function simplifyLabel(text, fallback = 'topic') {
  const cleaned = String(text || '').split(/[(/:-]/)[0].trim();
  return cleaned || fallback;
}

function deriveTopicNouns(category) {
  const topics = [];
  const fromMap = CATEGORY_TOPIC_NOUNS[category.id];
  if (fromMap?.length) topics.push(...fromMap);
  const label = simplifyLabel(category.name, 'topic');
  topics.push(
    label,
    `${label} icons`,
    `${label} legends`,
    `${label} deep cuts`,
    `iconic ${label} moments`,
    `controversial ${label} takes`,
    `${label} you grew up with`,
    `${label} that aged poorly`,
    `underrated ${label}`,
    `overrated ${label}`,
  );
  for (const prompt of category.prompts || []) {
    const main = String(prompt?.main || '').trim();
    if (!main || main.length > 42) continue;
    if (/[.!?]/.test(main)) continue;
    topics.push(main);
  }
  return [...new Set(topics.map((t) => String(t).trim()).filter(Boolean))];
}

function qualifyTopic(topic, qualifierIndex) {
  const qualifier =
    TWO_TRUTHS_TOPIC_QUALIFIERS[
      qualifierIndex % TWO_TRUTHS_TOPIC_QUALIFIERS.length
    ];
  if (!qualifier) return topic;
  if (topic.toLowerCase().startsWith(qualifier)) return topic;
  return `${qualifier} ${topic}`;
}

function buildPromptList(category, frameTemplates, targetCount, adultOnly) {
  const topics = deriveTopicNouns(category);
  if (!topics.length) topics.push(simplifyLabel(category.name, 'things'));
  const topicLabel = simplifyLabel(category.name, 'Category');
  const seen = new Set();
  const rounds = [];
  let frameIndex = 0;
  let topicIndex = 0;
  let qualifierIndex = 0;
  let guard = 0;
  const maxGuard = Math.max(targetCount * frameTemplates.length * 4, 500);
  while (rounds.length < targetCount && guard < maxGuard) {
    guard += 1;
    const frame = frameTemplates[frameIndex % frameTemplates.length];
    const baseTopic = topics[topicIndex % topics.length];
    const topic = qualifyTopic(baseTopic, qualifierIndex);
    frameIndex += 1;
    topicIndex += 1;
    qualifierIndex += 1;
    const main = frame.replace(/\{topic\}/g, topic);
    if (seen.has(main)) continue;
    seen.add(main);
    rounds.push({
      hint: `${TWO_TRUTHS_HINTS[rounds.length % TWO_TRUTHS_HINTS.length]} • ${topicLabel}`,
      main,
      previewLabel: 'Type two truths and one lie that blend together.',
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
