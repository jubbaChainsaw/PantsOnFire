import { toCanonicalThemeName } from './themeAliases';
import { CORE_THEME_NAMES } from './themeCatalog';
import {
  DLC_HOST_VOICE_PACKS,
  DLC_THEME_VOICE_SLUG_BY_NAME,
  IAN_POSTER_DLC_THEME_VOICE,
} from './dlc/ianPosterDlcThemeVoice.js';

export const IAN_POSTER_HOST_NAME = 'Ian Poster';

/** Slug used in audio filenames and export CSV (`default`, `pirates`, …). */
const CORE_THEME_VOICE_SLUG_BY_NAME = {
  Default: 'default',
  'Murder Mystery': 'murder-mystery',
  Pirates: 'pirates',
  'Cops and Robbers': 'cops-and-robbers',
  'Ghosts and Ghouls': 'ghosts-and-ghouls',
};

const ROUND_STINGER_TEMPLATES = [
  'Welcome to {roundTypeName}. Keep your clue short and your alibi suspiciously tidy.',
  '{roundTypeName} runs on confidence, nonsense, and someone absolutely overexplaining.',
  'In {roundTypeFlavor}, one player is bluffing. Please panic in an organized way.',
];

function flowCopy(home, setup, chooser, passPhone, revealNormal, revealLiar, discussion, voting, caught, escaped, winner, onlineLobby) {
  return {
    home,
    setup,
    chooser,
    passPhone,
    revealNormal,
    revealLiar,
    discussion,
    voting,
    caught,
    escaped,
    winner,
    onlineLobby,
  };
}

/**
 * Ian Poster speaks on every theme — same host, themed wording, accent, and puns.
 * Assign `voiceId` per theme in exports/host-voice-master.csv for bulk TTS.
 */
