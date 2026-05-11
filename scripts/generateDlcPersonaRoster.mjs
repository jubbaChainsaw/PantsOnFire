#!/usr/bin/env node
/**
 * Generates curated DLC persona roster + tailored avatar prompt snippets.
 * Run: node scripts/generateDlcPersonaRoster.mjs
 * Writes:
 * - src/data/dlcPersonaRoster.json (id, name, bio, imageSrc per theme)
 * - scripts/data/personaAvatarTailored-dlc.json (flat id -> look string)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const COUNT = 25;

const toSlug = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const themeFolder = (themeName) =>
  String(themeName || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const HAIR = ['jet black', 'bleached bone', 'copper red', 'moss green', 'violet-black', 'rust orange', 'silver grey', 'blue-black'];
const SKIN = ['weathered tan', 'pale freckled', 'deep brown', 'olive', 'ash grey', 'sunburnt red', 'cool grey', 'warm bronze'];
const EYES = ['side-eye', 'too-wide manic stare', 'half-lidded calculation', 'nervous darting', 'dead calm', 'smug squint', 'paranoid bulge', 'performative innocence'];

function pick(arr, i, salt = 0) {
  return arr[(i + salt) % arr.length];
}

const DLC_THEMES = [
  'Vikings',
  'Gladiators',
  'Royalty',
  'Mythology (Gods & Legends)',
  'Time Travelers',
  'Spies',
  'Cowboys',
  'Detectives Noir',
  'Medical',
  'Wrestlers',
  'Cyberpunk',
  'Aliens',
  'Wizards & Witches',
  'Ninjas',
  'Rock Stars',
  'Flying Squad',
  'Drag Queens',
  'Superheroes',
];

/** First + last name parts — combined uniquely per index */
const NAME_PARTS = {
  Vikings: {
    first: ['Rolf', 'Astrid', 'Bjorn', 'Sigrid', 'Leif', 'Ulf', 'Freya', 'Harald', 'Ingrid', 'Gunnar', 'Solveig', 'Eirik', 'Thora', 'Halfdan', 'Katla', 'Oddvar', 'Yrsa', 'Torstein', 'Helga', 'Snorri', 'Frida', 'Magnus', 'Liv', 'Runa', 'Ivar'],
    last: ['Icefang', 'Longbraid', 'Saltbeard', 'Raveneye', 'Shorebreaker', 'Grimhollow', 'Stormborn', 'Forkbeard', 'Battleborn', 'Threetongues', 'Frosthair', 'Bloodoar', 'Shieldmaiden', 'Limpfoot', 'Runeforge', 'Shipwatcher', 'Nightwave', 'Brokenaxe', 'Meadsong', 'Falsesaga', 'Krakentooth', 'Mapstealer', 'Quietflame', 'Oathbreaker', 'Undersail'],
  },
  Gladiators: {
    first: ['Cassia', 'Tiber', 'Flavius', 'Aurelia', 'Marcellus', 'Drusus', 'Lucius', 'Octavia', 'Varro', 'Brutus', 'Maximus', 'Aelia', 'Gaius', 'Livia', 'Quintus', 'Servius', 'Helva', 'Nero', 'Prisca', 'Remus', 'Secunda', 'Titus', 'Vibia', 'Spartacus', 'Cornelius'],
    last: ['Lionheart', 'Ironhelm', 'Bloodsand', 'Redshield', 'Arena', 'Thunderarm', 'Sunspear', 'Dawnguard', 'Warcry', 'Bronzefang', 'Stoneblade', 'Netfighter', 'Trident', 'Beastbait', 'Crowdcheat', 'Chainmail', 'Savage', 'Victory', 'Fixedmatch', 'Brokennet', 'Sandmask', 'Colosseum', 'Gloryhog', 'Cheapshot', 'Laststand'],
  },
  Royalty: {
    first: ['Edmund', 'Cordelia', 'Percival', 'Isadora', 'Reginald', 'Matilda', 'Alistair', 'Genevieve', 'Cedric', 'Ophelia', 'Rupert', 'Beatrix', 'Archibald', 'Seraphina', 'Lionel', 'Henrietta', 'Felix', 'Gwendolyn', 'Mortimer', 'Adelaide', 'Clive', 'Penelope', 'Horace', 'Vivienne', 'Barnaby'],
    last: ['Ashbury', 'Goldcrest', 'Montrose', 'Rosemere', 'Thornwick', 'Ivoryhall', 'Valmont', 'Windsor', 'Blackmere', 'Crownleigh', 'Fairfax', 'Redgrave', 'Pemberton', 'Strathmore', 'Kingsley', 'Norwood', 'Ellingford', 'Hartwell', 'Whitmore', 'Lockewood', 'Draycott', 'Belvoir', 'Ashford', 'Ravenspur', 'Highcourt'],
  },
  'Mythology (Gods & Legends)': {
    first: ['Orion', 'Selene', 'Atlas', 'Nyx', 'Perseus', 'Hecate', 'Zephyr', 'Brigid', 'Ra', 'Freya', 'Pan', 'Medea', 'Castor', 'Electra', 'Argus', 'Cassandra', 'Hyperion', 'Isis', 'Daedalus', 'Andromeda', 'Icarus', 'Minerva', 'Odin', 'Helios', 'Echo'],
    last: ['Stormbringer', 'Moonveil', 'Sunfire', 'Nightward', 'Starhelm', 'Thunderborn', 'Tidecaller', 'Flameheart', 'Goldleaf', 'Earthshaper', 'Skyforge', 'Dawnspear', 'Oracle', 'Fatespin', 'Serpent', 'Thunderclap', 'Cloudwalker', 'Riverbend', 'Ashprophet', 'Wolfborn', 'Ravencloak', 'Ironbloom', 'Shadowoak', 'Lightning', 'Dreamforge'],
  },
  'Time Travelers': {
    first: ['Chrono', 'Epoch', 'Paradox', 'Delta', 'Minute', 'Quantum', 'Flux', 'Orbit', 'Vector', 'Phase', 'Anchor', 'Drift', 'Skip', 'Loop', 'Prime', 'Shift', 'Tachyon', 'Continuum', 'Meridian', 'Pulse', 'Retro', 'Forward', 'Split', 'Sync', 'Warden'],
    last: ['Walker', 'Jumper', 'Spinner', 'Keeper', 'Pilot', 'Voyager', 'Looper', 'Rider', 'Watcher', 'Guard', 'Binder', 'Strider', 'Hopper', 'Fixer', 'Breaker', 'Anchor', 'Drifter', 'Echo', 'Chrono', 'Skipper', 'Rewind', 'Fastlane', 'Slowburn', 'Paradox', 'Clockhand'],
  },
  Spies: {
    first: ['Silas', 'Vesper', 'Orion', 'Nadia', 'Cipher', 'Mara', 'Phoenix', 'Ivan', 'Sable', 'Ren', 'Lyra', 'Damian', 'Cleo', 'Felix', 'Zara', 'Jonas', 'Iris', 'Viktor', 'Nova', 'Elliot', 'Yuki', 'Marcus', 'Asha', 'Leo', 'Quinn'],
    last: ['Black', 'Vane', 'Wire', 'Pike', 'Mercer', 'Locke', 'Static', 'Malone', 'Switch', 'Reed', 'Knox', 'Cross', 'Vale', 'Frost', 'Harrow', 'Quill', 'Rook', 'Shade', 'Cipher', 'Ghost', 'Echo', 'Viper', 'Raven', 'Stone', 'Blade'],
  },
  Cowboys: {
    first: ['Dusty', 'Calamity', 'Buckshot', 'Cactus', 'Trigger', 'Whiskey', 'Rattlesnake', 'Prairie', 'Lasso', 'Bandit', 'Tumbleweed', 'Jesse', 'Rosie', 'Clay', 'Annie', 'Hank', 'Ruby', 'Deputy', 'Reno', 'Sierra', 'Colt', 'Jolene', 'Ranger', 'Tex', 'Mara'],
    last: ['McGraw', 'Holloway', 'Cartwright', 'Dalton', 'Rivers', 'Blackwood', 'Creek', 'Dryden', 'Hollis', 'Langtry', 'Masterson', 'Oakley', 'Pecos', 'Rawlins', 'Sundown', 'Tanner', 'Vance', 'Wylie', 'Yates', 'Zane', 'Ashford', 'Briscoe', 'Cassidy', 'Durango', 'Ellsworth'],
  },
  'Detectives Noir': {
    first: ['Marlowe', 'Vera', 'Sterling', 'Iris', 'Gideon', 'Lola', 'Felix', 'Mavis', 'Orson', 'Rita', 'Silas', 'Delia', 'Cyrus', 'Faye', 'Hugo', 'Greta', 'Vincent', 'Nora', 'Roland', 'Pearl', 'Dexter', 'Vivian', 'Archer', 'Mae', 'Quentin'],
    last: ['Blackwood', 'Noir', 'Frost', 'Voss', 'Crowe', 'Locke', 'Harlow', 'Sinclair', 'Quill', 'Vale', 'Ashcroft', 'Raven', 'Stonecipher', 'Nightshade', 'Grimm', 'Hollow', 'Cross', 'Marrow', 'Spade', 'Wexler', 'Drift', 'Maltese', 'Fogarty', 'Rains', 'Sterling'],
  },
  Medical: {
    first: ['Dr. Payne', 'Nurse Hart', 'Dr. Stitches', 'Dr. Grey', 'Matron Bloom', 'Dr. Wells', 'Dr. Swift', 'Dr. Stone', 'Dr. Pulse', 'Dr. Murky', 'Dr. Calm', 'Nurse Rook', 'Dr. Sharp', 'Dr. Vein', 'Dr. Quiet', 'Dr. Loud', 'Dr. Frost', 'Dr. Ember', 'Dr. Knot', 'Dr. Plain', 'Dr. Rush', 'Dr. Slow', 'Dr. Vial', 'Dr. Mask', 'Dr. Chart'],
    last: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  },
  Wrestlers: {
    first: ['The Crusher', 'Neon Viper', 'Iron Titan', 'Mad Dog', 'Steel Rose', 'Bone Ripper', 'Ultra Nova', 'Dirty Duke', 'Raging Rex', 'Lady Piledriver', 'Big Hammer', 'Savage Sue', 'Chrome King', 'Shadow Slam', 'Turbo Terry', 'Queen Suplex', 'Axel Crow', 'Grim Lock', 'Flash Fury', 'Bronco Bill', 'Venom Val', 'Hurricane', 'Rocksteady', 'Chainz', 'Miss Mayhem'],
    last: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  },
  Cyberpunk: {
    first: ['Neon', 'Chrome', 'Glitch', 'Byte', 'Proxy', 'Vex', 'Razor', 'Pulse', 'Ghost', 'Synth', 'Nova', 'Hex', 'Trace', 'Volt', 'Echo', 'Shard', 'Null', 'Patch', 'Wire', 'Flux', 'Cache', 'Stack', 'Kernel', 'Pixel', 'Drone'],
    last: ['Runner', 'Jack', 'Shade', 'Wire', 'Crash', 'Netrip', 'Drift', 'Vex', 'Hex', 'Static', 'Override', 'Blackout', 'Spike', 'Circuit', 'Daemon', 'Rootkit', 'Firewall', 'Portscan', 'Ghostlink', 'Chrome', 'Stackdump', 'Buffer', 'Thread', 'Packet', 'Zero'],
  },
  Aliens: {
    first: ['Zor', 'Xan', 'Glip', 'Vrax', 'Qor', 'Nebu', 'Kly', 'Orbi', 'Zyn', 'Ryl', 'Prax', 'Mork', 'Thix', 'Wex', 'Yul', 'Plox', 'Drix', 'Fenn', 'Jix', 'Lorr', 'Nix', 'Opp', 'Quell', 'Rix', 'Senn'],
    last: ['thar', 'bix', 'nox', 'dari', 'quon', 'miri', 'vex', 'lume', 'zar', 'trix', 'plex', 'zon', 'vox', 'nix', 'plor', 'wex', 'jor', 'klyx', 'mox', 'nor', 'pex', 'qix', 'rox', 'syx', 'tox'],
  },
  'Wizards & Witches': {
    first: ['Arcane', 'Morgana', 'Hex', 'Rune', 'Merlin', 'Sage', 'Coven', 'Wisp', 'Ember', 'Nimbus', 'Thistle', 'Bramble', 'Obsidian', 'Luna', 'Solstice', 'Grim', 'Willow', 'Crow', 'Myst', 'Elder', 'Spell', 'Star', 'Night', 'Broom', 'Cauldron'],
    last: ['Moonspell', 'Starweaver', 'Nightbloom', 'Crowfeather', 'Shadowoak', 'Emberwand', 'Crystalthorn', 'Stormsigil', 'Ravencloak', 'Willowmist', 'Goldglyph', 'Spellforge', 'Blackroot', 'Frosthex', 'Deepspell', 'Wildwand', 'Ashcoven', 'Gloom', 'Brightcurse', 'Voidleaf', 'Ironcharm', 'Dreamhex', 'Saltcircle', 'Bloodrune', 'Ghostflame'],
  },
  Ninjas: {
    first: ['Shadow', 'Silent', 'Night', 'Swift', 'Ghost', 'Kage', 'Yoru', 'Shin', 'Steel', 'Smok', 'Viper', 'Lotus', 'Raven', 'Mist', 'Talon', 'Blade', 'Fox', 'Crescent', 'Sparrow', 'Wraith', 'Cipher', 'Haze', 'Storm', 'Frost', 'Ember'],
    last: ['Blade', 'Fox', 'Shuriken', 'Mist', 'Fang', 'Whisper', 'Strike', 'Talon', 'Crescent', 'Sparrow', 'Wraith', 'Cipher', 'Veil', 'Claw', 'River', 'Stone', 'Ash', 'Thunder', 'Moon', 'Wind', 'Fire', 'Ice', 'Root', 'Peak', 'Depth'],
  },
  'Rock Stars': {
    first: ['Riff', 'Axel', 'Crash', 'Neon', 'Jett', 'Razor', 'Blaze', 'Echo', 'Spike', 'Storm', 'Vinyl', 'Solo', 'Amp', 'Feedback', 'Reverb', 'Distort', 'Glitter', 'Fang', 'Lux', 'Nova', 'Chrome', 'Buzz', 'Screech', 'Mosh', 'Encore'],
    last: ['Voltage', 'Vandal', 'Starlight', 'Riot', 'Hammer', 'Screamer', 'Static', 'Wild', 'Thunder', 'Overdrive', 'Backbeat', 'Feedback', 'Noise', 'Fuzz', 'Wailer', 'Shred', 'Glam', 'Stage', 'Crowd', 'Roadie', 'Groupie', 'Headliner', 'Bassline', 'Drumfire', 'Encore'],
  },
  'Flying Squad': {
    first: ['Wing', 'Ace', 'Falcon', 'Tempest', 'Spitfire', 'Radar', 'Maverick', 'Comet', 'Striker', 'Bishop', 'Arrow', 'Rook', 'Viper', 'King', 'Fox', 'Hawk', 'Jones', 'Clarke', 'Stone', 'Blaze', 'Sky', 'Cloud', 'Nimbus', 'Jet', 'Prop'],
    last: ['Harrier', 'Vector', 'Stratton', 'Blaze', 'Kingston', 'Lockheed', 'Crosswind', 'Nighthawk', 'Turbine', 'Skyward', 'Tailwind', 'Vortex', 'Goshawk', 'Stratos', 'Wingate', 'Flynn', 'Sortie', 'Dogfight', 'Afterburn', 'Contrail', 'Skylark', 'Propwash', 'Wingover', 'Strato', 'Cloudbreak'],
  },
  'Drag Queens': {
    first: ['Miss', 'Lady', 'Velvet', 'Crystal', 'Sasha', 'Cherry', 'Diva', 'Electra', 'Glam', 'Lola', 'Paris', 'Nova', 'Mona', 'Roxy', 'Stella', 'Venus', 'Dahlia', 'Fifi', 'Gigi', 'Honey', 'Ivy', 'Jade', 'Kitty', 'Luxe', 'Mimi'],
    last: ['Devine', 'St James', 'Fierce', 'Deluxe', 'LaRue', 'Lips', 'Fantasia', 'Sparkle', 'Monroe', 'Velour', 'Sensation', 'Supreme', 'Dazzle', 'Glitter', 'Shade', 'Werk', 'Slay', 'Vogue', 'Runway', 'Tuck', 'Beat', 'Haus', 'Drama', 'Tea', 'Gag'],
  },
  Superheroes: {
    first: ['Captain', 'Mega', 'Ultra', 'Shadow', 'Star', 'Iron', 'Cosmic', 'Mighty', 'Turbo', 'Thunder', 'Quantum', 'Nova', 'Pulse', 'Vortex', 'Sentinel', 'Phantom', 'Blaze', 'Falcon', 'Titan', 'Comet', 'Bolt', 'Shield', 'Burst', 'Eclipse', 'Apex'],
    last: ['Nova', 'Shield', 'Blaze', 'Bolt', 'Falcon', 'Comet', 'Titan', 'Pulse', 'Vortex', 'Phantom', 'Sentinel', 'Surge', 'Strike', 'Force', 'Guard', 'Watch', 'Prime', 'Rush', 'Flash', 'Storm', 'Mind', 'Steel', 'Wing', 'Ray', 'Core'],
  },
};

