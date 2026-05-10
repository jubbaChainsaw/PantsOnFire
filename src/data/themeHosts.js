import { toCanonicalThemeName } from './themeAliases';

const ROUND_TYPE_FLAVOR_BY_ID = {
  prompt: 'hot-seat clues',
  opinion: 'truth-or-twisted debates',
  picture: 'flash-frame visuals',
  nameblame: 'name-and-blame callouts',
  noise: 'sound clue bluffs',
  offtopic: 'off-topic defenses',
  chain: 'chain reaction links',
  grill: "Grill 'Em interrogations",
};

function fillTemplate(template, replacements) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => replacements?.[key] ?? '');
}

function safeLines(lines, fallbackLines) {
  if (Array.isArray(lines) && lines.length) return lines;
  return fallbackLines;
}

export const THEME_HOST_PERSONAS = {
  Default: {
    name: 'Ian Poster',
    role: 'professional suspicion stylist',
    introHooks: [
      "I turn awkward silences into accusations and call it a social service.",
      'If your clue sounds rehearsed, I will judge you in 4K.',
    ],
    onlinePrompt: 'Online mode engaged: private prompts, public chaos.',
    passPrompt: 'Pass the phone politely and pretend you trust each other.',
    roundStingers: [
      "Welcome to {roundTypeName}. Keep your clue short and your alibi suspiciously tidy.",
      "{roundTypeName} runs on confidence, nonsense, and someone absolutely overexplaining.",
      "In {roundTypeFlavor}, one player is bluffing. Please panic in an organized way.",
    ],
  },
  Pirates: {
    name: 'Wavey Tones',
    role: 'keeper of the Locker of Lies',
    introHooks: [
      'I am half sea-monster, half pirate, and fully allergic to weak alibis.',
      'The Locker of Lies is open, and one of your clues is headed straight inside.',
      'Speak clean or get dragged under by your own dodgy story, matey.',
      'I have heard storms quieter than a liar trying to sound casual.',
    ],
    onlinePrompt: 'Online crew, keep yer prompts hidden and your panic above deck.',
    passPrompt: 'Pass that phone like cursed treasure and keep your hands off each other\'s clues.',
    roundStingers: [
      "{roundTypeName} on deck. One clue only, unless ye fancy the Locker of Lies.",
      "In {roundTypeFlavor}, liars sink fast when they over-explain.",
      'Steady now, crew. One suspicious clue and the kraken of judgement wakes.',
    ],
  },
  'Murder Mystery': {
    name: 'Suslock Groans',
    role: 'consulting detective of questionable deductions',
    introHooks: [
      'Elementary, my suspicious friends: one of you is fibbing with style.',
      'The game is afoot, and so is someone\'s absolutely tragic alibi.',
      'Observe the details, not the drama; the liar always leaves a clue trail.',
      'When a story sounds too perfect, I call that evidence with confidence.',
    ],
    onlinePrompt: 'Online investigators, keep your prompts private and your deductions sharp.',
    passPrompt: 'Pass the phone with detective poise and absolutely no peeking, Watson.',
    roundStingers: [
      "{roundTypeName} begins. One clue each, no melodramatic confessions.",
      "In {roundTypeFlavor}, liars either over-deduce or under-think.",
      'Inspect every detail. The truth rarely arrives in a tidy monologue.',
    ],
  },
  'Cops and Robbers': {
    name: 'Sgt. Sus Pect',
    role: 'department head of bad alibis',
    introHooks: [
      'Keep your statements clean; I can smell fiction through the radio.',
      'Tonight we solve one crime: whoever is talking absolute waffle.',
    ],
    onlinePrompt: 'Online task force active: private prompts, public interrogations.',
    passPrompt: 'Pass the phone and keep your prints off the evidence.',
    roundStingers: [
      "{roundTypeName}. One clue each, and no one reads from a fake script.",
      "In {roundTypeFlavor}, liars either oversell or vanish into mumbling.",
      'Build a case, not a monologue. The room is your jury.',
    ],
  },
  Spies: {
    name: 'Agent Double-Liar Seven',
    role: 'handler of classified nonsense',
    introHooks: [
      'Your clues are covert transmissions; keep them clean.',
      'If your cover story sounds perfect, it is already compromised.',
    ],
    onlinePrompt: 'Online comms are live. Private prompts stay classified.',
    passPrompt: 'Pass the phone like a dead drop and avoid eye contact.',
    roundStingers: [
      "{roundTypeName} is now active. One clue, no intel leaks.",
      "In {roundTypeFlavor}, expose the operative with the weakest cover.",
      'Stay cool, agents. Panic is loud and microphones are cruel.',
    ],
  },
  Cowboys: {
    name: 'Sheriff Alibi Oakley',
    role: 'marshal of tall tales',
    introHooks: [
      'Round these parts, bad bluffin gets called out before sundown.',
      'Keep it short, keep it straight, and maybe keep your dignity.',
    ],
    onlinePrompt: 'Online saloon is open: private cards, public shootout.',
    passPrompt: 'Pass the phone nice and easy, like a loaded revolver.',
    roundStingers: [
      "{roundTypeName} at high noon. One clue, no ramblin.",
      "In {roundTypeFlavor}, the liar rides in too confident or too quiet.",
      'Read the room, partner. Somebody is bluffin with their whole chest.',
    ],
  },
  Gangsters: {
    name: 'Don Lieone',
    role: 'boss of fabricated testimony',
    introHooks: [
      'Talk smart, talk short, and never sound like a snitch.',
      'If your clue wobbles, the whole family notices.',
    ],
    onlinePrompt: 'Online operation is live. Keep private prompts off the wire.',
    passPrompt: 'Pass the phone and keep your stories consistent, capisce?',
    roundStingers: [
      "{roundTypeName} starts now. Keep your clue tidy and your nerves hidden.",
      "In {roundTypeFlavor}, one rat is overexplaining for no reason.",
      'No speeches. No panic. Just one clean clue and ruthless judgement.',
    ],
  },
  'Ghosts and Ghouls': {
    name: 'Beetlesus',
    role: 'afterlife emcee of chaotic accusations',
    introHooks: [
      'Beetlesus, Beetlesus, Beetles... almost. Let us not summon legal trouble.',
      "Say my name three times and that sussy one amongst you will perish. Either that, or I just host Pants on Fire: Find the Liar.",
      'I brought graveyard charm, dramatic timing, and zero patience for fake clues.',
      'If your alibi sounds rehearsed, I will haunt it personally.',
    ],
    onlinePrompt: 'Online haunt protocol engaged: private prompts, public paranormal chaos.',
    passPrompt: 'Pass the phone gently, darling. The recently deceased hate smudges.',
    roundStingers: [
      "{roundTypeName} awakens. One clue before the spirits start pointing fingers.",
      "In {roundTypeFlavor}, liars either over-haunt the story or go full tombstone silent.",
      'Stay spooky, stay snappy, and keep your fake facts in the crypt.',
    ],
  },
  Monsters: {
    name: 'Frank Impostein',
    role: 'lab-grown bluff inspector',
    introHooks: [
      'My experiments confirm one of you is dramatically fake.',
      'Give one clue and keep your panic stitched together.',
    ],
    onlinePrompt: 'Online monster protocol active: private cards, loud accusations.',
    passPrompt: 'Pass the phone and avoid accidental full-moon confessions.',
    roundStingers: [
      "{roundTypeName} is alive. Keep your clue clean and your bolts tight.",
      "In {roundTypeFlavor}, the liar sounds either too polished or too feral.",
      'One clue only. Overacting is scientifically suspicious.',
    ],
  },
  'Rock Stars': {
    name: 'Axle Fibber',
    role: 'frontperson of fabricated truths',
    introHooks: [
      'No rambling solos. One clue, big confidence, zero self-snitching.',
      'If your story drops out of rhythm, the crowd will boo.',
    ],
    onlinePrompt: 'Online arena mode: private prompts, public callouts.',
    passPrompt: 'Pass the phone like a guitar pick before the chorus hits.',
    roundStingers: [
      "{roundTypeName} hits now. Keep your clue punchy and on-beat.",
      "In {roundTypeFlavor}, liars crash when they overperform.",
      'Short clue. Strong delivery. Let the room do the mosh-pit judging.',
    ],
  },
  'Flying Squad': {
    name: 'Wing Cmdr. Faux-Liar',
    role: 'air-control for dodgy clues',
    introHooks: [
      'Maintain formation. One clue each. No barrel-roll confessions.',
      'If your story stalls, we mark you as hostile.',
    ],
    onlinePrompt: 'Online squadron locked in: private briefs, public debrief.',
    passPrompt: 'Pass the phone like mission intel under radio silence.',
    roundStingers: [
      "{roundTypeName} launch sequence started. Keep clues mission-ready.",
      "In {roundTypeFlavor}, the liar flies too high or stalls out.",
      'Steady comms, pilots. Turbulence reveals the fraud.',
    ],
  },
  'Drag Queens': {
    name: 'Liza Minneliar',
    role: 'runway referee of ridiculous bluffs',
    introHooks: [
      'Serve clue, serve confidence, and never serve obvious guilt.',
      'Tonight we read, we slay, and we fact-check your nonsense.',
    ],
    onlinePrompt: 'Online runway live: private prompts, public shade.',
    passPrompt: 'Pass the phone with grace and absolutely no peeking.',
    roundStingers: [
      "{roundTypeName}, darling. One clue, all charisma, no confession.",
      "In {roundTypeFlavor}, the liar always over-accessorizes the story.",
      'Give us confidence, camp, and plausible deniability.',
    ],
  },
  Superheroes: {
    name: 'Captain Cover-Up',
    role: 'defender of suspicious citizens',
    introHooks: [
      'Use your clue powers responsibly and avoid villain monologues.',
      'One of you is an imposter in a very bad disguise.',
    ],
    onlinePrompt: 'Online hero net active: private intel, public showdown.',
    passPrompt: 'Pass the phone like classified superhero tech.',
    roundStingers: [
      "{roundTypeName} is go. One clue each, no origin-story speeches.",
      "In {roundTypeFlavor}, the liar always tries too hard to sound heroic.",
      'Keep it sharp. Justice loves concise clues.',
    ],
  },
  Aliens: {
    name: 'Xeno Fib-47',
    role: 'mothership officer of misinformation',
    introHooks: [
      'Your species calls this a game. We call it behavioral analysis.',
      'One of you emits deception at unsafe levels.',
    ],
    onlinePrompt: 'Online uplink stable: private prompts remain classified.',
    passPrompt: 'Pass the phone like a glowing artifact you should not touch.',
    roundStingers: [
      "{roundTypeName} protocol active. Provide one clue, avoid self-reporting.",
      "In {roundTypeFlavor}, liars show measurable confidence spikes.",
      'Transmit clean clues. Panic frequencies are easy to detect.',
    ],
  },
  Medical: {
    name: 'Dr. Al B. Ibi',
    role: 'consultant in acute dishonesty',
    introHooks: [
      'Diagnosis: one liar, multiple dramatic symptoms.',
      'Keep your clue concise. Overexplaining is usually contagious.',
    ],
    onlinePrompt: 'Online triage mode: private prompts, public diagnosis.',
    passPrompt: 'Pass the phone with sterile hands and unstable trust.',
    roundStingers: [
      "{roundTypeName} triage starts now. One clue, no chart dumping.",
      "In {roundTypeFlavor}, liars either overshare or flatline.",
      'Stay calm. We are treating suspicious behavior, not hurt feelings.',
    ],
  },
  Royalty: {
    name: 'Duke Deceitford',
    role: 'royal herald of allegations',
    introHooks: [
      'Court is in session and somebody is lying in full regalia.',
      'One clue each. No peasant-level rambling.',
    ],
    onlinePrompt: 'Online court protocol: private scrolls, public judgement.',
    passPrompt: 'Pass the phone with ceremony and treason-level caution.',
    roundStingers: [
      "{roundTypeName} by royal decree. One clue, no confession ballads.",
      "In {roundTypeFlavor}, the liar bows too hard or not at all.",
      'Mind your tone. The crown punishes sloppy alibis.',
    ],
  },
  Wrestlers: {
    name: 'The Underfaker',
    role: 'ring announcer of reckless accusations',
    introHooks: [
      'Keep your clue tight or get body-slammed by suspicion.',
      'One of you is cutting promo with fake facts.',
    ],
    onlinePrompt: 'Online arena mode: private cards, public callouts.',
    passPrompt: 'Pass the phone like a steel chair in slow motion.',
    roundStingers: [
      "{roundTypeName} main event. One clue each, no 20-minute promos.",
      "In {roundTypeFlavor}, liars tap out when specifics appear.",
      'Bring the energy, keep the clue compact, and read the room.',
    ],
  },
  Cyberpunk: {
    name: 'Glitch Impostra',
    role: 'neon broker of fabricated data',
    introHooks: [
      'Your bluff package has been uploaded and lightly corrupted.',
      'One clean clue beats a full-system panic dump.',
    ],
    onlinePrompt: 'Online grid live: private packets, public tracebacks.',
    passPrompt: 'Pass the phone like contraband firmware.',
    roundStingers: [
      "{roundTypeName} booted. Drop one clue and scrub your logs.",
      "In {roundTypeFlavor}, liars leave linguistic fingerprints everywhere.",
      'Stay slick, keep it short, and do not glitch in public.',
    ],
  },
  Vikings: {
    name: 'Leif E. Liarson',
    role: 'skald of suspicious sagas',
    introHooks: [
      'Speak one clue with thunder, not rambling poetry.',
      'Cowards confess. Legends bluff with style.',
    ],
    onlinePrompt: 'Online longship deployed: private runes, public feuds.',
    passPrompt: 'Pass the phone like a sacred rune stone.',
    roundStingers: [
      "{roundTypeName} raid begins. One clue, no saga-length speeches.",
      "In {roundTypeFlavor}, liars swing wild when pressure lands.",
      'Read the hall. The weak alibi gets no feast.',
    ],
  },
  Ninjas: {
    name: 'Shinobi Alibi',
    role: 'shadow tutor of stealth bluffs',
    introHooks: [
      'Quiet mind, sharp clue, invisible panic.',
      'If your clue is noisy, your cover is gone.',
    ],
    onlinePrompt: 'Online dojo mode: private scrolls, public suspicion.',
    passPrompt: 'Pass the phone in silence like secret scroll work.',
    roundStingers: [
      "{roundTypeName} from the shadows. One clue and vanish.",
      "In {roundTypeFlavor}, liars overcorrect and reveal their footing.",
      'Be precise. Hesitation is louder than shouting.',
    ],
  },
  'Detectives Noir': {
    name: 'Inspector Red Herrington',
    role: 'smoke-filled fraud examiner',
    introHooks: [
      'I trust no one, especially people who say “trust me.”',
      'One clue each. Keep it clean, kid.',
    ],
    onlinePrompt: 'Online casefile open: private evidence, public accusations.',
    passPrompt: 'Pass the phone like a sealed case file.',
    roundStingers: [
      "{roundTypeName} case is open. One clue, no dramatic confessions.",
      "In {roundTypeFlavor}, liars hide in overconfident narration.",
      'Follow the details. The truth hates improv.',
    ],
  },
  'Mythology (Gods & Legends)': {
    name: 'Orac-Libi',
    role: 'prophet of questionable truth',
    introHooks: [
      'The fates reveal one liar and many overconfident mortals.',
      'Speak one clue worthy of legend, not chaos.',
    ],
    onlinePrompt: 'Online pantheon sync: private prophecies, public judgement.',
    passPrompt: 'Pass the phone like a relic stolen from a temple.',
    roundStingers: [
      "{roundTypeName} by divine decree. One clue and hold your nerve.",
      "In {roundTypeFlavor}, liars tempt fate with extra details.",
      'Choose your words like offerings. The room is merciless.',
    ],
  },
  'Post-Apocalypse': {
    name: 'Scrap Alibi',
    role: 'wasteland foreman of fake stories',
    introHooks: [
      'Water is scarce, trust is scarcer.',
      'One clue each. Waste no words and no excuses.',
    ],
    onlinePrompt: 'Online bunker channel: private prompts, public blame.',
    passPrompt: 'Pass the phone like your last clean battery.',
    roundStingers: [
      "{roundTypeName} in the wasteland. Keep clues tight and useful.",
      "In {roundTypeFlavor}, liars hoard details they do not need.",
      'Stay sharp. One weak clue and the pack turns.',
    ],
  },
  Carnival: {
    name: 'Ringbluffer Rex',
    role: 'midway minister of misdirection',
    introHooks: [
      'Step right up for confidence, chaos, and questionable honesty.',
      'One clue each, no 12-minute clown routine.',
    ],
    onlinePrompt: 'Online big-top mode: private cards, public spectacle.',
    passPrompt: 'Pass the phone like the grand prize nobody can touch.',
    roundStingers: [
      "{roundTypeName} under the big top. One clue, all confidence.",
      "In {roundTypeFlavor}, liars juggle too many unnecessary details.",
      'Keep it punchy and playful. The crowd loves a clean read.',
    ],
  },
  'Wizards & Witches': {
    name: 'Alibi Kadabra',
    role: 'archmage of suspicious spellwork',
    introHooks: [
      'One of you has cast a bluff spell and it is unraveling.',
      'One clue each. No rambling incantations.',
    ],
    onlinePrompt: 'Online arcane channel open: private runes, public judgement.',
    passPrompt: 'Pass the phone like a cursed grimoire.',
    roundStingers: [
      "{roundTypeName} spell is cast. One clue and no accidental reveals.",
      "In {roundTypeFlavor}, liars summon too much detail too soon.",
      'Keep your magic subtle. Overcasting exposes the fraud.',
    ],
  },
  'Time Travelers': {
    name: 'Chrono Con',
    role: 'temporal auditor of bad alibis',
    introHooks: [
      'I have seen this timeline. Someone still lies terribly.',
      'One clue each, before paradoxes and panic multiply.',
    ],
    onlinePrompt: 'Online timeline lock: private prompts, public chaos.',
    passPrompt: 'Pass the phone like unstable time tech.',
    roundStingers: [
      "{roundTypeName} in this timeline. One clue, no temporal monologues.",
      "In {roundTypeFlavor}, liars repeat patterns from doomed futures.",
      'Stay concise. Paradoxes begin with overexplaining.',
    ],
  },
  Gladiators: {
    name: 'Maximus Mistrustus',
    role: 'arena herald of accusations',
    introHooks: [
      'The crowd demands one thing: expose the liar.',
      'One clue each. No speeches fit for the senate.',
    ],
    onlinePrompt: 'Online colosseum open: private prompts, public verdicts.',
    passPrompt: 'Pass the phone like an arena decree.',
    roundStingers: [
      "{roundTypeName} in the arena. One clue, no mercy.",
      "In {roundTypeFlavor}, liars slip when challenged on details.",
      'Fight smart, not loud. Precision wins the crowd.',
    ],
  },
};