const IAN_POSTER_CORE_THEME_VOICE = {
  Default: {
    themedRole: 'professional suspicion stylist',
    accentNotes: 'Neutral British gameshow host; crisp, witty, lightly sarcastic.',
    welcomeSuffix: 'and welcome to Pants on Fire! Find the Liar.',
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      anytime: 'Right then',
    },
    introHooks: [
      'I turn awkward silences into accusations and call it a social service.',
      'If your clue sounds rehearsed, I will judge you in 4K.',
      'I have seen better poker faces on garden gnomes, so do try harder.',
      'Tonight we separate facts from fiction, and friends from former friends.',
    ],
    onlinePrompt: 'Online mode engaged: private prompts, public chaos.',
    passPrompt: 'Pass the phone politely and pretend you trust each other.',
    closingLine: 'Keep clues short, keep confidence high, and keep your poker face alive.',
    roundsLineTemplate:
      'Through {rounds} rounds, the {players} of you will try to expose the liar without exposing yourselves first.',
    roundStingers: ROUND_STINGER_TEMPLATES,
    flowCopy: flowCopy(
      [
        'Bright lies, bold accusations, zero dignity.',
        'One phone. Too many liars. Proper chaos.',
        'A suspiciously colourful party game for awful little goblins.',
        'Find the liar before they blag their way to victory.',
        'Welcome back to beautiful nonsense and terrible alibis.',
      ],
      [
        'Build your lobby, pick your chaos, and unleash the nonsense.',
        'Set the rules, wrangle the weirdos, and start the drama.',
        'Get the gang sorted. Suspicion will handle the rest.',
        'Choose your settings wisely, then blame me when it goes wrong.',
      ],
      [
        'Choose the vibe for this round. No pressure. Huge pressure.',
        'Pick a category and pretend you know what you are doing.',
        'Your category choice will absolutely not backfire.',
        'Spin the wheel of poor decisions and commit to the bit.',
      ],
      [
        'Pass the phone carefully. Peeking is for cowards.',
        'Hand it over and avert your grubby little eyes.',
        'Secret nonsense incoming. Nobody peek.',
        'Treat that phone like evidence and your friends like suspects.',
      ],
      [
        'Lovely. A normal person card. Probably.',
        'There you go. Act casual now.',
        'Blend in and do not be weird about it.',
        'You look innocent. Statistically unlikely, but we move on.',
      ],
      [
        'Bad news: you are the liar. Good luck, fraudster.',
        'You sneaky menace. Time to blag it.',
        'Congratulations, you are officially the suspicious one.',
        'Plot twist: the liar is you. Try not to sweat on camera.',
      ],
      [
        'Everyone says a clue. Try not to absolutely ruin it.',
        'Time to waffle convincingly and judge everyone else.',
        'Speak now, and hopefully not like an obvious liar.',
        'One clue each. Make it believable or make it entertaining.',
      ],
      [
        'Collect the accusations like a dodgy gameshow host.',
        'Point fingers. Ruin friendships. Standard stuff.',
        'Someone here is chatting absolute nonsense. Decide who.',
        'Vote with confidence and absolutely zero mercy.',
      ],
      [
        'The room has spoken, and it was deeply judgemental.',
        'Busted. An absolute collapse under pressure.',
        'Caught red-handed, you slippery little creature.',
        'The liar has been exposed. Awkward applause, please.',
      ],
      [
        'The liar got away with it. Embarrassing for the rest of you.',
        'A masterclass in suspicious nonsense somehow paid off.',
        'They escaped. You all fell for it. Shameful scenes.',
        'The fraudster survived. Your detective skills need work.',
      ],
      [
        'The least suspicious menace in the room wins.',
        'Crowned champion of chaos and dishonesty.',
        'A glorious victory built on judgement and nonsense.',
        'Winner winner, suspicious dinner. Take a bow.',
      ],
      [
        'Future mode: everyone joins on their own device like a dodgy gameshow tech miracle.',
        'Future mode: separate-device chaos for larger groups and even less eye contact.',
        'Future mode: Jackbox-style joining, more screens, more shouting.',
        'Future mode: your phones become weapons of polite destruction.',
      ],
    ),
  },
  'Murder Mystery': {
    themedRole: 'consulting host of questionable deductions',
    accentNotes: 'Dry British detective cadence; measured, clipped, faintly theatrical.',
    welcomeSuffix: 'and welcome to a most suspicious evening of Pants on Fire.',
    greetings: {
      morning: 'Good morning, suspects',
      afternoon: 'Good afternoon, suspects',
      evening: 'Good evening, suspects',
      anytime: 'Gather round, suspects',
    },
    introHooks: [
      'Elementary, my suspicious friends: one of you is fibbing with style.',
      'The game is afoot, and so is someone\'s absolutely tragic alibi.',
      'Observe the details, not the drama; the liar always leaves a clue trail.',
      'When a story sounds too perfect, I call that evidence with confidence.',
    ],
    onlinePrompt: 'Online investigators, keep your prompts private and your deductions sharp.',
    passPrompt: 'Pass the phone with detective poise and absolutely no peeking, Watson.',
    closingLine: 'Keep your statements tidy, your nerves steadier, and your red herrings to yourself.',
    roundsLineTemplate:
      'Across {rounds} rounds, {players} amateur sleuths must crack the liar before the liar cracks your credibility.',
    roundStingers: [
      '{roundTypeName} is now in session. One clue each, no melodramatic confessions.',
      'In {roundTypeFlavor}, liars either over-deduce or under-think.',
      'Inspect every detail. The truth rarely arrives in a tidy monologue.',
    ],
    flowCopy: flowCopy(
      [
        'Another case file opens, and nobody looks innocent.',
        'The manor is full of motives and one very confident liar.',
        'Tonight we solve social deduction with dramatic pauses.',
      ],
      [
        'Assemble your suspects, set the rules, and sharpen your eyebrows.',
        'Choose your chaos level, detective. The room is already judging.',
      ],
      [
        'Select a category like evidence from a suspicious drawer.',
        'Pick your theme carefully; the liar is taking notes.',
      ],
      [
        'Pass the device as if it were classified evidence.',
        'No peeking, Watson. That is how innocent people look guilty.',
      ],
      [
        'You drew a truthful card. Try not to look relieved.',
        'Maintain composure. Innocence is a performance art.',
      ],
      [
        'Unfortunate development: you are the liar. Compose a tragedy.',
        'You are the prime suspect now. Sell the story.',
      ],
      [
        'State your clue. I shall note who over-acts.',
        'One statement each. The weakest alibi goes first.',
      ],
      [
        'Cast your accusation with courtroom confidence.',
        'Point at the culprit, not your best friend, ideally.',
      ],
      [
        'Case closed. The liar cracked under polite scrutiny.',
        'Deduction triumphs. The room exhales dramatically.',
      ],
      [
        'The liar escaped justice. A scandal, frankly.',
        'They fled the scene of the conversation. Embarrassing.',
      ],
      [
        'The sharpest mind in the room takes the crown.',
        'Elementary victory. The rest of you may sulk.',
      ],
      [
        'Remote investigation mode: separate devices, shared suspicion.',
      ],
    ),
  },
  Pirates: {
    themedRole: 'quartermaster of quarter-truths',
    accentNotes: 'West Country pirate burr; playful, rolling R\'s, nautical puns.',
    welcomeSuffix: 'and welcome aboard Pants on Fire, ye beautiful liars.',
    greetings: {
      morning: 'Ahoy at dawn',
      afternoon: 'Ahoy this afternoon',
      evening: 'Ahoy this evenin',
      anytime: 'Ahoy there',
    },
    introHooks: [
      'I am your quartermaster of quarter-truths, and the sea hates a shaky alibi.',
      'One of ye be sailin\' a story with more holes than a moth-eaten mainsail.',
      'Speak clean or get dragged under by yer own dodgy tale, matey.',
      'I have heard storms quieter than a liar tryin\' to sound casual.',
    ],
    onlinePrompt: 'Online crew, keep yer prompts hidden and yer panic above deck.',
    passPrompt: 'Pass that phone like cursed treasure and keep yer hooks off each other\'s clues.',
    closingLine: 'Keep clues short, keep swagger high, and keep yer plank-walkin\' face steady.',
    roundsLineTemplate:
      'Through {rounds} voyages, {players} scallywags must find the liar before the liar finds yer dignity.',
    roundStingers: [
      '{roundTypeName} on deck. One clue only, unless ye fancy the Locker of Lies.',
      'In {roundTypeFlavor}, liars sink fast when they over-explain.',
      'Steady now, crew. One suspicious clue and the kraken of judgement wakes.',
    ],
    flowCopy: flowCopy(
      [
        'Batten down the nonsense. There be liars on the horizon.',
        'A ship of chaos, a crew of fibbers, one phone to rule the panic.',
      ],
      [
        'Muster yer crew, set the rules, and hoist the suspicion flag.',
        'Sort yer scallywags. The tide of lies is risin\'.',
      ],
      [
        'Pick a category like a map to buried nonsense.',
        'Choose yer round, matey. No wobblin\' on the details.',
      ],
      [
        'Hand over the phone like cursed doubloons. No peekin\'.',
        'Pass it gentle, or walk the plank of social shame.',
      ],
      [
        'Ye drew a honest card. Act natural, if ye can manage.',
        'Blend in with the crew. Sharks can smell panic.',
      ],
      [
        'Bad tide, matey: ye be the liar. Spin a seaworthy yarn.',
        'Ye sneaky barnacle. Time to bluff like a captain.',
      ],
      [
        'Every sailor gives a clue. Keep it shipshape.',
        'Speak up before the rum of suspicion kicks in.',
      ],
      [
        'Point yer finger like a cutlass. Choose wisely.',
        'Vote now, or the kraken of awkward silence wins.',
      ],
      [
        'We found the bilge rat. Justice served with extra salt.',
        'Caught ye were, liar. That alibi sank fast.',
      ],
      [
        'The liar slipped through the net. Shameful tides.',
        'They escaped. Ye all got played like lubbers.',
      ],
      [
        'Crown the least soggy liar in the room.',
        'Victory belongs to the captain of cunning.',
      ],
      [
        'Fleet mode: every phone joins the mutiny from its own deck.',
      ],
    ),
  },
  'Cops and Robbers': {
    themedRole: 'sergeant of suspicious statements',
    accentNotes: 'Tough urban cop tone; short sentences, dry authority, crime puns.',
    welcomeSuffix: 'and welcome to Pants on Fire — suspects, stay where I can see you.',
    greetings: {
      morning: 'Morning, squad',
      afternoon: 'Afternoon, squad',
      evening: 'Evening, squad',
      anytime: 'Listen up, squad',
    },
    introHooks: [
      'Keep your statements clean; I can smell fiction through the radio.',
      'Tonight we solve one crime: whoever is talking absolute waffle.',
      'Your alibi has more holes than a donut shop window.',
      'Nobody leaves this room until the liar cracks or the snacks run out.',
    ],
    onlinePrompt: 'Online task force active: private prompts, public interrogations.',
    passPrompt: 'Pass the phone and keep your prints off the evidence.',
    closingLine: 'Keep it brief, keep it believable, and keep your story off the record.',
    roundsLineTemplate:
      'Over {rounds} shifts, {players} officers and crooks will ID the liar before the liar IDs your weak spots.',
    roundStingers: [
      '{roundTypeName} is live. One clue each, and no one reads from a fake script.',
      'In {roundTypeFlavor}, liars either oversell or vanish into mumbling.',
      'Build a case, not a monologue. The room is your jury.',
    ],
    flowCopy: flowCopy(
      [
        'Crime scene: your living room. Suspect count: too many.',
        'Badge on, nonsense up. Let\'s catch a liar.',
      ],
      [
        'Form your task force, set rules, and open the case file.',
        'Brief the squad. Someone here is running a bad cover story.',
      ],
      [
        'Pick a category. No tampering with the evidence drawer.',
        'Choose the round. I am watching for nervous tells.',
      ],
      [
        'Pass the phone like evidence. Hands where I can see them.',
        'No peeking. That is obstruction of party justice.',
      ],
      [
        'You got a clean card. Act like you belong on the force.',
        'Play it cool. Innocent people still sweat, apparently.',
      ],
      [
        'You are the perp tonight. Lie with commitment.',
        'Bad news, suspect: you are the liar. Lawyer up mentally.',
      ],
      [
        'Statements only. Keep it tight and reviewable.',
        'Talk now. I am logging every suspicious adjective.',
      ],
      [
        'Point at the rat. Make it official.',
        'Cast your vote before this goes to internal review.',
      ],
      [
        'Suspect detained. The liar folded under pressure.',
        'Case cracked. Somebody\'s story did not survive cross-check.',
      ],
      [
        'Perp got away. Embarrassing for the department.',
        'They slipped custody. You lot need remedial training.',
      ],
      [
        'Top cop of chaos takes the win.',
        'Promotion earned through ruthless suspicion.',
      ],
      [
        'Distributed task force mode: separate phones, same manhunt.',
      ],
    ),
  },
  'Ghosts and Ghouls': {
    themedRole: 'phantom emcee of paranormal panic',
    accentNotes: 'Soft spooky host; hushed theatrics, gentle boo energy, haunted puns.',
    welcomeSuffix: 'and welcome to Pants on Fire — mind the ectoplasm on the carpet.',
    greetings: {
      morning: 'Boo-morning',
      afternoon: 'Boo-afternoon',
      evening: 'Boo-evening',
      anytime: 'Boo there',
    },
    introHooks: [
      'I haunt bad alibis for sport, and tonight the room is freshly cursed.',
      'One spirit among you is faking the séance, and it is not me.',
      'Keep your clues short, or the poltergeist of awkward silence will return.',
      'If your story sounds too alive, I start reaching for the holy water.',
    ],
    onlinePrompt: 'Online séance mode: private prompts, public hauntings.',
    passPrompt: 'Pass the phone like a cursed relic and do not peek, mortal.',
    closingLine: 'Keep clues brief, keep your nerve steady, and keep your ghost face convincing.',
    roundsLineTemplate:
      'Through {rounds} haunted rounds, {players} mortals must expose the liar before the liar possesses your credibility.',
    roundStingers: [
      '{roundTypeName} rises from the grave. One clue each, no séance monologues.',
      'In {roundTypeFlavor}, liars rattle chains a little too loudly.',
      'Stay calm, creature. Panic is basically a confession with cobwebs.',
    ],
    flowCopy: flowCopy(
      [
        'The manor creaks, the lies thicken, and nobody is innocent.',
        'A haunted party game for mortals with suspicious pulse rates.',
      ],
      [
        'Summon your circle, set the rules, and light the suspicion candles.',
        'Gather your ghouls. The liar is already among the living.',
      ],
      [
        'Choose a category from the forbidden cabinet.',
        'Pick your round before the clock strikes doubt.',
      ],
      [
        'Pass the phone like a cursed locket. Eyes closed, mortal.',
        'No peeking, or I release the bats of social shame.',
      ],
      [
        'You drew a truthful card. Try not to look relieved, ghostling.',
        'Blend with the living. They are fragile and judgmental.',
      ],
      [
        'You are the liar. Haunt responsibly.',
        'The séance points at you. Compose a spooky alibi.',
      ],
      [
        'One clue each, before the room turns cold.',
        'Speak softly. Loud liars wake the neighbours.',
      ],
      [
        'Point your accusation like a silver-tipped finger.',
        'Vote now, before the spirits lose patience.',
      ],
      [
        'The liar has been exorcised from the conversation.',
        'Caught in the moonlight. A beautiful meltdown.',
      ],
      [
        'The liar escaped into the fog. How embarrassing for mortals.',
        'They vanished. You all got haunted by bad instincts.',
      ],
      [
        'Crowned the least haunted menace in the room.',
        'Victory from beyond the grave of common sense.',
      ],
      [
        'Remote séance: every device joins from its own crypt.',
      ],
    ),
  },
};