const BIO_ROTATIONS = {
  Vikings: [
    'swears the sagas left out the boring parts—conveniently the parts that contradict them.',
    'keeps "finding" treasure maps that always point toward someone else\'s hoard.',
    'claims every storm is a sign—and every sign agrees with their story.',
    'mutters about oaths like contracts written in disappearing ink.',
    'laughs loudest when the blame drifts toward tourists.',
  ],
  Gladiators: [
    'insists the crowd saw a clean win—just not which side paid them.',
    'adjusts their story every time the sand shifts underfoot.',
    'quotes "honor" like a shield, then hides behind it.',
    'remembers every wound except the one that matters.',
    'acts like the arena clock is always on their side.',
  ],
  Royalty: [
    'speaks in velvet threats and calls it diplomacy.',
    'knows the family tree—and prunes it when questioned.',
    'claims scandal is "below them" while standing in it.',
    'smiles like a portrait and blinks like a ledger.',
    'insists protocol forbids the truth, but not convenient lies.',
  ],
  'Mythology (Gods & Legends)': [
    'quotes prophecy like a weather report—always retroactively accurate.',
    'swears mortals misheard the oracle; oddly, always in their favor.',
    'treats fate like a suggestion until it isn\'t.',
    'claims thunder is just applause for their version.',
    'warns you not to look—then asks why you flinched.',
  ],
  'Time Travelers': [
    'remembers tomorrow differently depending who asks.',
    'carries three timelines and pockets the fourth.',
    'blames paradox whenever the details wobble.',
    'insists clocks lie—but only when inconvenient.',
    'says the future is "mostly stable" like a bad foundation.',
  ],
  Spies: [
    'answers in riddles, then grades your translation.',
    'burns cover stories slower than evidence.',
    'claims "need to know" includes knowing your secrets first.',
    'smiles like a briefing and vanishes like a footnote.',
    'calls it tradecraft when they dodge a straight answer.',
  ],
  Cowboys: [
    'spits truth like tobacco—aimed, timed, and rarely accidental.',
    'swears the horizon moves when their alibi needs space.',
    'talks slow and thinks sideways.',
    'remembers brands, not faces—until the bill comes due.',
    'calls it frontier justice when the math works out for them.',
  ],
  'Detectives Noir': [
    'lights a match for drama—and burns the timeline.',
    'reads guilt like braille on a clean conscience.',
    'calls it intuition when it is selective memory.',
    'keeps fog in the alley and fog in the answers.',
    'asks one question that breaks three alibis.',
  ],
  Medical: [
    'charts symptoms like poetry—heavy on metaphor, light on facts.',
    'recommends rest whenever the questions get sharp.',
    'calls it bedside manner when they redirect blame.',
    'knows the dosage of silence perfectly.',
    'insists the chart is confidential—especially from the patient.',
  ],
  Wrestlers: [
    'cuts promos that rewrite what just happened.',
    'calls interference "the invisible hand of destiny."',
    'flexes innocence harder than the championship belt.',
    'blames the ropes, the ref, and gravity—in that order.',
    'sells a story better than a suplex.',
  ],
  Cyberpunk: [
    'routes truth through enough proxies to lose it.',
    'calls corruption "latency" and shrugs.',
    'keeps backups of lies on cold storage.',
    'insists the glitch is feature—until it incriminates.',
    'speaks in patches and patches the truth.',
  ],
  Aliens: [
    'translates poorly on purpose when cornered.',
    'claims Earth customs are "too confusing"—except convenient ones.',
    'blinks sideways at direct questions.',
    'insists their homeworld is classified—and so is lunch.',
    'offers friendship like a contract with fine print.',
  ],
  'Wizards & Witches': [
    'blames the moon phase for inconsistent testimony.',
    'quotes ancient law that only exists when needed.',
    'insists the cauldron bubbled "that way" before anyone looked.',
    'smells like smoke and plausible deniability.',
    'offers a charm that makes questions drift off course.',
  ],
  Ninjas: [
    'was never there—except when claiming credit.',
    'speaks once, lies twice, vanishes thrice.',
    'claims shadows are witnesses—and they refuse to testify.',
    'throws smoke and narrative at the same time.',
    'insists silence is an answer—it just depends who hears it.',
  ],
  'Rock Stars': [
    'treats backstage passes like alibis.',
    'remembers the setlist wrong on purpose.',
    'calls chaos "artistic direction."',
    'autographs denials faster than truth.',
    'turns feedback into feedback loops.',
  ],
  'Flying Squad': [
    'calls evasive maneuvers "clarification."',
    'logs hours that do not match the sun.',
    'insists turbulence explains the timeline.',
    'talks in call signs and dodges in plain English.',
    'claims radio static ate the important sentence.',
  ],
  'Drag Queens': [
    'reads the room—and edits the transcript.',
    'serves looks first, receipts never.',
    'calls shade "constructive glitter."',
    'winks through accusations like runway lights.',
    'makes denial a performance piece—standing ovation optional.',
  ],
  Superheroes: [
    'cites secret identity to dodge public facts.',
    'claims the mask muffled the truth.',
    'insists collateral damage is "off-panel."',
    'gives hero speeches that relocate blame skyward.',
    'swears the villain started it—every time, everywhere.',
  ],
};