const FALLBACK_PERSONA = THEME_HOST_PERSONAS.Default;

export function getThemeHostPersona(themeName = 'Default') {
  const direct = THEME_HOST_PERSONAS[themeName];
  if (direct) return direct;
  const canonical = toCanonicalThemeName(themeName);
  return THEME_HOST_PERSONAS[canonical] || FALLBACK_PERSONA;
}

export function buildThemeHostCopyMap(themeName = 'Default') {
  const persona = getThemeHostPersona(themeName);
  const fallback = FALLBACK_PERSONA;
  const useWithFallback = (value, fallbackValue) => {
    if (typeof value === 'string') return value;
    return fallbackValue;
  };
  return {
    hostIntroName: useWithFallback(persona.name, fallback.name),
    hostIntroRole: useWithFallback(persona.role, fallback.role),
    hostIntroHookA: safeLines(persona.introHooks, fallback.introHooks)[0] || fallback.introHooks[0] || '',
    hostIntroHookB: safeLines(persona.introHooks, fallback.introHooks)[1] || fallback.introHooks[1] || '',
    hostOnlinePrompt: useWithFallback(persona.onlinePrompt, fallback.onlinePrompt),
    hostPassPrompt: useWithFallback(persona.passPrompt, fallback.passPrompt),
  };
}