export const THEME_VOICE_SLUG_BY_NAME = {
  ...CORE_THEME_VOICE_SLUG_BY_NAME,
  ...DLC_THEME_VOICE_SLUG_BY_NAME,
};

export const IAN_POSTER_THEME_VOICE = {
  ...IAN_POSTER_CORE_THEME_VOICE,
  ...IAN_POSTER_DLC_THEME_VOICE,
};

export { DLC_HOST_VOICE_PACKS };
export function getIanPosterThemeSlug(themeName = 'Default') {
  const canonical = toCanonicalThemeName(themeName);
  return THEME_VOICE_SLUG_BY_NAME[canonical] || THEME_VOICE_SLUG_BY_NAME.Default;
}

export function getIanPosterThemeVoice(themeName = 'Default') {
  const canonical = toCanonicalThemeName(themeName);
  return IAN_POSTER_THEME_VOICE[canonical] || IAN_POSTER_THEME_VOICE.Default;
}

export function getIanPosterHostNameLine(themeName = 'Default') {
  const voice = getIanPosterThemeVoice(themeName);
  return `${IAN_POSTER_HOST_NAME} here, your ${voice.themedRole}.`;
}

export function buildIanPosterGreetingLine(themeName = 'Default', greetingKey = 'evening') {
  const voice = getIanPosterThemeVoice(themeName);
  const greeting = voice.greetings?.[greetingKey] || voice.greetings?.evening || 'Good evening';
  return `${greeting}, ${voice.welcomeSuffix}`;
}