const COSTUME = {
  Vikings: 'fur mantle, ring-mail collar suggestion, runic brooch abstract, braided or wild hair, battle-scar cheek, hornless pragmatic gear',
  Gladiators: 'bronze greaves hint, leather pteruges shoulder, sweat-salt sheen, arena grit, laurel-or-not victory crown optional',
  Royalty: 'velvet or brocade high collar, jeweled chain abstract, powdered wig OR slick aristocrat hair, haughty chin',
  'Mythology (Gods & Legends)': 'gold laurel or circlet abstract, draped chiton or toga fold, divine glow as hard cel rim light not soft bloom',
  'Time Travelers': 'mismatched era jacket lapels, LED strip accents, pocket watch with wrong hands, chronometer pin generic',
  Spies: 'trench or tailored black coat, earpiece wire, mirrored shades half-down, bruised knuckle optional',
  Cowboys: 'dusty hat brim, bandana knot, denim or duster collar, sun-leather skin',
  'Detectives Noir': 'fedora shadow, trench lapel, cigarette prop unlit, five-o-clock grit',
  Medical: 'scrubs or lab coat, stethoscope, ID badge blank plastic, tired smug eyes',
  Wrestlers: 'face paint stripes, championship belt buckle abstract shape, sweat sheen, mic cord at neck edge',
  Cyberpunk: 'neon piping jacket, chrome cheek implant, under-eye HUD glasses blank, cable collar',
  Aliens: 'slightly green or grey skin, antenna nubs, jumpsuit with triangle insignia abstract, too-many eyelids suggestion',
  'Wizards & Witches': 'pointed hat brim cut by frame top, cloak clasp crystal, wand tip barely visible at chest line',
  Ninjas: 'wrapped mask half-down OR hood, throwing knife handle in headband, black gi collar',
  'Rock Stars': 'spandex, torn fishnet, heavy eyeliner, wild hair, lightning makeup bolt',
  'Flying Squad': 'flight jacket patches as abstract shapes, headset boom, aviator frames',
  'Drag Queens': 'big wig volume, lashes to forehead, sequin bustier, contour warpaint',
  Superheroes: 'spandex suit chevron emblem abstract, cape fold, heroic jaw, mask lines',
};