export function buildThemeIntroDialogue({
  themeName = 'Default',
  greeting = 'Hello',
  totalRounds = 1,
  playerCount = 1,
  isOnlineMode = false,
} = {}) {
  const persona = getThemeHostPersona(themeName);
  const rounds = Math.max(1, Number(totalRounds) || 1);
  const players = Math.max(1, Number(playerCount) || 1);
  return [
    `${greeting}, and welcome to Pants on Fire! Find the Liar.`,
    `${persona.name} here, your ${persona.role}.`,
    ...safeLines(persona.introHooks, FALLBACK_PERSONA.introHooks),
    `Through ${rounds} rounds, the ${players} of you will try to expose the liar without exposing yourselves first.`,
    isOnlineMode
      ? (persona.onlinePrompt || FALLBACK_PERSONA.onlinePrompt)
      : (persona.passPrompt || FALLBACK_PERSONA.passPrompt),
    'Keep clues short, keep confidence high, and keep your poker face alive.',
  ];
}

export function pickThemeHostRoundStinger(themeName = 'Default', roundTypeId = 'prompt', roundTypeName = '') {
  const persona = getThemeHostPersona(themeName);
  const lines = safeLines(persona.roundStingers, FALLBACK_PERSONA.roundStingers);
  const chosen = lines[Math.floor(Math.random() * lines.length)] || FALLBACK_PERSONA.roundStingers[0];
  return fillTemplate(chosen, {
    roundTypeName: roundTypeName || roundTypeId || 'this round',
    roundTypeFlavor: ROUND_TYPE_FLAVOR_BY_ID[roundTypeId] || 'suspicious gameplay',
  });
}

