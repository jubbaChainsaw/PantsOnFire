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

export function sanitizeBannedWords(categoryName, hint, main, imposter, words) {
  const forbidden = new Set(
    `${categoryName} ${hint} ${main} ${imposter}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
  return (words || []).filter((word) => {
    const parts = word.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim().split(/\s+/).filter(Boolean);
    return parts.length && !parts.some((part) => forbidden.has(part));
  }).slice(0, 5);
}

import {
  PICTURE_DLC_MANIFESTS,
  buildPictureRoundsFromManifest,
  validatePictureDlcManifest,
} from './pictureDlcManifests';
import { CATEGORY_PROMPT_PACKS } from './packs/categoryPromptPacks';

export const DEFAULT_CATEGORIES = CATEGORY_PROMPT_PACKS.map((categoryPack) => ({
  ...categoryPack,
  prompts: (categoryPack.prompts || []).map((prompt) => ({ ...prompt })),
}));

const BULK_PROMPTS_PER_CATEGORY = 50;

const CATEGORY_EXPANSION_CONFIG = {
  sports: {
    hintBase: 'Sports Showdown',
    regularMain: ['Basketball', 'Football', 'Tennis', 'Boxing', 'Cricket', 'Volleyball', 'Rugby', 'Ice Hockey', 'Formula 1', 'Surfing'],
    regularImposter: ['Baseball', 'American Football', 'Badminton', 'MMA', 'Baseball', 'Handball', 'AFL', 'Lacrosse', 'Rally Racing', 'Skateboarding'],
    adultMain: ['Locker room brag', 'After-party kiss', 'Victory lap flirt', 'VIP table flex', 'Cheeky post-match selfie', 'Shirt-off celebration'],
    adultImposter: ['Walk-of-shame ride home', 'Awkward rebound date', 'Messy ex text at midnight', 'Jealous sideline drama', 'Cringe drunk voicemail', 'Taxi queue argument'],
  },
  food: {
    hintBase: 'Food Face-Off',
    regularMain: ['Pizza', 'Burger', 'Tacos', 'Ramen', 'Sushi', 'Waffles', 'Pancakes', 'Curry', 'Lasagna', 'Dumplings'],
    regularImposter: ['Calzone', 'Hot Dog', 'Burrito', 'Udon', 'Poke Bowl', 'French Toast', 'Crepes', 'Stew', 'Baked Ziti', 'Gyoza'],
    adultMain: ['Late-night pizza hookup', 'Brunch with your situationship', 'Tequila taco run', 'Kitchen dance date', 'Flirty cooking class', 'Midnight fridge raid together'],
    adultImposter: ['Regret kebab at 3AM', 'Silent breakfast after chaos', 'Jealous dinner with ex', 'Disaster first-date picnic', 'Drunk microwave gourmet', 'Awkward room-service order'],
  },
  movies: {
    hintBase: 'Movie Clash',
    regularMain: ['Inception', 'Interstellar', 'Titanic', 'The Matrix', 'Joker', 'Shrek', 'Gladiator', 'Avatar', 'The Dark Knight', 'Jaws'],
    regularImposter: ['Memento', 'Gravity', 'The Notebook', 'Blade Runner', 'The Batman', 'Toy Story', 'Troy', 'Dune', 'Batman Begins', 'Jurassic Park'],
    adultMain: ['Steamy thriller scene', 'Forbidden romance arc', 'Messy reunion montage', 'After-dark cinema date', 'Seductive villain speech', 'Risky hotel plot twist'],
    adultImposter: ['Cringe rom-com kiss', 'Friend-zoned ending', 'Jealous partner subplot', 'Walk-of-shame sequel', 'Chaotic bachelor-party movie', 'Awkward morning-after credits'],
  },
  music: {
    hintBase: 'Music Battle',
    regularMain: ['Nirvana', 'Metallica', 'Drake', 'Dua Lipa', 'Arctic Monkeys', 'Taylor Swift', 'Eminem', 'Calvin Harris', 'The Weeknd', 'Adele'],
    regularImposter: ['Foo Fighters', 'Megadeth', 'Kendrick Lamar', 'Rita Ora', 'The 1975', 'Olivia Rodrigo', '50 Cent', 'David Guetta', 'Bruno Mars', 'Sam Smith'],
    adultMain: ['Sultry after-hours playlist', 'Bedroom R&B vibe', 'Flirty club anthem', 'Late-night slow dance', 'Kiss-at-midnight chorus', 'Messy karaoke confession'],
    adultImposter: ['Cringe ex-dedication song', 'Jealous DJ meltdown', 'Breakup anthem spam', 'Awkward party request', 'Drunk voice-note freestyle', 'Walk-home heartbreak playlist'],
  },
  places: {
    hintBase: 'Place Swap',
    regularMain: ['London', 'Paris', 'Rome', 'Tokyo', 'Airport', 'Cinema', 'Beach', 'Forest', 'Museum', 'Stadium'],
    regularImposter: ['Manchester', 'Berlin', 'Madrid', 'Seoul', 'Train Station', 'Theatre', 'Waterpark', 'Jungle', 'Gallery', 'Arena'],
    adultMain: ['Rooftop date spot', 'Secret cocktail bar', 'Romantic hotel balcony', 'After-party apartment', 'Midnight city stroll', 'Beach kiss at sunset'],
    adultImposter: ['Awkward ex meetup spot', 'Walk-of-shame bus stop', 'Cringe office party venue', 'Taxi queue drama zone', 'Messy festival campsite', 'One-night stand district'],
  },
  games: {
    hintBase: 'Game Night Duel',
    regularMain: ['Minecraft', 'Fortnite', 'Mario Kart', 'Elden Ring', 'Call of Duty', 'The Sims', 'FIFA', 'Valorant', 'Zelda', 'Animal Crossing'],
    regularImposter: ['Roblox', 'Apex Legends', 'Crash Team Racing', 'Dark Souls', 'Battlefield', 'SimCity', 'eFootball', 'Counter-Strike', 'Genshin Impact', 'Stardew Valley'],
    adultMain: ['Couples co-op all-nighter', 'Flirty voice chat lobby', 'Winner picks the dare', 'Bedroom Mario Kart grudge', 'Chaotic drinking game stream', 'After-dark party queue'],
    adultImposter: ['Rage quit plus jealousy', 'Muted mic drama', 'Awkward cosplay flirt', 'Ex joins the lobby', 'Messy Discord confession', 'Toxic flirt-bait gameplay'],
  },
  animals: {
    hintBase: 'Animal Showdown',
    regularMain: ['Lion', 'Tiger', 'Cheetah', 'Eagle', 'Shark', 'Wolf', 'Dolphin', 'Panda', 'Fox', 'Otter'],
    regularImposter: ['Leopard', 'Jaguar', 'Hyena', 'Hawk', 'Orca', 'Coyote', 'Seal', 'Koala', 'Jackal', 'Beaver'],
    adultMain: ['Predator at the club', 'Peacocking at the bar', 'Wild party animal mode', 'Pack leader flirting', 'Alpha energy date', 'Late-night jungle vibe'],
    adultImposter: ['Clingy puppy behavior', 'Messy drunk monkey act', 'Snake-in-the-DMs move', 'Awkward peacock flex', 'Creepy owl stare', 'Hangover sloth morning'],
  },
  weird: {
    hintBase: 'Weird World Matchup',
    regularMain: ['Mothman', 'Area 51', 'Bermuda Triangle', 'Haunted Doll', 'Loch Ness', 'Bigfoot', 'UFO Sighting', 'Time Loop', 'Alien Abduction', 'Shadow Figure'],
    regularImposter: ['Jersey Devil', 'Roswell', 'Black Hole Zone', 'Cursed Puppet', 'Kraken', 'Yeti', 'Ghost Light', 'Parallel Universe', 'Crop Circle Hoax', 'Sleep Paralysis'],
    adultMain: ['Paranormal hookup story', 'Haunted hotel rendezvous', 'Alien speed dating', 'Midnight ritual flirting', 'Witchy afterparty', 'Seductive vampire rumor'],
    adultImposter: ['Cursed ex return', 'Ouija board disaster date', 'Ghosted after one-night stand', 'Messy love potion fail', 'Awkward seance confession', 'Demon-in-the-DMs moment'],
  },
  jobs: {
    hintBase: 'Career Throwdown',
    regularMain: ['Teacher', 'Programmer', 'Firefighter', 'Doctor', 'Lawyer', 'Chef', 'Architect', 'Journalist', 'Pilot', 'Photographer'],
    regularImposter: ['Lecturer', 'Data Analyst', 'Paramedic', 'Nurse', 'Barrister', 'Line Cook', 'Civil Engineer', 'Copywriter', 'Flight Attendant', 'Videographer'],
    adultMain: ['Office romance rumor', 'After-hours networking flirt', 'Boss-level charm', 'Conference afterparty chaos', 'Work-wife storyline', 'Secret crush at reception'],
    adultImposter: ['HR nightmare text', 'Awkward office hookup', 'Jealous coworker meltdown', 'Breakroom gossip spiral', 'LinkedIn thirst trap', 'Drunk Christmas party scandal'],
  },
  celebrities: {
    hintBase: 'Celebrity Face-Off',
    regularMain: ['Taylor Swift', 'The Rock', 'Ryan Reynolds', 'Lionel Messi', 'Gordon Ramsay', 'Zendaya', 'Rihanna', 'Keanu Reeves', 'Beyonce', 'Tom Holland'],
    regularImposter: ['Lady Gaga', 'John Cena', 'Chris Pratt', 'Cristiano Ronaldo', 'Jamie Oliver', 'Sydney Sweeney', 'Dua Lipa', 'Robert Pattinson', 'Ariana Grande', 'Timothee Chalamet'],
    adultMain: ['Scandalous red carpet rumor', 'Steamy tabloid headline', 'Secret celebrity date', 'VIP afterparty hookup', 'Messy breakup interview', 'Flirty paparazzi moment'],
    adultImposter: ['PR cleanup apology', 'Cheating scandal spin', 'Awkward reunion photo-op', 'Leaked DMs drama', 'Late-night gossip meltdown', 'Cringe podcast confession'],
  },
  tech: {
    hintBase: 'Tech Takedown',
    regularMain: ['Windows', 'iPhone', 'PlayStation', 'ChatGPT', 'Netflix', 'Chrome', 'Discord', 'Spotify', 'TikTok', 'Google Drive'],
    regularImposter: ['Linux', 'Android', 'Xbox', 'Claude', 'Disney+', 'Firefox', 'Slack', 'Apple Music', 'Instagram Reels', 'Dropbox'],
    adultMain: ['Late-night risky DM', 'Flirty voice-note app', 'Private vault app drama', 'After-dark livestream vibe', 'Secret burner account', 'Midnight text marathon'],
    adultImposter: ['Accidental message to ex', 'Screenshot betrayal arc', 'Drunk typo disaster', 'Leaked group chat scandal', 'Embarrassing search history', 'Awkward dating app bio'],
  },
  tv: {
    hintBase: 'Series Smackdown',
    regularMain: ['Game of Thrones', 'Friends', 'Breaking Bad', 'Stranger Things', 'The Office', 'Sherlock', 'The Simpsons', 'Black Mirror', 'The Boys', 'Loki'],
    regularImposter: ['The Witcher', 'How I Met Your Mother', 'Better Call Saul', 'Dark', 'Parks and Recreation', 'Lupin', 'Family Guy', 'Love Death + Robots', 'Invincible', 'Moon Knight'],
    adultMain: ['Messy dating reality show', 'Steamy drama binge', 'After-dark true crime obsession', 'Flirty reunion episode', 'Bedroom binge marathon', 'Spicy confession cam'],
    adultImposter: ['Cringe reality TV meltdown', 'Cheating island twist', 'Awkward reunion special', 'Jealous watch-party fight', 'One-night stand cliffhanger', 'Toxic fan-ship war'],
  },
  hobbies: {
    hintBase: 'Hobby Showdown',
    regularMain: ['Painting', 'Cycling', 'Chess', 'Baking', 'Fishing', 'Running', 'Photography', 'Gardening', 'Woodworking', 'Guitar'],
    regularImposter: ['Sketching', 'Mountain Biking', 'Sudoku', 'Cooking', 'Kayaking', 'Hiking', 'Videography', 'Houseplants', '3D Printing', 'Bass Guitar'],
    adultMain: ['Wine-and-paint flirt night', 'Couples dance class', 'Steamy pottery session', 'After-hours karaoke hobby', 'Late-night cocktail crafting', 'Flirty gym challenge'],
    adultImposter: ['Awkward partner-swapping lesson', 'Messy date hobby fail', 'Jealous dance-floor drama', 'Cringe love poem workshop', 'Drunk DIY disaster', 'Ex crashes the class'],
  },
  brands: {
    hintBase: 'Brand Battle',
    regularMain: ['Nike', 'Apple', 'Coca-Cola', 'BMW', 'Amazon', 'Starbucks', 'Adidas', 'Samsung', 'Pepsi', 'IKEA'],
    regularImposter: ['Adidas', 'Samsung', 'Pepsi', 'Mercedes', 'eBay', 'Costa Coffee', 'Puma', 'Google Pixel', 'Dr Pepper', 'Wayfair'],
    adultMain: ['Luxury date flex brand', 'VIP bottle-service label', 'Afterparty fashion pick', 'Seductive perfume campaign', 'Club-night sneaker drop', 'Hotel-bar watch flex'],
    adultImposter: ['Fake designer panic', 'Ex bought knockoff gift', 'Cringe influencer ad', 'Messy sponsor scandal', 'Awkward sugar-daddy branding', 'Regret impulse luxury spend'],
  },
  science: {
    hintBase: 'Science Split',
    regularMain: ['Planet', 'Atom', 'Volcano', 'Tornado', 'DNA', 'Microscope', 'Neuron', 'Gravity', 'Galaxy', 'Comet'],
    regularImposter: ['Moon', 'Molecule', 'Earthquake', 'Hurricane', 'RNA', 'Telescope', 'Synapse', 'Magnetism', 'Nebula', 'Asteroid'],
    adultMain: ['Chemistry between two people', 'Magnetic attraction at a party', 'Explosive first-date reaction', 'Late-night lab partner flirting', 'Bedroom physics joke', 'Wild dopamine rush'],
    adultImposter: ['No chemistry disaster date', 'Cold reaction in the DMs', 'Awkward rebound experiment', 'Jealousy chain reaction', 'Messy emotional meltdown', 'Hangover brain fog hypothesis'],
  },
  party: {
    hintBase: 'Party Clash',
    regularMain: ['Charades', 'UNO', 'Beer Pong', 'Karaoke', 'House Party', 'Dance Battle', 'Trivia Night', 'Costume Party', 'Board Game Night', 'Garden Party'],
    regularImposter: ['Pictionary', 'Exploding Kittens', 'Flip Cup', 'Lip Sync Battle', 'Pool Party', 'Rap Battle', 'Pub Quiz', 'Theme Party', 'Poker Night', 'Rooftop Party'],
    adultMain: ['Kiss-or-dare challenge', 'After-hours dance floor grind', 'Chaotic cocktail flirting', 'Midnight party hookup rumor', 'VIP room tension', 'Drunk confession circle'],
    adultImposter: ['Jealous ex plus-one drama', 'Awkward truth-or-dare fail', 'Messy drunken argument', 'Walk-of-shame sunrise', 'Cringe kiss rejection', 'Hangover apology tour'],
  },
};

function toPromptEntry(hintBase, main, imposter, index, adultOnly = false) {
  const tone = adultOnly ? '18+' : 'Classic';
  return {
    hint: `${hintBase} ${index + 1} (${tone})`,
    main,
    imposter,
    ...(adultOnly ? { adultOnly: true } : {}),
  };
}

function buildPromptBatch(config, adultOnly = false, count = BULK_PROMPTS_PER_CATEGORY) {
  const mainPool = adultOnly ? config.adultMain : config.regularMain;
  const imposterPool = adultOnly ? config.adultImposter : config.regularImposter;
  return Array.from({ length: count }, (_, index) => {
    const main = mainPool[index % mainPool.length];
    const imposter = imposterPool[(index + 1) % imposterPool.length];
    return toPromptEntry(config.hintBase, main, imposter, index, adultOnly);
  });
}

function buildFallbackPromptBatch(category, adultOnly = false, count = BULK_PROMPTS_PER_CATEGORY) {
  const prompts = category.prompts || [];
  if (!prompts.length) return [];
  const regularPrompts = prompts.filter((prompt) => !prompt?.adultOnly);
  const adultPrompts = prompts.filter((prompt) => prompt?.adultOnly);
  const sourcePool = adultOnly
    ? (adultPrompts.length ? adultPrompts : regularPrompts.length ? regularPrompts : prompts)
    : (regularPrompts.length ? regularPrompts : prompts);
  const hintBase = simplifyLabel(category.name, 'Category');
  return Array.from({ length: count }, (_, index) => {
    const seed = sourcePool[index % sourcePool.length] || prompts[index % prompts.length] || prompts[0];
    const alt = sourcePool[(index + 1) % sourcePool.length] || seed;
    return {
      hint: `${hintBase} Variant ${index + 1} (${adultOnly ? '18+' : 'Classic'})`,
      main: seed.main,
      imposter: alt.imposter || seed.imposter || seed.main,
      ...(adultOnly ? { adultOnly: true } : {}),
    };
  });
}

const DARK_ADULT_HINT_STEMS = [
  'Unhinged Night',
  'Bad Idea Olympics',
  'Public Embarrassment Deluxe',
  'Career-Limiting Move',
  'Questionable Morals',
  'Cancelled by Breakfast',
  'Shameless Behaviour',
  'Cursed Adulting',
];
const DARK_ADULT_MAIN_THEMES = [
  'Texting your ex during a team meeting',
  'Explaining a mysterious bruise with zero context',
  'Accidentally starting drama in the family group chat',
  'Pretending your bad decision was a “growth experience”',
  'Turning a polite dinner into a confession booth',
  'Treating HR policy like optional fan fiction',
  'Making a toast that should have stayed in drafts',
  'Flirting with chaos and calling it confidence',
  'Oversharing your romantic history to strangers',
  'Calling your terrible choice “self-care”',
  'Posting through a minor emotional collapse',
  'Using sarcasm as your entire personality',
  'Bringing rebound energy to a serious conversation',
  'Making eye contact while doubling down on nonsense',
  'Turning one drink into a reputational side quest',
  'Blaming the moon for your own behaviour',
  'Turning “just one lie” into a trilogy',
  'Starting a rumor and acting shocked it spread',
  'Delivering brutal honesty with zero invitation',
  'Making everyone uncomfortable and calling it banter',
];
const DARK_ADULT_IMPOSTER_THEMES = [
  'Sending a polite typo apology and leaving it there',
  'Quietly pretending you never saw the chaos',
  'Keeping your dignity mostly intact in public',
  'Taking the safe route and boring everyone',
  'Defusing drama with suspicious maturity',
  'Choosing water and avoiding a headline',
  'Staying calm when everyone else is spiraling',
  'Giving bland advice nobody asked for',
  'Trying to be wholesome in a cursed group chat',
  'Being responsible at exactly the wrong party',
  'Soft-launching damage control before sunrise',
  'Nodding politely while judging silently',
  'Keeping secrets because prison sounds expensive',
  'Acting normal while the room burns socially',
  'Exiting early before the screenshot era begins',
  'Offering practical help during a public meltdown',
  'Refusing to gossip and becoming the villain',
  'Taking accountability like a boring adult',
  'Choosing peace when chaos looked fun',
  'Drinking water and ruining the narrative',
];

function buildDarkAdultPromptBatch(category, count = BULK_PROMPTS_PER_CATEGORY) {
  const categoryLabel = simplifyLabel(category?.name, 'Category');
  return Array.from({ length: count }, (_, index) => ({
    hint: `${DARK_ADULT_HINT_STEMS[index % DARK_ADULT_HINT_STEMS.length]} • ${categoryLabel} (18+)`,
    main: DARK_ADULT_MAIN_THEMES[index % DARK_ADULT_MAIN_THEMES.length],
    imposter: DARK_ADULT_IMPOSTER_THEMES[(index + 1) % DARK_ADULT_IMPOSTER_THEMES.length],
    adultOnly: true,
  }));
}

for (const category of DEFAULT_CATEGORIES) {
  const expansionConfig = CATEGORY_EXPANSION_CONFIG[category.id];
  if (expansionConfig) {
    category.prompts.push(
      ...buildPromptBatch(expansionConfig, false),
      ...buildPromptBatch(expansionConfig, true),
      ...buildDarkAdultPromptBatch(category)
    );
  } else {
    category.prompts.push(
      ...buildFallbackPromptBatch(category, false),
      ...buildFallbackPromptBatch(category, true),
      ...buildDarkAdultPromptBatch(category)
    );
  }
}

const CATEGORY_ROUNDS_PER_CATEGORY = 100;
const CATEGORY_ADULT_ROUNDS_PER_CATEGORY = 35;
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
  'POV Meme Prompt',
  'Reaction Template',
  'Caption Energy',
  'Relatable Chaos',
  'Comment Section Vibe',
  'Group Chat Moment',
  'Cringe-to-Iconic Arc',
  'Chronically Online Mood',
];
const MEME_DECODER_FORMATS = ['image macro', 'reaction GIF', 'text-post meme', 'short video meme', 'reply meme'];
const MEME_DECODER_ADULT_FORMATS = ['deep-fried meme', 'cursed screenshot meme', 'thirst-trap caption meme', 'late-night text meme', 'toxic group-chat meme'];
const MEME_DECODER_MAIN_THEMES = ['When the group chat says "be there in 5"', 'When your alarm snoozes itself into tomorrow', 'When the Wi-Fi dies mid-episode', 'When someone says "quick meeting"', 'When your food delivery says "arriving now"', 'When your playlist queues the saddest song at the party', 'When the app asks "are you still watching?"', 'When your mate says "I have a tiny secret"', 'When your battery hits 1% outside', 'When someone says "trust me, no drama"', 'When your holiday budget vanishes day one', 'When your room looks clean from one angle', 'When your crush replies with "lol"', 'When the zoom call camera flips on unexpectedly', 'When your train gets delayed again', 'When your teammate says "I did my part"', 'When you check your bank app after the weekend', 'When the group votes for chaos mode', 'When your friend says "don’t tell anyone"', 'When you remember the deadline at 11:58 PM'];
const MEME_DECODER_IMPOSTER_THEMES = ['When the family group chat sends 42 voice notes', 'When your coffee order gets your name hilariously wrong', 'When your luggage appears with no wheel', 'When you open the fridge for inspiration', 'When your playlist shuffles into guilty pleasures', 'When your "short nap" becomes a full sleep cycle', 'When your map app says "recalculating..."', 'When your dog judges your life choices', 'When your browser opens with 27 tabs', 'When your printer jams before submission', 'When your ex watches your story instantly', 'When your boss says "quick favor"', 'When your takeaway arrives missing sauce', 'When your keyboard autocorrect betrays you', 'When your mate says "I’m outside" but isn’t', 'When you hear "we need to talk"', 'When your shopping cart doubles the total', 'When the weather app says "light rain" then storms', 'When your code works on the third random try', 'When your alarm volume is set to whispers'];
const MEME_DECODER_ADULT_MAIN_THEMES = ['When your ex texts “miss u” during your probation review', 'When your situationship reacts with “seen” after the overshare', 'When your thirst trap reaches the family group chat', 'When you drunk-confess to the wrong person and commit anyway', 'When your “private” story gets screenshotted in 4K', 'When your late-night standards are legally questionable', 'When your rebound becomes your therapist’s new subplot', 'When your chaotic dating history needs a flow chart', 'When your apology starts with “to be fair…”', 'When your one red flag turns out to be a full bunting set', 'When your group chat votes you “Most Likely to Regret This”', 'When your “harmless flirt” requires a meeting next day', 'When your afterparty lies collide in public', 'When your fake confidence survives exactly six minutes', 'When your hookup leaves before your food order arrives', 'When your toxic trait gets fact-checked live', 'When your “it’s complicated” turns into “it’s evidence”', 'When your shame spiral still has better posture than you', 'When your friend says “this will end badly” and is right', 'When your reputation enters witness protection'];
const MEME_DECODER_ADULT_IMPOSTER_THEMES = ['When you actually go home at a reasonable hour', 'When you hydrate and ruin the scandal arc', 'When your apology is sincere and disappointingly effective', 'When you set boundaries and nobody knows how to react', 'When you leave the party with dignity still equipped', 'When your situationship communicates like an adult', 'When your text has punctuation and emotional stability', 'When your “bad decision” is just ordering dessert', 'When your secret stays secret for once', 'When your mates try chaos but you choose peace', 'When your date is polite and medically boring', 'When your “toxic era” lasts eight minutes', 'When your gossip is fully sourced and harmless', 'When your ex is blocked and stays blocked', 'When your walk of shame is actually a normal commute', 'When your late-night plan includes sleep and self-respect', 'When your hangover is mild and emotionally manageable', 'When your romance plot has HR approval', 'When your friend group acts suspiciously functional', 'When you learn from mistakes and kill the content'];

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
  'Ambient Noise',
  'Creature Sound',
  'Lifestyle Noise',
  'Atmosphere Cue',
  'Room Tone',
  'Creepy Audio',
  'Party Noise',
  'Nature Sound',
];
const SOUND_OFF_MAIN = ['Waves hitting jagged rocks', 'Blob monster hallway gurgle', 'Creaky door in the dark', 'Distant thunder before rain', 'Cat knocking something off a shelf', 'Car engine refusing to start', 'Arcade machine startup jingle', 'Ghost whisper in an empty room', 'Crowd roar after a goal', 'Helicopter passing overhead', 'Tiny dog growling at a vacuum', 'Lift doors opening with a chime', 'Microwave beeping aggressively', 'Heavy footsteps upstairs at midnight', 'Train braking into a station', 'Forest wind through tall trees', 'Glass bottle rolling on tiles', 'Phone vibration on a wooden table', 'Fire crackling in a fireplace', 'Alien hatch opening sound'];
const SOUND_OFF_IMPOSTER = ['Waves lapping on a calm beach', 'Zombie groan in a corridor', 'Window banging in wind', 'Fireworks echo over rooftops', 'Dog tags jingling on stairs', 'Scooter engine revving up', 'Casino slot-machine jingle', 'Demon laugh in a cave', 'Crowd boo after a miss', 'Motorbike racing past', 'Parrot screech at sunrise', 'Escalator hum in a mall', 'Oven timer ding', 'Slow dragging footsteps in sand', 'Tram bell and brake squeal', 'Swamp insects at dusk', 'Can rolling on concrete', 'Phone ringtone in a bag', 'Bonfire popping in rain', 'Spaceship alarm in cockpit'];
const SOUND_OFF_ADULT_MAIN = ['Bedroom headboard rhythm', 'Late-night kiss-and-laugh combo', 'Heels and keys in a hallway', 'Shower plus steamy mirror wipe', 'Breathy whispered flirting', 'Squeaky mattress panic moment', 'Walk-of-shame keys dropped at sunrise', 'Door lock click followed by suspicious silence', 'Muted argument through thin apartment walls', 'Unhappy air mattress squeak symphony', 'Phone buzz avalanche from three exes', 'High heels sprinting down hotel stairs', 'Mini-fridge raid after bad decisions', 'Discreet Uber pull-up at dawn', 'Kettle whistle during an awkward morning after', 'Bathroom fan hiding a terrible conversation', 'Neighbour knocking at precisely the wrong moment', 'Drunk hiccup followed by fake confidence laugh', 'Lipstick cap snapping in tactical panic', 'Cab meter beeping while someone says “keep driving”'];
const SOUND_OFF_ADULT_IMPOSTER = ['Awkward couch springs at 2AM', 'Door chain rattle and footsteps', 'Bathroom tap with nervous humming', 'Wardrobe door slam and silence', 'Throat-clear and fake laugh', 'Taxi horn outside after midnight', 'Flatmate yell of “who is that?”', 'Alarm going off in somebody else’s room', 'Perfume spray panic before sunrise', 'Three rapid “new message” pings of doom', 'Elevator ding into absolute regret', 'Someone quietly crying while opening takeaway', 'Plastic cup crunch at an afterparty floor', 'A single clap from a deeply sarcastic friend', 'Hotel checkout printer while eyes avoid contact', 'Group chat notification storm mid-hangover', 'Doorbell ring you absolutely cannot answer', 'Bins clattering after a heroic bad night', 'Car seatbelt alarm refusing to stop', 'Nervous laughter in an empty kitchen'];

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
  'Debate Prompt',
  'Scenario Defense',
  'Explain This',
  'Hot Seat Topic',
  'Convince the Room',
  'Questionable Claim',
  'Social Situation',
  'Group Argument',
];
const OFFTOPIC_MAIN = ['Things you should never say to your mum', 'Worst excuses for being late', 'How to ruin a first impression', 'Bad ideas for a team meeting', 'Things that make a room go silent', 'Terrible opening lines at a party', 'Phrases that start pointless drama', 'Ways to make a queue hate you', 'What not to text after midnight', 'Things that should stay in your drafts', 'Worst things to shout in public', 'How to accidentally offend everyone', 'Topics to avoid at family dinner', 'Things you should not post online', 'Ways to lose an argument instantly', 'Worst replies to “we need to talk”', 'Things that make group chats implode', 'Phrases that sound guilty immediately', 'Ways to make your boss panic', 'What not to say in a taxi'];
const OFFTOPIC_IMPOSTER = ['Best picnic snacks', 'How to pick comfy socks', 'Top signs your plant is thriving', 'Ways to organize your desk', 'Most relaxing evening routine', 'How to choose a bedtime tea', 'Tips for better posture', 'Best weather for a long walk', 'How to pick a gym playlist', 'Most wholesome weekend plans', 'How to improve your handwriting', 'Best breakfast combo', 'Ways to calm pre-meeting nerves', 'How to pack for a short trip', 'Best strategy for board game night', 'How to plan a museum day', 'How to clean headphones properly', 'Most reliable umbrella features', 'How to choose a study playlist', 'Best route for a sunset drive'];
const OFFTOPIC_ADULT_MAIN = ['Things you should not text your ex at 1AM', 'Worst afterparty confessions', 'Phrases that kill bedroom vibes', 'Bad excuses after a walk of shame', 'What not to say on a first-night sleepover', 'Worst voice notes to send while drunk', 'Worst things to shout during wedding vows', 'Most unhinged excuse for “new number, who dis?”', 'Lines guaranteed to get you removed from brunch', 'How to turn a casual date into a cautionary tale', 'Things you should never confess in a taxi', 'What not to announce at family Christmas', 'Worst ways to explain matching hickeys', 'Phrases that trigger instant group-chat mutiny', 'Things to never say while meeting parents', 'How to speedrun an HR investigation', 'Worst comments to drop at a funeral wake', 'Things you should never reveal on karaoke night', 'How to ruin a reunion in one sentence', 'Most cursed ways to say “I’m emotionally available”'];
const OFFTOPIC_ADULT_IMPOSTER = ['Best laundry detergent scents', 'Tips for keeping towels fluffy', 'How to pick a reading lamp', 'Best lunchbox prep habits', 'How often to water houseplants', 'Ways to reduce screen glare', 'Best shelf layout for pantry jars', 'How to keep socks paired long-term', 'Calmest way to fold fitted sheets', 'Most sensible desk-chair posture tips', 'How to choose a mild herbal tea', 'Best neutral paint tones for hallways', 'Ways to track your water intake', 'How to organize charging cables neatly', 'Most practical route to the supermarket', 'How to stop your houseplants leaning', 'Best method for cleaning keyboard crumbs', 'How to set a weekly alarm routine', 'Most average weather for jogging', 'Best reusable bag for groceries'];

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
  adultHints: ['After Dark Debate (18+)', 'Messy Opinion (18+)', 'Risky Take (18+)', 'Non-PC Debate (18+)', 'Late Night Argument (18+)'],
  adultMain: [
    'First dates should include a risky dare.',
    'Flirting by voice note is hotter than texting.',
    'Holiday flings are better than serious relationships.',
    'Kissing in public is more romantic than private dates.',
    'Jealousy is sometimes healthy in relationships.',
    'Hookups with coworkers are never worth it.',
    'Sleeping at your date’s place on night one is fine.',
    'Posting thirst traps while single is harmless.',
    'Honest red flags should be shared on date one.',
    'Drunk confessions are the purest kind of honesty.',
    'Ghosting is kinder than pretending you care.',
    'Oversharing on date one saves everyone time.',
    'If the vibe is dead, leaving mid-date is fair.',
    'Dating your friend’s ex is acceptable with warning.',
    'Petty revenge texts are a valid closure technique.',
    'White lies in dating profiles are just marketing.',
    'Unhinged banter is better than mature communication.',
    'Flirting in group chats is a competitive sport.',
    'Blocking then unblocking your ex is self-care.',
    'Public arguments are healthier than silent resentment.',
  ],
  adultImposter: [
    'First dates should stay safe and low key.',
    'Texting is hotter than voice-note flirting.',
    'Serious relationships are better than holiday flings.',
    'Private dates are more romantic than public kissing.',
    'Jealousy is never healthy in relationships.',
    'Hookups with coworkers can be worth it.',
    'Going home separately on night one is better.',
    'Posting thirst traps while single is messy.',
    'Red flags should not be shared on date one.',
    'Drunk confessions are just chaotic oversharing.',
    'Ghosting is lazy and emotionally reckless.',
    'Date one should stay respectful and low drama.',
    'Leaving mid-date is rude unless unsafe.',
    'Dating friends’ exes is usually a bad idea.',
    'Revenge texts are immature and harmful.',
    'Profiles should be honest, not strategic fiction.',
    'Calm communication beats unhinged banter.',
    'Group-chat flirting usually ends badly.',
    'Blocking games are emotionally manipulative.',
    'Public arguments are embarrassing and unhelpful.',
  ],
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
      'club-bass-drop', 'glasses-clink-toast', 'heels-on-tile-floor', 'door-lock-click', 'kiss-pop-sfx',
      'bedframe-rhythm-loop', 'awkward-uber-arrival', 'fridge-door-at-3am', 'lipstick-cap-click',
      'elevator-ding-of-regret', 'group-chat-notification-storm', 'hotel-keycard-fail', 'suspicious-laughter-cutoff',
      'hangover-water-gulp', 'afterparty-door-slam',
    ],
    adultImposter: [
      'bar-last-orders-bell', 'bottle-smash-far', 'awkward-chair-scrape', 'door-chain-rattle', 'nervous-throat-clear',
      'snore-from-the-couch', 'kettle-boil-at-dawn', 'cab-meter-beep', 'toilet-flush-cover-noise',
      'alarm-clock-in-wrong-room', 'shower-running-too-long', 'flatmate-knock-at-door',
      'phone-vibrate-panic', 'plastic-cup-crunch', 'forced-apology-sigh',
    ],
  },
  video: {
    hint: 'Video Clip',
    regularMain: ['skatepark-trick-landing', 'concert-crowd-wave', 'storm-over-sea', 'dog-splashing-lake', 'arcade-speedrun-closeup'],
    regularImposter: ['skatepark-trick-fall', 'concert-crowd-mosh', 'calm-sea-sunrise', 'dog-running-meadow', 'arcade-fightinggame-closeup'],
    adultMain: [
      'rooftop-party-dancing', 'neon-city-date-night', 'hotel-lobby-checkin', 'slow-motion-champagne-pop', 'vip-booth-laughing',
      'karaoke-mic-drop', 'messy-selfie-afterparty', 'cab-window-neon-stare', 'kitchen-after-midnight',
      'club-exit-in-heels', 'slow-mo-regret-face', 'toxic-flirt-in-dms', 'brunch-walk-of-confidence',
      'backseat-conversation-chaos', 'doorstep-goodbye-fumble',
    ],
    adultImposter: [
      'afterparty-walk-of-shame', 'neon-city-alone-night', 'hotel-lobby-argument', 'spill-drink-disaster', 'vip-booth-awkward-silence',
      'silent-ride-home', 'friend-holding-hair-back', 'hangover-pharmacy-run', 'apology-text-closeup',
      'unread-message-spiral', 'party-exit-in-tears', 'lost-jacket-hunt', 'cold-pizza-breakfast',
      'elevator-standoff', 'taxi-meter-panic',
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
    hint: "AI Mystery Topic (18+)",
    main: 'Walk of shame',
    imposter: 'Walk of shame',
    aiPrompt: 'You are describing a walk of shame after a wild night out. Keep answers brief and vague.',
    previewLabel: 'Players interrogate the AI: yes, no, kind of, not really applicable, or possibly.',
    adultOnly: true,
  },
  {
    hint: "AI Mystery Topic (18+)",
    main: 'Very awkward first date',
    imposter: 'Very awkward first date',
    aiPrompt: 'You are describing a very awkward first date. Keep answers brief and vague.',
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
    'Awkward speed dating', 'Messy house party', 'Walk home at sunrise', 'VIP nightclub booth', 'Hotel minibar raid',
    'After-dark karaoke battle', 'Flirty rooftop drinks', 'Embarrassing ex reunion', 'Wild bachelor party', 'Late-night taxi confession',
    'Group-chat breakup fallout', 'Brunch after no sleep', 'Regretful holiday fling', 'Office party scandal',
    'Chaotic situationship', 'Accidental voice-note leak', 'Shaky apology dinner', 'Hangover airport sprint',
    'Friends-with-benefits contract dispute', 'Public argument outside a club',
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