function fullName(theme, index) {
  const { first, last } = NAME_PARTS[theme];
  const f = first[index % first.length];
  const l = last[index % last.length];
  if (!l) return f;
  return `${f} ${l}`.trim();
}

function bioLine(theme, name, index) {
  const lines = BIO_ROTATIONS[theme];
  const line = lines[index % lines.length];
  return `${name} ${line}`;
}

function lookLine(theme, name, index) {
  const first = name.split(/\s+/)[0] || name;
  const hair = pick(HAIR, index, 1);
  const skin = pick(SKIN, index, 2);
  const eyeMood = pick(EYES, index, 3);
  const costume = COSTUME[theme];
  return (
    `1990s rude-toon bust: lanky neck, thick black outlines, grimy cel shading, ${skin} skin, ${hair} messy hair clumps, ${eyeMood}. `
    + `${first} wears ${costume}. Huge bulging eyes with tiny pin pupils; expression sells shady party-game liar energy. `
    + `Theme: ${theme}. No readable text on props.`
  );
}

function buildTheme(theme) {
  const slug = themeFolder(theme);
  const rows = [];
  const usedSlugs = new Set();
  for (let i = 0; i < COUNT; i += 1) {
    const name = fullName(theme, i);
    let baseSlug = toSlug(name);
    let id = `${slug}-${baseSlug}`;
    let suffix = 2;
    while (usedSlugs.has(id)) {
      id = `${slug}-${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(id);
    const bio = bioLine(theme, name, i);
    const look = lookLine(theme, name, i);
    const filename = `${String(i + 1).padStart(2, '0')}-${baseSlug}.png`;
    rows.push({
      id,
      name,
      bio,
      imageSrc: `/assets/themes/${slug}/personas/${filename}`,
      look,
    });
  }
  return rows;
}

const roster = {};
const tailoredFlat = {};

for (const theme of DLC_THEMES) {
  const rows = buildTheme(theme);
  roster[theme] = rows.map(({ look, ...rest }) => rest);
  for (const row of rows) {
    tailoredFlat[row.id] = row.look;
  }
}

const rosterPath = path.join(repoRoot, 'src', 'data', 'dlcPersonaRoster.json');
const tailoredPath = path.join(repoRoot, 'scripts', 'data', 'personaAvatarTailored-dlc.json');

fs.mkdirSync(path.dirname(rosterPath), { recursive: true });
fs.mkdirSync(path.dirname(tailoredPath), { recursive: true });

fs.writeFileSync(rosterPath, `${JSON.stringify(roster, null, 2)}\n`, 'utf8');
fs.writeFileSync(tailoredPath, `${JSON.stringify(tailoredFlat, null, 2)}\n`, 'utf8');

const total = Object.values(roster).reduce((n, a) => n + a.length, 0);
console.log(`[generateDlcPersonaRoster] Wrote ${total} personas across ${DLC_THEMES.length} themes.`);
console.log(`- ${rosterPath}`);
console.log(`- ${tailoredPath}`);