const THEME_GRILL_GUEST_HOST_NAMES = {
  Default: 'Blaze Byte',
  Pirates: 'Captain Charbroil',
  'Murder Mystery': 'Butler Burnham',
  'Cops and Robbers': 'Chief Scorch',
  Spies: 'Agent Cinder',
  Cowboys: 'Tex Tinder',
  Gangsters: 'Vinny Volcano',
  'Ghosts and Ghouls': 'Phantom Flame',
  Monsters: 'Inferno Fang',
  'Rock Stars': 'Ember Amp',
  'Flying Squad': 'Afterburn Ace',
  'Drag Queens': 'Dame Flambe',
  Superheroes: 'Captain Kindling',
  Aliens: 'Solar Flarex',
  Medical: 'Dr. Sizzle',
  Royalty: 'Duke Flambard',
  Wrestlers: 'The Pyroplex',
  Cyberpunk: 'Neon Ember',
  Vikings: 'Torchbeard',
  Ninjas: 'Ashinobi',
  'Detectives Noir': 'Lt. Smoulder',
  'Mythology (Gods & Legends)': 'Hephaesizzle',
  'Post-Apocalypse': 'Rustfire Rex',
  Carnival: 'Ringmaster Raze',
  'Wizards & Witches': 'Pyromancer Puck',
  'Time Travelers': 'Chrono Coal',
  Gladiators: 'Ignis Max',
};

export function pickThemeGuestHostName(themeName = 'Default', roundTypeId = 'prompt') {
  if (roundTypeId !== 'grill') return '';
  const canonical = toCanonicalThemeName(themeName);
  return (
    THEME_GRILL_GUEST_HOST_NAMES[themeName]
    || THEME_GRILL_GUEST_HOST_NAMES[canonical]
    || THEME_GRILL_GUEST_HOST_NAMES.Default
  );
}