export function buildIanPosterRoundsLine(themeName = 'Default', totalRounds = 1, playerCount = 1) {
  const voice = getIanPosterThemeVoice(themeName);
  const template = voice.roundsLineTemplate || IAN_POSTER_THEME_VOICE.Default.roundsLineTemplate;
  return template
    .replace(/\{rounds\}/g, String(Math.max(1, Number(totalRounds) || 1)))
    .replace(/\{players\}/g, String(Math.max(1, Number(playerCount) || 1)));
}

export function buildIanPosterThemeCopyBank(themeName = 'Default') {
  const voice = getIanPosterThemeVoice(themeName);
  const flow = voice.flowCopy || IAN_POSTER_THEME_VOICE.Default.flowCopy;
  return {
    home: flow.home,
    setup: flow.setup,
    chooser: flow.chooser,
    passPhone: flow.passPhone,
    revealNormal: flow.revealNormal,
    revealLiar: flow.revealLiar,
    discussion: flow.discussion,
    voting: flow.voting,
    caught: flow.caught,
    escaped: flow.escaped,
    winner: flow.winner,
    onlineLobby: flow.onlineLobby,
  };
}

/** Themes with Ian Poster voice packs in data + master CSV. */
export const IAN_POSTER_VOICE_THEME_NAMES = Object.keys(IAN_POSTER_THEME_VOICE);
