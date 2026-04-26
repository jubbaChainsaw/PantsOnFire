function buildPool(a, b, limit = 50, joiner = ' ') {
  const out = [];
  for (const first of a) {
    for (const second of b) {
      out.push(`${first}${joiner}${second}`.trim());
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function ensureMinSize(pool, min = 50, fallback = []) {
  if (pool.length >= min) return pool;
  const merged = [...pool];
  for (const candidate of fallback) {
    if (!merged.includes(candidate)) merged.push(candidate);
    if (merged.length >= min) break;
  }
  return merged;
}

const MURDER_MYSTERY_NAMES = ensureMinSize(buildPool(
  ['Inspector', 'Detective', 'Lady', 'Lord', 'Colonel', 'Miss', 'Mister', 'Professor', 'Madam', 'Sir', 'Constable', 'Agent'],
  ['Marple', 'Holmes', 'Mortimer', 'Blackwood', 'Fletcher', 'Ashcroft', 'Hawthorne', 'Wren', 'Sinclair', 'Pembroke', 'Ravenshaw', 'Whitlock'],
  60
));
const COPS_AND_ROBBERS_NAMES = ensureMinSize(buildPool(
  ['Officer', 'Detective', 'Sheriff', 'Marshal', 'Deputy', 'Sergeant', 'Captain', 'Chief', 'Rookie', 'Inspector', 'Tracker', 'Agent'],
  ['Mason', 'Brooks', 'Carter', 'Ramirez', 'Lewis', 'Walker', 'Grant', 'Foster', 'Hayes', 'Bennett', 'Parker', 'Cole'],
  60
));
const GHOSTS_AND_GHOULS_NAMES = ensureMinSize(buildPool(
  ['Ghoul', 'Wraith', 'Phantom', 'Banshee', 'Specter', 'Grave', 'Crypt', 'Night', 'Raven', 'Hex', 'Shade', 'Howler'],
  ['Whisper', 'Mire', 'Hollow', 'Grim', 'Thorn', 'Morrow', 'Wailer', 'Dusk', 'Nocturne', 'Veil', 'Ash', 'Fang'],
  60
));

export const NAME_POOLS = {
  Default: buildPool(
    ['Captain', 'Disco', 'Nacho', 'Professor', 'Laser', 'Captain', 'Bubble', 'Waffle', 'Turbo', 'Banana', 'Goblin', 'Doctor', 'Pixel', 'Funky', 'Mystic', 'Sassy', 'Ninja', 'Chaotic', 'Cosmic', 'Mega'],
    ['Pants', 'McGiggles', 'Thunderbiscuit', 'Von Drama', 'Snorkel', 'Fluff', 'BoomBoom', 'Pickle', 'Sparkles', 'Wobble', 'McNugget', 'Beep', 'Fizz', 'Nope', 'Chaos', 'Bananas', 'Whistle', 'Wiggles', 'McSauce', 'Jellybean'],
    100
  ),
  Pirates: ensureMinSize(buildPool(['Captain', 'Salty', 'Barnacle', 'Pegleg', 'Scurvy', 'Mad', 'Cutlass', 'Blacktooth', 'Rumbeard', 'One-Eyed', 'Kraken', 'Buccaneer'], ['Jack', 'Babs', 'Bill', 'Pam', 'Barry', 'Mollie', 'Ron', 'Cathy', 'Gus', 'Ollie', 'Nibs', 'Bones'], 60)),
  Victorian: MURDER_MYSTERY_NAMES,
  'Murder Mystery': MURDER_MYSTERY_NAMES,
  'Cops and Robbers': COPS_AND_ROBBERS_NAMES,
  'Ghosts and Ghouls': GHOSTS_AND_GHOULS_NAMES,
  Spies: ensureMinSize(buildPool(['Agent', 'Cipher', 'Shadow', 'Nova', 'Whisper', 'Ghost', 'Zero', 'Velvet', 'Ivy', 'Echo', 'Phantom', 'Onyx'], ['Black', 'Knox', 'Vane', 'Wire', 'Pike', 'Mercer', 'Code', 'Reed', 'Static', 'Malone', 'Switch', 'Locke'], 60)),
  Cowboys: ensureMinSize(buildPool(['Dusty', 'Calamity', 'Buckshot', 'Cactus', 'Trigger', 'Whiskey', 'Rattlesnake', 'Prairie', 'Lasso', 'Sheriff', 'Bandit', 'Tumbleweed'], ['Dan', 'Jo', 'Benny', 'Kate', 'Tess', 'Wade', 'Ray', 'June', 'Lou', 'Skip', 'Mae', 'Bo'], 60)),
  Gangsters: ensureMinSize(buildPool(['Tony', 'Big', 'Vinny', 'Sal', 'Lucky', 'Frankie', 'Mickey', 'Johnny', 'Donny', 'Rico', 'Joey', 'Benny'], ['Two-Times', 'the Knife', 'the Rat', 'No Nose', 'Brass', 'the Mouth', 'Tight Lips', 'the Ghost', 'Bags', 'the Fixer', 'Long Coat', 'Quick Hands'], 60)),
  Monsters: ensureMinSize(buildPool(['Count', 'Ghoul', 'Fang', 'Mummy', 'Banshee', 'Sludge', 'Rotfang', 'Howler', 'Creep', 'Bog', 'Crypt', 'Witch'], ['Dracula', 'Maw', 'Nora', 'Bones', 'Stitch', 'Rot', 'Wailer', 'Claw', 'Tooth', 'Lurker', 'Mire', 'Hex'], 60)),
  'Rock Stars': ensureMinSize(buildPool(['Riff', 'Axel', 'Crash', 'Neon', 'Jett', 'Razor', 'Blaze', 'Echo', 'Spike', 'Storm', 'Vinyl', 'Solo'], ['Voltage', 'Vandal', 'Starlight', 'Riot', 'Hammer', 'Screamer', 'Static', 'Wild', 'Feedback', 'Thunder', 'Overdrive', 'Backbeat'], 60)),
  'Flying Squad': ensureMinSize(buildPool(['Wing', 'Flight', 'Squadron', 'Ace', 'Falcon', 'Spitfire', 'Tempest', 'Lancaster', 'Radar', 'Maverick', 'Comet', 'Striker'], ['Leader', 'Fox', 'Bishop', 'Hawk', 'Jones', 'Clarke', 'Viper', 'King', 'Arrow', 'Rook', 'Blaze', 'Stone'], 60)),
  'Drag Queens': ensureMinSize(buildPool(['Miss', 'Lady', 'Velvet', 'Crystal', 'Sasha', 'Cherry', 'Diva', 'Electra', 'Glam', 'Lola', 'Paris', 'Nova'], ['Devine', 'St. James', 'Fierce', 'Deluxe', 'LaRue', 'Lips', 'Fantasia', 'Sparkle', 'Monroe', 'Velour', 'Sensation', 'Supreme'], 60)),
  Superheroes: ensureMinSize(buildPool(['Captain', 'Mega', 'Ultra', 'Shadow', 'Star', 'Iron', 'Cosmic', 'Mighty', 'Turbo', 'Thunder', 'Quantum', 'Nova'], ['Nova', 'Shield', 'Blaze', 'Bolt', 'Falcon', 'Comet', 'Titan', 'Pulse', 'Vortex', 'Phantom', 'Sentinel', 'Burst'], 60)),
  Aliens: ensureMinSize(buildPool(['Zor', 'Xan', 'Glip', 'Vrax', 'Qor', 'Nebu', 'Kly', 'Orbi', 'Zyn', 'Ryl', 'Prax', 'Mork'], ['thar', 'bix', 'nox', 'dari', 'quon', 'miri', 'vex', 'lume', 'zar', 'trix', 'plex', 'zon'], 60, '-')),
  Medical: ensureMinSize(buildPool(['Dr', 'Nurse', 'Consultant', 'Matron', 'Paramedic', 'Surgeon', 'Registrar', 'Porter', 'Professor', 'Medic', 'Therapist', 'Midwife'], ['Payne', 'Stitches', 'Murphy', 'Grey', 'Bones', 'Hart', 'Swift', 'Stone', 'Wells', 'Bloom', 'Scalpel', 'Pulse'], 60)),
  Royalty: ensureMinSize(buildPool(['King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess', 'Baron', 'Baroness', 'Lord', 'Lady', 'Regent', 'Count'], ['Aurelius', 'Beatrice', 'Cedric', 'Evangeline', 'Montrose', 'Windsor', 'Thorne', 'Valmont', 'Rosemere', 'Ashbury', 'Goldcrest', 'Ivoryhall'], 60)),
  Wrestlers: ensureMinSize(buildPool(['The', 'Big', 'Stone', 'Mad', 'Raging', 'Iron', 'Savage', 'Dirty', 'Neon', 'Steel', 'Bone', 'Ultra'], ['Crusher', 'Slammer', 'Viper', 'Hammer', 'Dropkick', 'Destroyer', 'Titan', 'Ripper', 'Bulldog', 'Renegade', 'Suplex', 'PileDriver'], 60)),
  Cyberpunk: ensureMinSize(buildPool(['Neon', 'Chrome', 'Glitch', 'Cipher', 'Byte', 'Nova', 'Pulse', 'Proxy', 'Static', 'Ghost', 'Synth', 'Razor'], ['Runner', 'Jack', 'Shade', 'Wire', 'Vex', 'Hex', 'Crash', 'Netrip', 'Trace', 'Drift', 'Volt', 'Echo'], 60)),
  Vikings: ensureMinSize(buildPool(['Ragnar', 'Freya', 'Bjorn', 'Astrid', 'Leif', 'Sigrid', 'Ivar', 'Eirik', 'Hilda', 'Sten', 'Ulf', 'Kara'], ['Stormborn', 'Ironshield', 'Skaldson', 'Frostaxe', 'Longbraid', 'Wavebreaker', 'Ravenscar', 'Wolfhelm', 'Oakfist', 'Stonefjord', 'Battlehorn', 'Northstar'], 60)),
  Ninjas: ensureMinSize(buildPool(['Shadow', 'Silent', 'Night', 'Swift', 'Ghost', 'Kage', 'Yoru', 'Shin', 'Steel', 'Smok', 'Viper', 'Lotus'], ['Blade', 'Fox', 'Shuriken', 'Mist', 'Fang', 'Whisper', 'Strike', 'Talon', 'Crescent', 'Sparrow', 'Wraith', 'Cipher'], 60)),
  'Detectives Noir': ensureMinSize(buildPool(['Detective', 'Inspector', 'Private', 'Sergeant', 'Chief', 'Agent', 'Lieutenant', 'Marshall', 'Sleuth', 'Gumshoe', 'Officer', 'Captain'], ['Marlowe', 'Blackwood', 'Harlow', 'Sinclair', 'Noir', 'Frost', 'Sterling', 'Voss', 'Quill', 'Locke', 'Crowe', 'Vale'], 60)),
  'Mythology (Gods & Legends)': ensureMinSize(buildPool(['Zeus', 'Athena', 'Odin', 'Freya', 'Ra', 'Isis', 'Thor', 'Hera', 'Anubis', 'Perseus', 'Nyx', 'Apollo'], ['Stormbringer', 'Dawnspear', 'Skyforge', 'Moonveil', 'Sunfire', 'Earthshaper', 'Tidecaller', 'Thunderborn', 'Nightward', 'Starhelm', 'Goldleaf', 'Flameheart'], 60)),
  'Post-Apocalypse': ensureMinSize(buildPool(['Dust', 'Rust', 'Scav', 'Warden', 'Havoc', 'Ash', 'Nomad', 'Patch', 'Scrap', 'Rad', 'Rogue', 'Breaker'], ['Runner', 'Walker', 'Forge', 'Rift', 'Cage', 'Drifter', 'Lock', 'Silo', 'Grit', 'Wreck', 'Hollow', 'Spike'], 60)),
  Carnival: ensureMinSize(buildPool(['Ringmaster', 'Jester', 'Glitter', 'Trixie', 'Barker', 'Sparky', 'Fizz', 'Confetti', 'Jumbo', 'Twinkle', 'Bubbles', 'Carousel'], ['Blaze', 'Bell', 'Rumble', 'Flare', 'Flip', 'Whirl', 'Wonder', 'Flash', 'Boom', 'Bounce', 'Dazzle', 'Whistle'], 60)),
  'Wizards & Witches': ensureMinSize(buildPool(['Arcane', 'Mystic', 'Hex', 'Rune', 'Warden', 'Merlin', 'Morgana', 'Sage', 'Elder', 'Coven', 'Spell', 'Wisp'], ['Moonspell', 'Starweaver', 'Nightbloom', 'Crowfeather', 'Shadowoak', 'Emberwand', 'Crystalthorn', 'Stormsigil', 'Ravencloak', 'Willowmist', 'Goldglyph', 'Spellforge'], 60)),
  'Time Travelers': ensureMinSize(buildPool(['Chrono', 'Epoch', 'Paradox', 'Future', 'Past', 'Temporal', 'Quantum', 'Delta', 'Minute', 'Second', 'Orbit', 'Flux'], ['Walker', 'Jumper', 'Spinner', 'Rider', 'Keeper', 'Pilot', 'Drift', 'Looper', 'Warden', 'Echo', 'Voyager', 'Anchor'], 60)),
  Gladiators: ensureMinSize(buildPool(['Maximus', 'Cassia', 'Tiber', 'Flavius', 'Aurelia', 'Spartacus', 'Brutus', 'Lucius', 'Octavia', 'Marcellus', 'Varro', 'Drusus'], ['Lionheart', 'Ironhelm', 'Stoneblade', 'Arena', 'Stormspear', 'Redshield', 'Thunderarm', 'Bronzefang', 'Dawnguard', 'Warcry', 'Sunspear', 'Bloodsand'], 60)),
};

function validateNamePools() {
  const MIN_DEFAULT = 100;
  const MIN_THEME = 50;
  const issues = [];

  const defaultCount = (NAME_POOLS.Default || []).length;
  if (defaultCount < MIN_DEFAULT) {
    issues.push(`Default has ${defaultCount} names (needs ${MIN_DEFAULT}).`);
  }

  for (const [theme, names] of Object.entries(NAME_POOLS)) {
    if (theme === 'Default') continue;
    if ((names || []).length < MIN_THEME) {
      issues.push(`${theme} has ${(names || []).length} names (needs ${MIN_THEME}).`);
    }
  }

  if (issues.length && typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(`[Pants on Fire] Name pool validation failed:\n- ${issues.join('\n- ')}`);
  }
}

validateNamePools();

export function randomNameFromTheme(theme, exclude = []) {
  const pool = NAME_POOLS[theme] || NAME_POOLS.Default;
  const blockedTokens = new Set(
    (exclude || [])
      .flatMap((name) => String(name || '').toLowerCase().split(/[^a-z0-9]+/g))
      .filter(Boolean)
  );

  // Prefer names that do not reuse any token from already-assigned names.
  const tokenFiltered = pool.filter((candidate) => {
    const tokens = String(candidate).toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean);
    return tokens.length > 0 && !tokens.some((token) => blockedTokens.has(token));
  });

  const exactFiltered = pool.filter((name) => !exclude.includes(name));
  const selectionPool = tokenFiltered.length ? tokenFiltered : (exactFiltered.length ? exactFiltered : pool);
  return selectionPool[Math.floor(Math.random() * selectionPool.length)] || pool[0];
}
