export const BANNED_WORD_BANK = {
  'prompt::sports::0': ['bat', 'pitcher', 'stadium', 'scoreboard', 'coach'],
  'prompt::sports::1': ['referee', 'supporters', 'captain', 'season', 'training'],
  'prompt::sports::2': ['tournament', 'singles', 'doubles', 'umpire', 'grip'],
  'prompt::sports::3': ['champion', 'fitness', 'crowd', 'aggressive', 'professional'],
  'prompt::food::0': ['crispy', 'restaurant', 'delivery', 'toppings', 'stuffed'],
  'prompt::food::1': ['mustard', 'barbecue', 'greasy', 'handheld', 'snack'],
  'prompt::food::2': ['breakfast', 'steaming', 'sugar', 'morning', 'cafe'],
  'prompt::food::3': ['bakery', 'frosting', 'gooey', 'treat', 'party'],
  'prompt::movies::0': ['franchise', 'merchandise', 'funny', 'family', 'adventure'],
  'prompt::movies::1': ['blockbuster', 'director', 'soundtrack', 'suspense', 'iconic'],
  'prompt::movies::2': ['relationship', 'dramatic', 'emotional', 'chemistry', 'memorable'],
  'prompt::movies::3': ['cinematography', 'director', 'ambitious', 'complex', 'masterpiece'],
  'prompt::music::0': ['frontman', 'album', 'touring', 'anthem', 'fans'],
  'prompt::music::1': ['teenage', 'chorus', 'gigs', 'melody', 'mosh'],
  'prompt::music::2': ['intense', 'stage', 'headline', 'riffs', 'chaotic'],
  'prompt::music::3': ['virtuoso', 'concert', 'legendary', 'solo', 'discography'],
};

const BANNED_WORD_FILLERS = [
  'bluff',
  'sus',
  'vibe',
  'nervous',
  'awkward',
  'shifty',
  'dramatic',
  'sneaky',
  'confident',
  'clueless',
];

export function sanitizeBannedWords(categoryName, hint, main, imposter, words) {
  const forbidden = new Set(
    `${categoryName} ${hint} ${main} ${imposter}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
  const selected = [];
  const seen = new Set();
  const addWord = (word) => {
    if (selected.length >= 5) return;
    const normalized = String(word || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return;
    const parts = normalized.replace(/[^a-z0-9\s-]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (!parts.length || parts.some((part) => forbidden.has(part))) return;
    seen.add(normalized);
    selected.push(String(word).trim());
  };
  (words || []).forEach(addWord);
  BANNED_WORD_FILLERS.forEach(addWord);
  return selected.slice(0, 5);
}

import {
  PICTURE_DLC_MANIFESTS,
  buildPictureRoundsFromManifest,
  validatePictureDlcManifest,
} from './pictureDlcManifests';
import {
  NAME_AND_BLAME_ROUNDS as UPLOADED_NAME_AND_BLAME_ROUNDS,
  SOUND_CLUES_ROUNDS as UPLOADED_SOUND_CLUES_ROUNDS,
} from './specialRoundPromptPools';
import { CATEGORY_PROMPT_PACKS } from './packs/categoryPromptPacks';
import { buildExpandedEntityPrompts, CATEGORY_GUESSABLE_ENTITY_POOLS } from './guessableEntityPools';

export const DEFAULT_CATEGORIES = CATEGORY_PROMPT_PACKS.map((categoryPack) => ({
  ...categoryPack,
  prompts: (categoryPack.prompts || []).map((prompt) => ({ ...prompt })),
}));
const BULK_PROMPTS_PER_CATEGORY = 50;

function isShortEntityPromptText(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized) return false;
  if (/[.!?]/.test(normalized)) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6;
}

for (const category of DEFAULT_CATEGORIES) {
  const hasDedicatedPool = Boolean(CATEGORY_GUESSABLE_ENTITY_POOLS[category.id]);
  const baseEntityPrompts = hasDedicatedPool
    ? (category.prompts || []).filter((prompt) => (
      !prompt?.adultOnly
      && isShortEntityPromptText(prompt?.main)
      && isShortEntityPromptText(prompt?.imposter)
    ))
    : [];
  category.prompts = [
    ...baseEntityPrompts,
    ...buildExpandedEntityPrompts(category.id, category.name, BULK_PROMPTS_PER_CATEGORY),
  ];
}

const CATEGORY_ROUNDS_PER_CATEGORY = 100;
const CATEGORY_ADULT_ROUNDS_PER_CATEGORY = 35;
const SPECIAL_ROUND_HINT_FALLBACK = 'Prompt';

function normalizeSpecialRoundPrompts(prompts = [], { previewLabel = '', soundOnly = false } = {}) {
  return (Array.isArray(prompts) ? prompts : [])
    .map((prompt) => ({
      hint: String(prompt?.hint || SPECIAL_ROUND_HINT_FALLBACK).trim() || SPECIAL_ROUND_HINT_FALLBACK,
      main: String(prompt?.main || '').trim(),
      imposter: String(prompt?.imposter || '').trim(),
      ...(previewLabel ? { previewLabel } : {}),
      ...(soundOnly ? { soundOnly: true } : {}),
    }))
    .filter((prompt) => prompt.main && prompt.imposter);
}

export const NAME_AND_BLAME_ROUNDS = normalizeSpecialRoundPrompts(UPLOADED_NAME_AND_BLAME_ROUNDS, {
  previewLabel: 'Call out players in the lobby without revealing your exact prompt.',
});

export const SOUND_CLUES_ROUNDS = normalizeSpecialRoundPrompts(UPLOADED_SOUND_CLUES_ROUNDS, {
  previewLabel: 'Make the sound only. No words allowed.',
  soundOnly: true,
});

const CHAIN_PROMPTS_PER_CATEGORY = CATEGORY_ROUNDS_PER_CATEGORY;
const CHAIN_ADULT_PROMPTS_PER_CATEGORY = CATEGORY_ADULT_ROUNDS_PER_CATEGORY;
const CHAIN_VIBE_WORDS = ['vibe', 'angle', 'energy', 'detail', 'moment', 'lore'];
const CHAIN_HINT_WORDS = ['twist', 'theme', 'style', 'signal', 'scene', 'clue'];

function simplifyLabel(text, fallback) {
  const cleaned = String(text || '').split(/[(/:-]/)[0].trim();
  return cleaned || fallback;
}

function buildChainWordDeck(topic, hint, seed = 0, isDecoy = false) {
  const topicLabel = simplifyLabel(topic, isDecoy ? 'Decoy' : 'Anchor');
  const hintLabel = simplifyLabel(hint, 'Round');
  const cards = [
    `${topicLabel} ${CHAIN_VIBE_WORDS[seed % CHAIN_VIBE_WORDS.length]}`,
    `${hintLabel} ${CHAIN_HINT_WORDS[(seed + 1) % CHAIN_HINT_WORDS.length]}`,
    `${topicLabel} ${CHAIN_HINT_WORDS[(seed + 2) % CHAIN_HINT_WORDS.length]}`,
    `${hintLabel} ${CHAIN_VIBE_WORDS[(seed + 3) % CHAIN_VIBE_WORDS.length]}`,
  ];
  return [...new Set(cards)].slice(0, 4);
}

function toChainPrompt(prompt, index, adultOnly = false) {
  const chainHint = simplifyLabel(prompt.hint, 'Chain Prompt');
  return {
    hint: `Chain Reaction ${index + 1}: ${chainHint}`,
    main: prompt.main,
    imposter: prompt.imposter,
    mainWords: buildChainWordDeck(prompt.main, prompt.hint, index, false),
    imposterWords: buildChainWordDeck(prompt.imposter, prompt.hint, index + 2, true),
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildChainRoundsForCategory(category) {
  const prompts = category.prompts || [];
  const regularPrompts = prompts.filter((prompt) => !prompt?.adultOnly);
  const adultPrompts = prompts.filter((prompt) => prompt?.adultOnly);
  const regularCount = Math.max(0, CHAIN_PROMPTS_PER_CATEGORY - CHAIN_ADULT_PROMPTS_PER_CATEGORY);
  const chainRounds = [];

  for (let i = 0; i < regularCount; i += 1) {
    const source = regularPrompts[i % regularPrompts.length] || prompts[i % prompts.length];
    if (!source) break;
    chainRounds.push(toChainPrompt(source, i, false));
  }

  for (let i = 0; i < CHAIN_ADULT_PROMPTS_PER_CATEGORY; i += 1) {
    const source = adultPrompts[i % adultPrompts.length] || regularPrompts[i % regularPrompts.length] || prompts[i % prompts.length];
    if (!source) break;
    chainRounds.push(toChainPrompt(source, regularCount + i, true));
  }

  return chainRounds.slice(0, CHAIN_PROMPTS_PER_CATEGORY);
}

export const CHAIN_REACTION_ROUNDS = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.id, buildChainRoundsForCategory(category)])
);

const MEME_DECODER_HINTS = [
  'Meme Reference',
  'Viral Template',
  'Internet Catchphrase',
  'Trend Pair',
  'Social Media Moment',
  'Reaction Macro',
  'Timeline Throwback',
  'Pop Culture Meme',
];
const MEME_DECODER_FORMATS = ['image macro', 'reaction GIF', 'text meme', 'short-form video meme', 'reply meme'];
const MEME_DECODER_ADULT_FORMATS = ['after-hours meme', 'night-out meme', 'dating-app meme', 'group-chat meme', 'party meme'];
const MEME_DECODER_MAIN_THEMES = [
  'Distracted Boyfriend',
  'This Is Fine',
  'Woman Yelling at Cat',
  'Mocking SpongeBob',
  'Drake Hotline Bling',
  'Success Kid',
  'Roll Safe',
  'Hide the Pain Harold',
  'One Does Not Simply',
  'Expanding Brain',
];
const MEME_DECODER_IMPOSTER_THEMES = [
  'Two Buttons',
  'Gru Plan',
  'Disaster Girl',
  'Ancient Aliens Guy',
  'Change My Mind',
  'Surprised Pikachu',
  'Bad Luck Brian',
  'Is This a Pigeon?',
  'Left Exit 12 Off Ramp',
  'Running Away Balloon',
];
const MEME_DECODER_ADULT_MAIN_THEMES = [
  'Late-night text screenshot meme',
  'Dating app bio meme',
  'Party outfit regret meme',
  'Afterparty taxi queue meme',
  'Casino night meme',
  'VIP lounge meme',
  'Karaoke confession meme',
  'Holiday fling meme',
  'Nightclub queue meme',
  'Walk-home-at-sunrise meme',
];
const MEME_DECODER_ADULT_IMPOSTER_THEMES = [
  'Awkward first-date meme',
  'Wrong-chat message meme',
  'Ex-at-the-party meme',
  'Hotel checkout meme',
  'Group chat scandal meme',
  'Slow reply meme',
  'Mystery lipstick mark meme',
  'After-hours diner meme',
  'Dancefloor drama meme',
  'Missed-last-train meme',
];

function buildMemeDecoderPrompt(category, index, adultOnly = false) {
  const topicLabel = simplifyLabel(category?.name, 'General');
  const formatPool = adultOnly ? MEME_DECODER_ADULT_FORMATS : MEME_DECODER_FORMATS;
  const mainPool = adultOnly ? MEME_DECODER_ADULT_MAIN_THEMES : MEME_DECODER_MAIN_THEMES;
  const imposterPool = adultOnly ? MEME_DECODER_ADULT_IMPOSTER_THEMES : MEME_DECODER_IMPOSTER_THEMES;
  const formatMain = formatPool[index % formatPool.length];
  const formatImposter = formatPool[(index + 2) % formatPool.length];
  return {
    hint: `${MEME_DECODER_HINTS[index % MEME_DECODER_HINTS.length]} • ${topicLabel}`,
    main: `${mainPool[index % mainPool.length]} as a ${formatMain}`,
    imposter: `${imposterPool[index % imposterPool.length]} as a ${formatImposter}`,
    previewLabel: 'Explain the meme vibe and format without quoting exact text.',
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildMemeDecoderRoundsForCategory(
  category,
  count = CATEGORY_ROUNDS_PER_CATEGORY,
  adultCount = CATEGORY_ADULT_ROUNDS_PER_CATEGORY
) {
  const regularCount = Math.max(0, count - adultCount);
  const rounds = [];
  for (let i = 0; i < regularCount; i += 1) rounds.push(buildMemeDecoderPrompt(category, i, false));
  for (let i = 0; i < adultCount; i += 1) rounds.push(buildMemeDecoderPrompt(category, regularCount + i, true));
  return rounds;
}

export const MEME_DECODER_ROUNDS = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.id, buildMemeDecoderRoundsForCategory(category)])
);

const SOUND_OFF_HINTS = [
  'Famous Place Sound',
  'Animal Sound',
  'Vehicle Sound',
  'Crowd Sound',
  'Nature Sound',
  'City Sound',
  'Household Sound',
  'Event Sound',
];
const SOUND_OFF_MAIN = [
  'Waves near a lighthouse',
  'Lion roar at a zoo',
  'Jet engine on runway',
  'Football crowd cheering',
  'Thunderstorm in mountains',
  'Subway arriving underground',
  'Microwave beeping',
  'Arcade machine startup',
  'Cat meowing at a door',
  'Theme park rollercoaster scream',
];
const SOUND_OFF_IMPOSTER = [
  'Waves at a busy harbor',
  'Tiger growl in a reserve',
  'Race car engine rev',
  'Rugby crowd chanting',
  'Fireworks over city',
  'Tram bell in downtown street',
  'Oven timer ding',
  'Casino slot machine jingle',
  'Dog barking at gate',
  'Water slide scream',
];
const SOUND_OFF_ADULT_MAIN = [
  'Nightclub bass drop',
  'Casino roulette spin',
  'Cocktail glasses clinking',
  'Hotel keycard beep',
  'Late-night taxi door slam',
  'Karaoke crowd cheer',
  'High heels on hallway floor',
  'Rooftop party laughter',
  'Beach bar music from distance',
  'VIP lounge door buzz',
];
const SOUND_OFF_ADULT_IMPOSTER = [
  'Nightclub crowd chant',
  'Poker chips on table',
  'Wine bottle cork pop',
  'Elevator ding at hotel',
  'Taxi meter beep',
  'Open mic crowd clap',
  'Sneakers on hallway tiles',
  'Pool party splash',
  'Boardwalk club music',
  'Private club door lock',
];

function buildSoundOffPrompt(category, index, adultOnly = false) {
  const topicLabel = simplifyLabel(category?.name, 'General');
  const mainPool = adultOnly ? SOUND_OFF_ADULT_MAIN : SOUND_OFF_MAIN;
  const imposterPool = adultOnly ? SOUND_OFF_ADULT_IMPOSTER : SOUND_OFF_IMPOSTER;
  return {
    hint: `${SOUND_OFF_HINTS[index % SOUND_OFF_HINTS.length]} • ${topicLabel}`,
    main: mainPool[index % mainPool.length],
    imposter: imposterPool[index % imposterPool.length],
    previewLabel: 'Make a sound/noise only. No words allowed.',
    soundOnly: true,
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildSoundOffRoundsForCategory(
  category,
  count = CATEGORY_ROUNDS_PER_CATEGORY,
  adultCount = CATEGORY_ADULT_ROUNDS_PER_CATEGORY
) {
  const regularCount = Math.max(0, count - adultCount);
  const rounds = [];
  for (let i = 0; i < regularCount; i += 1) rounds.push(buildSoundOffPrompt(category, i, false));
  for (let i = 0; i < adultCount; i += 1) rounds.push(buildSoundOffPrompt(category, regularCount + i, true));
  return rounds;
}

export const SOUND_OFF_ROUNDS = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.id, buildSoundOffRoundsForCategory(category)])
);

const OFFTOPIC_HINTS = [
  'Linked Landmarks',
  'Connected Places',
  'Related Animals',
  'Similar Things',
  'Famous Pair',
  'Category Match',
  'Close Connection',
  'Degree-of-Separation Test',
];
const OFFTOPIC_MAIN = [
  'Eiffel Tower and Arc de Triomphe',
  'Lion and Tiger',
  'Pizza and Calzone',
  'London and Big Ben',
  'Taylor Swift and Adele',
  'PlayStation and Xbox',
  'Volcano and Earthquake',
  'Shark and Dolphin',
  'Football and Rugby',
  'Batman and Superman',
];
const OFFTOPIC_IMPOSTER = [
  'Washing machine and toaster',
  'Penguin and skateboard',
  'Umbrella and jellyfish',
  'Sofa and parachute',
  'Keyboard and volcano',
  'Lighthouse and banana',
  'Helmet and teapot',
  'Backpack and asteroid',
  'Curtain and submarine',
  'Pillow and jet engine',
];
const OFFTOPIC_ADULT_MAIN = [
  'Nightclub and cocktail bar',
  'Casino and poker table',
  'Rooftop party and VIP lounge',
  'Late-night diner and taxi rank',
  'Karaoke booth and dance floor',
  'Beach club and sunset party',
  'Hotel suite and minibar',
  'Festival afterparty and camp site',
  'Speakeasy and whisky lounge',
  'Private club and dress code',
];
const OFFTOPIC_ADULT_IMPOSTER = [
  'Garden shed and stapler',
  'Library card and snorkel',
  'Bus ticket and kettle',
  'Spoon and snowmobile',
  'Doorbell and cactus',
  'Notebook and traffic cone',
  'Laundry basket and moon rock',
  'Wall clock and bowling shoe',
  'Paperclip and hamster wheel',
  'Vacuum cleaner and surfboard',
];

function buildOffTopicPrompt(category, index, adultOnly = false) {
  const topicLabel = simplifyLabel(category?.name, 'General');
  const mainPool = adultOnly ? OFFTOPIC_ADULT_MAIN : OFFTOPIC_MAIN;
  const imposterPool = adultOnly ? OFFTOPIC_ADULT_IMPOSTER : OFFTOPIC_IMPOSTER;
  return {
    hint: `${OFFTOPIC_HINTS[index % OFFTOPIC_HINTS.length]} • ${topicLabel}`,
    main: mainPool[index % mainPool.length],
    imposter: imposterPool[index % imposterPool.length],
    previewLabel: 'Everyone argues their case. Liars got an irrelevant topic.',
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildOffTopicRoundsForCategory(
  category,
  count = CATEGORY_ROUNDS_PER_CATEGORY,
  adultCount = CATEGORY_ADULT_ROUNDS_PER_CATEGORY
) {
  const regularCount = Math.max(0, count - adultCount);
  const rounds = [];
  for (let i = 0; i < regularCount; i += 1) rounds.push(buildOffTopicPrompt(category, i, false));
  for (let i = 0; i < adultCount; i += 1) rounds.push(buildOffTopicPrompt(category, regularCount + i, true));
  return rounds;
}

export const OFFTOPIC_DEFENSE_ROUNDS = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.id, buildOffTopicRoundsForCategory(category)])
);

export const NOISE_OFF_ROUNDS = SOUND_OFF_ROUNDS;

const OPINION_ADULT_ENTITIES_MAIN = [
  'Nightclub',
  'Cocktail bar',
  'Casino',
  'VIP lounge',
  'Rooftop party',
  'Late-night diner',
  'Beach club',
  'Karaoke booth',
  'Hotel suite',
  'Festival campsite',
];
const OPINION_ADULT_ENTITIES_IMPOSTER = [
  'Jazz club',
  'Wine bar',
  'Poker room',
  'Private lounge',
  'Pool party',
  '24-hour cafe',
  'Resort bar',
  'Open mic stage',
  'Penthouse lounge',
  'Holiday hostel',
];

export const OPINION_ROUNDS = [
  { hint: 'Controversial Take', main: 'Pineapple absolutely belongs on pizza.', imposter: 'Pineapple absolutely does not belong on pizza.' },
  { hint: 'Hot Take', main: 'Cinema is better than watching films at home.', imposter: 'Watching films at home is better than the cinema.' },
  { hint: 'Debate Night', main: 'Summer is the best season.', imposter: 'Winter is the best season.' },
  { hint: 'Spicy Opinion', main: 'Tea is better than coffee.', imposter: 'Coffee is better than tea.' },
  { hint: 'Questionable Belief', main: 'Dogs are better pets than cats.', imposter: 'Cats are better pets than dogs.' },
  { hint: 'Argument Starter', main: 'Physical buttons are better than touchscreens.', imposter: 'Touchscreens are better than physical buttons.' },
  { hint: 'Gaming Debate', main: 'Single-player games are better than multiplayer.', imposter: 'Multiplayer games are better than single-player.' },
  { hint: 'Music Debate', main: 'Lyrics matter more than melody.', imposter: 'Melody matters more than lyrics.' },
  { hint: 'Travel Debate', main: 'City breaks beat beach holidays.', imposter: 'Beach holidays beat city breaks.' },
  { hint: 'Food Debate', main: 'Breakfast is the best meal of the day.', imposter: 'Dinner is the best meal of the day.' },
  { hint: 'Phone Debate', main: 'Small phones are better than big phones.', imposter: 'Big phones are better than small phones.' },
  { hint: 'Social Debate', main: 'Group holidays are better than solo travel.', imposter: 'Solo travel is better than group holidays.' },
  { hint: 'Work Debate', main: 'Working from home is better than office work.', imposter: 'Office work is better than working from home.' },
  { hint: 'Fashion Debate', main: 'Comfort beats style every time.', imposter: 'Style beats comfort every time.' },
  { hint: 'TV Debate', main: 'Binge-watching ruins good shows.', imposter: 'Binge-watching improves good shows.' },
  { hint: 'Life Debate', main: 'Being early is respectful.', imposter: 'Being exactly on time is enough.' },
  { hint: 'After-dark Debate (18+)', main: 'A chaotic first date is more fun than a perfect one.', imposter: 'A perfect first date is better than chaos.', adultOnly: true },
  { hint: 'Messy Texting (18+)', main: 'Double-texting is totally fine.', imposter: 'Double-texting is desperate.', adultOnly: true },
  { hint: 'Party Chaos (18+)', main: 'Drunk karaoke is always a good idea.', imposter: 'Drunk karaoke is always a bad idea.', adultOnly: true },
  { hint: 'Relationship Debate (18+)', main: 'Sharing phone passwords is healthy.', imposter: 'Sharing phone passwords is unhealthy.', adultOnly: true },
  { hint: 'Non-PC Hot Take (18+)', main: 'Brutal honesty is kinder than polite lying.', imposter: 'Polite lying is kinder than brutal honesty.', adultOnly: true },
  { hint: 'Workplace Chaos (18+)', main: 'Hookups at office parties are never worth it.', imposter: 'Hookups at office parties are worth the chaos.', adultOnly: true },
];

const OPINION_EXPANSION = {
  regularHints: ['Opinion Clash', 'Debate Duel', 'Spicy Take', 'Hot Mic Debate', 'Crowd Argument'],
  regularMain: [
    'Road trips are better than city breaks.',
    'Live concerts are better than festivals.',
    'Books are better than podcasts.',
    'Voice notes are better than text messages.',
    'Night owls are more productive than early birds.',
    'Plan-ahead people are more fun than spontaneous people.',
    'Board games beat video games for parties.',
    'Cooking at home beats takeaway every time.',
    'Window seats are better than aisle seats.',
    'Short hair is easier to style than long hair',
  ],
  regularImposter: [
    'City breaks are better than road trips.',
    'Festivals are better than live concerts.',
    'Podcasts are better than books.',
    'Text messages are better than voice notes.',
    'Early birds are more productive than night owls.',
    'Spontaneous people are more fun than plan-ahead people.',
    'Video games beat board games for parties.',
    'Takeaway beats cooking at home every time.',
    'Aisle seats are better than window seats.',
    'Long hair is easier to style than short hair.',
  ],
  adultHints: ['Adult Venue Debate', 'Nightlife Matchup', 'Late-Night Venue Pick', 'After-Hours Venue Duel', 'Social Spot Debate'],
  adultMain: OPINION_ADULT_ENTITIES_MAIN.map((entity) => `${entity} is the better late-night venue.`),
  adultImposter: OPINION_ADULT_ENTITIES_IMPOSTER.map((entity) => `${entity} is the better late-night venue.`),
};

function buildOpinionBatch(adultOnly = false, count = 50) {
  const hints = adultOnly ? OPINION_EXPANSION.adultHints : OPINION_EXPANSION.regularHints;
  const mains = adultOnly ? OPINION_EXPANSION.adultMain : OPINION_EXPANSION.regularMain;
  const imposters = adultOnly ? OPINION_EXPANSION.adultImposter : OPINION_EXPANSION.regularImposter;
  return Array.from({ length: count }, (_, index) => ({
    hint: `${hints[index % hints.length]} ${index + 1}`,
    main: mains[index % mains.length],
    imposter: imposters[index % imposters.length],
    ...(adultOnly ? { adultOnly: true } : {}),
  }));
}

OPINION_ROUNDS.push(
  ...buildOpinionBatch(false, 50),
  ...buildOpinionBatch(true, 50)
);

function buildPicturePromptRounds() {
  return PICTURE_DLC_MANIFESTS
    .filter((manifest) => validatePictureDlcManifest(manifest))
    .flatMap((manifest) => buildPictureRoundsFromManifest(manifest));
}

export const MEDIA_ROUNDS = {
  picture: buildPicturePromptRounds(),
  sound: [
    { hint: 'Sound Clue', main: 'arcade-coin-drop', imposter: 'slot-machine-jingle', previewLabel: 'Audio round placeholder' },
    { hint: 'Sound Clue', main: 'lion-roar', imposter: 'tiger-growl', previewLabel: 'Audio round placeholder' },
    { hint: 'Sound Clue', main: 'thunder-crack', imposter: 'firework-bang', previewLabel: 'Audio round placeholder' },
    { hint: 'Sound Clue', main: 'crowd-chanting', imposter: 'stadium-booing', previewLabel: 'Audio round placeholder' },
  ],
  video: [
    { hint: 'Video Clip', main: 'crowd-cheering-goal', imposter: 'crowd-cheering-knockout', previewLabel: 'Video round placeholder' },
    { hint: 'Video Clip', main: 'wave-crashing-beach', imposter: 'stormy-harbour', previewLabel: 'Video round placeholder' },
    { hint: 'Video Clip', main: 'city-time-lapse-night', imposter: 'city-time-lapse-rain', previewLabel: 'Video round placeholder' },
    { hint: 'Video Clip', main: 'dog-catching-frisbee', imposter: 'dog-chasing-bubble', previewLabel: 'Video round placeholder' },
  ],
};

const MEDIA_EXPANSION = {
  sound: {
    hint: 'Sound Clue',
    regularMain: ['crowd-goal-cheer', 'engine-rev-quick', 'rain-on-window', 'crow-caw-echo', 'train-brake-screech'],
    regularImposter: ['crowd-knockout-cheer', 'motorbike-rev', 'hail-on-window', 'raven-call-echo', 'tram-brake-screech'],
    adultMain: [
      'nightclub-bassline',
      'casino-roulette-wheel',
      'cocktail-glasses-clink',
      'karaoke-crowd-cheer',
      'vip-lounge-door-buzz',
      'rooftop-party-laughter',
      'hotel-keycard-beep',
      'taxi-door-slam-midnight',
      'beach-club-dj-loop',
      'festival-campsite-crowd',
    ],
    adultImposter: [
      'jazz-club-saxophone-riff',
      'poker-chip-stack',
      'wine-bar-cork-pop',
      'open-mic-stage-applause',
      'private-lounge-entry-chime',
      'pool-party-splash',
      'penthouse-elevator-ding',
      'late-night-cafe-cup-clink',
      'resort-bar-ambient-beat',
      'hostel-lobby-door-bell',
    ],
  },
  video: {
    hint: 'Video Clip',
    regularMain: ['skatepark-trick-landing', 'concert-crowd-wave', 'storm-over-sea', 'dog-splashing-lake', 'arcade-speedrun-closeup'],
    regularImposter: ['skatepark-trick-fall', 'concert-crowd-mosh', 'calm-sea-sunrise', 'dog-running-meadow', 'arcade-fightinggame-closeup'],
    adultMain: [
      'nightclub-dance-floor',
      'casino-poker-table',
      'cocktail-bar-counter',
      'vip-lounge-seating',
      'rooftop-party-sunset',
      'late-night-diner-neon',
      'beach-club-evening',
      'karaoke-room-stage',
      'hotel-suite-balcony',
      'festival-afterparty-camp',
    ],
    adultImposter: [
      'jazz-club-stage',
      'wine-bar-patio',
      'private-lounge-hallway',
      'pool-party-deck',
      'open-mic-cafe-stage',
      'penthouse-lift-lobby',
      '24h-cafe-window-seat',
      'resort-bar-promenade',
      'hostel-common-room-night',
      'poker-room-entrance',
    ],
  },
};

function buildMediaBatch(type, adultOnly = false, count = 50) {
  const config = MEDIA_EXPANSION[type];
  const mains = adultOnly ? config.adultMain : config.regularMain;
  const imposters = adultOnly ? config.adultImposter : config.regularImposter;
  return Array.from({ length: count }, (_, index) => ({
    hint: `${config.hint} ${index + 1}`,
    main: mains[index % mains.length],
    imposter: imposters[(index + 1) % imposters.length],
    previewLabel: `${type[0].toUpperCase()}${type.slice(1)} round placeholder`,
    ...(adultOnly ? { adultOnly: true } : {}),
  }));
}

MEDIA_ROUNDS.sound.push(...buildMediaBatch('sound', false, 50), ...buildMediaBatch('sound', true, 50));
MEDIA_ROUNDS.video.push(...buildMediaBatch('video', false, 50), ...buildMediaBatch('video', true, 50));

export const GRILL_EM_ROUNDS = [
  {
    hint: "AI Mystery Topic",
    main: 'Retro arcade game cabinet',
    imposter: 'Retro arcade game cabinet',
    aiPrompt: 'You are describing a retro arcade game cabinet. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Cheese pizza',
    imposter: 'Cheese pizza',
    aiPrompt: 'You are describing cheese pizza. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'House cat',
    imposter: 'House cat',
    aiPrompt: 'You are describing a house cat. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Electric guitar',
    imposter: 'Electric guitar',
    aiPrompt: 'You are describing an electric guitar. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Theme park rollercoaster',
    imposter: 'Theme park rollercoaster',
    aiPrompt: 'You are describing a theme park rollercoaster. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Laptop computer',
    imposter: 'Laptop computer',
    aiPrompt: 'You are describing a laptop computer. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Football stadium',
    imposter: 'Football stadium',
    aiPrompt: 'You are describing a football stadium. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Banana smoothie',
    imposter: 'Banana smoothie',
    aiPrompt: 'You are describing a banana smoothie. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Rainy day',
    imposter: 'Rainy day',
    aiPrompt: 'You are describing a rainy day. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Zombie movie',
    imposter: 'Zombie movie',
    aiPrompt: 'You are describing a zombie movie. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Haunted house',
    imposter: 'Haunted house',
    aiPrompt: 'You are describing a haunted house. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Theme song',
    imposter: 'Theme song',
    aiPrompt: 'You are describing a TV theme song. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Board game night',
    imposter: 'Board game night',
    aiPrompt: 'You are describing board game night. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: "AI Mystery Topic",
    main: 'Alien planet',
    imposter: 'Alien planet',
    aiPrompt: 'You are describing an alien planet. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
  },
  {
    hint: 'AI Mystery Topic (18+)',
    main: 'Nightclub',
    imposter: 'Nightclub',
    aiPrompt: 'You are describing a nightclub venue. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
    adultOnly: true,
  },
  {
    hint: 'AI Mystery Topic (18+)',
    main: 'Casino',
    imposter: 'Casino',
    aiPrompt: 'You are describing a casino venue. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
    adultOnly: true,
  },
];

const GRILL_GUESSABLE_ENTITY_POOLS = {
  person: [
    'Taylor Swift',
    'Elvis Presley',
    'Freddie Mercury',
    'David Attenborough',
    'Albert Einstein',
    'Usain Bolt',
    'Adele',
    'Beyonce',
  ],
  band: [
    'The Beatles',
    'Queen',
    'Coldplay',
    'Linkin Park',
    'Nirvana',
    'Arctic Monkeys',
    'Metallica',
    'Imagine Dragons',
  ],
  location: [
    'London',
    'Paris',
    'New York',
    'Tokyo',
    'Sydney',
    'Rome',
    'Barcelona',
    'Dubai',
  ],
  landmark: [
    'Eiffel Tower',
    'Big Ben',
    'Statue of Liberty',
    'Sydney Opera House',
    'Great Wall of China',
    'Taj Mahal',
    'Golden Gate Bridge',
    'Colosseum',
  ],
  animal: [
    'Lion',
    'Elephant',
    'Dolphin',
    'Penguin',
    'Giraffe',
    'Tiger',
    'Koala',
    'Wolf',
  ],
};

function buildGuessableGrillRounds() {
  const nounForType = {
    person: 'person',
    band: 'band',
    location: 'location',
    landmark: 'landmark',
    animal: 'animal',
  };
  const rounds = [];
  Object.entries(GRILL_GUESSABLE_ENTITY_POOLS).forEach(([entityType, entities]) => {
    entities.forEach((entityName, index) => {
      rounds.push({
        hint: `AI Mystery Topic • ${entityType.toUpperCase()} ${index + 1}`,
        main: `${entityType}: ${entityName}`,
        imposter: `${entityType}: ${entityName}`,
        aiPrompt: `You are describing the ${nounForType[entityType]} "${entityName}". Answer in short clues that are truthful, concise, and guessable. Avoid saying the exact name.`,
        previewLabel: `Players interrogate the AI about a hidden ${entityType}.`,
      });
    });
  });
  return rounds;
}

GRILL_EM_ROUNDS.unshift(...buildGuessableGrillRounds());

const GRILL_EXPANSION = {
  regularTopics: [
    'Snowy mountain cabin', 'Giant ferris wheel', 'Vintage motorcycle', 'Bowling alley', 'Sushi conveyor belt',
    'Space rocket launch', 'Haunted carnival', 'City marathon', 'Comic convention', 'Roller disco rink',
  ],
  adultTopics: [
    'Nightclub',
    'Cocktail bar',
    'Casino',
    'VIP lounge',
    'Rooftop party',
    'Late-night diner',
    'Beach club',
    'Karaoke booth',
    'Hotel suite',
    'Festival campsite',
    'Jazz club',
    'Wine bar',
    'Poker room',
    'Private lounge',
    'Pool party',
    'Open mic stage',
    'Penthouse lounge',
    '24-hour cafe',
    'Resort bar',
    'Holiday hostel',
  ],
};

function toGrillRound(topic, index, adultOnly = false) {
  return {
    hint: adultOnly ? `AI Mystery Topic (18+) ${index + 1}` : `AI Mystery Topic ${index + 1}`,
    main: topic,
    imposter: topic,
    aiPrompt: `You are describing ${topic.toLowerCase()}. Keep answers brief, playful, and vague.`,
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildGrillBatch(adultOnly = false, count = 50) {
  const pool = adultOnly ? GRILL_EXPANSION.adultTopics : GRILL_EXPANSION.regularTopics;
  return Array.from({ length: count }, (_, index) => toGrillRound(pool[index % pool.length], index, adultOnly));
}

GRILL_EM_ROUNDS.push(
  ...buildGrillBatch(false, 50),
  ...buildGrillBatch(true, 50)
);

const BANNED_WORD_STOPLIST = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'your', 'this', 'that', 'are', 'was', 'were', 'they',
  'them', 'their', 'have', 'has', 'had', 'not', 'too', 'you', 'our', 'its', 'but', 'than', 'then',
  'after', 'before', 'night', 'round', 'clue', 'global', 'prompt', 'topic', 'debate', 'picture', 'video',
  'sound', 'classic', 'chaos', 'mode', 'take',
]);

function tokenizeForBannedWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length >= 3 && !BANNED_WORD_STOPLIST.has(token));
}

function autoBannedWords(entry, fallbackWords = []) {
  const tokens = [
    ...tokenizeForBannedWords(entry?.hint),
    ...tokenizeForBannedWords(entry?.main),
    ...tokenizeForBannedWords(entry?.imposter),
    ...tokenizeForBannedWords(entry?.aiPrompt),
  ];
  const unique = [...new Set(tokens)];
  const selected = unique.slice(0, 5);
  if (selected.length >= 5) return selected;
  const filler = ['bluff', 'sus', 'vibe', 'chaos', 'nervous', ...fallbackWords];
  for (const word of filler) {
    if (!selected.includes(word) && selected.length < 5) selected.push(word);
  }
  return selected.slice(0, 5);
}

function ensureBannedWordCoverage() {
  DEFAULT_CATEGORIES.forEach((category) => {
    category.prompts.forEach((prompt, index) => {
      const key = `prompt::${category.id}::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
    (CHAIN_REACTION_ROUNDS[category.id] || []).forEach((prompt, index) => {
      const key = `chain::${category.id}::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
    (MEME_DECODER_ROUNDS[category.id] || []).forEach((prompt, index) => {
      const key = `meme::${category.id}::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
    (SOUND_OFF_ROUNDS[category.id] || []).forEach((prompt, index) => {
      const key = `noise::${category.id}::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
    (OFFTOPIC_DEFENSE_ROUNDS[category.id] || []).forEach((prompt, index) => {
      const key = `offtopic::${category.id}::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
  });
  OPINION_ROUNDS.forEach((prompt, index) => {
    const key = `opinion::global::${index}`;
    BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
  });
  NAME_AND_BLAME_ROUNDS.forEach((prompt, index) => {
    const key = `nameblame::global::${index}`;
    BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
  });
  SOUND_CLUES_ROUNDS.forEach((prompt, index) => {
    const key = `noise::global::${index}`;
    BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
  });
  GRILL_EM_ROUNDS.forEach((prompt, index) => {
    const key = `grill::global::${index}`;
    BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
  });
  Object.keys(MEDIA_ROUNDS).forEach((type) => {
    MEDIA_ROUNDS[type].forEach((prompt, index) => {
      const key = `${type}::global::${index}`;
      BANNED_WORD_BANK[key] = autoBannedWords(prompt, BANNED_WORD_BANK[key] || []);
    });
  });
}

ensureBannedWordCoverage();
