#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const defaultOutputRoot = path.join(repoRoot, 'exports', 'parody-picture-rounds');

const DEFAULT_STYLE_NOTES = [
  'bold comic-caricature linework',
  'warped anatomy and exaggerated silhouettes',
  'editorial collage poster energy',
  'strictly spoof album-cover or spoof movie-poster composition language without recreating any exact cover or poster',
  'punk-zine attitude with occasional retro paper-cut collage framing',
  'rich readable costume, hair, prop, and face-shape detail at 800x800',
  'clean but fully designed poster or cover background that helps recognition',
  'punchy cel shading and high contrast',
  'instantly readable central subject or compact ensemble',
].join(', ');

const MUSIC_ENTRIES = [
  { entryId: 'music-01', main: "The Beatles - Sgt. Pepper's Lonely Hearts Club Band", imposter: 'The Beach Boys - Pet Sounds' },
  { entryId: 'music-02', main: 'The Beach Boys - Pet Sounds', imposter: "The Beatles - Sgt. Pepper's Lonely Hearts Club Band" },
  { entryId: 'music-03', main: 'Michael Jackson - Thriller', imposter: 'Prince - Purple Rain' },
  { entryId: 'music-04', main: 'Prince - Purple Rain', imposter: 'Michael Jackson - Thriller' },
  { entryId: 'music-05', main: 'Fleetwood Mac - Rumours', imposter: 'Carole King - Tapestry' },
  { entryId: 'music-06', main: 'Carole King - Tapestry', imposter: 'Joni Mitchell - Blue' },
  { entryId: 'music-07', main: 'The Beatles - Abbey Road', imposter: 'The Rolling Stones - Exile on Main St.' },
  { entryId: 'music-08', main: 'The Rolling Stones - Exile on Main St.', imposter: 'The Clash - London Calling' },
  { entryId: 'music-09', main: 'Bruce Springsteen - Born to Run', imposter: 'Bruce Springsteen - Born in the U.S.A.' },
  { entryId: 'music-10', main: 'Bob Dylan - Highway 61 Revisited', imposter: 'Bob Dylan - Blood on the Tracks' },
  { entryId: 'music-11', main: 'Pink Floyd - The Dark Side of the Moon', imposter: 'Led Zeppelin - Led Zeppelin IV' },
  { entryId: 'music-12', main: 'Led Zeppelin - Led Zeppelin IV', imposter: 'AC/DC - Back in Black' },
  { entryId: 'music-13', main: 'Nirvana - Nevermind', imposter: 'Radiohead - The Bends' },
  { entryId: 'music-14', main: 'Radiohead - OK Computer', imposter: 'The Cure - Disintegration' },
  { entryId: 'music-15', main: "Marvin Gaye - What's Going On", imposter: 'Stevie Wonder - Songs in the Key of Life' },
  { entryId: 'music-16', main: 'Stevie Wonder - Songs in the Key of Life', imposter: "Marvin Gaye - What's Going On" },
  { entryId: 'music-17', main: 'Kate Bush - Hounds of Love', imposter: 'Kate Bush - The Kick Inside' },
  { entryId: 'music-18', main: 'Joni Mitchell - Blue', imposter: 'Carole King - Tapestry' },
  { entryId: 'music-19', main: 'AC/DC - Back in Black', imposter: "Guns N' Roses - Appetite for Destruction" },
  { entryId: 'music-20', main: 'Queen - A Night at the Opera', imposter: 'Elton John - Goodbye Yellow Brick Road' },
  { entryId: 'music-21', main: 'Paul Simon - Graceland', imposter: 'Simon & Garfunkel - Bridge Over Troubled Water' },
  { entryId: 'music-22', main: 'U2 - The Joshua Tree', imposter: 'Dire Straits - Brothers in Arms' },
  { entryId: 'music-23', main: 'The Smiths - The Queen Is Dead', imposter: 'The Stone Roses - The Stone Roses' },
  { entryId: 'music-24', main: 'Madonna - Like a Prayer', imposter: 'George Michael - Faith' },
  { entryId: 'music-25', main: 'Bruce Springsteen - Born in the U.S.A.', imposter: 'Bruce Springsteen - Born to Run' },
  { entryId: 'music-26', main: 'Blondie - Parallel Lines', imposter: 'Duran Duran - Rio' },
  { entryId: 'music-27', main: 'David Bowie - The Rise and Fall of Ziggy Stardust and the Spiders from Mars', imposter: 'David Bowie - Hunky Dory' },
  { entryId: 'music-28', main: 'R.E.M. - Automatic for the People', imposter: 'Radiohead - The Bends' },
  { entryId: 'music-29', main: 'Alanis Morissette - Jagged Little Pill', imposter: 'Adele - 21' },
  { entryId: 'music-30', main: "Sex Pistols - Never Mind the Bollocks, Here's the Sex Pistols", imposter: 'The Clash - London Calling' },
  { entryId: 'music-31', main: 'Radiohead - The Bends', imposter: 'Radiohead - OK Computer' },
  { entryId: 'music-32', main: 'The Velvet Underground & Nico - The Velvet Underground & Nico', imposter: 'The Stone Roses - The Stone Roses' },
  { entryId: 'music-33', main: 'Bob Dylan - Blood on the Tracks', imposter: 'Bob Dylan - Highway 61 Revisited' },
  { entryId: 'music-34', main: 'Michael Jackson - Off the Wall', imposter: 'Michael Jackson - Thriller' },
  { entryId: 'music-35', main: 'The Cure - Disintegration', imposter: 'The Smiths - The Queen Is Dead' },
  { entryId: 'music-36', main: 'David Bowie - Hunky Dory', imposter: 'David Bowie - The Rise and Fall of Ziggy Stardust and the Spiders from Mars' },
  { entryId: 'music-37', main: 'The Stone Roses - The Stone Roses', imposter: 'The Smiths - The Queen Is Dead' },
  { entryId: 'music-38', main: 'Simon & Garfunkel - Bridge Over Troubled Water', imposter: 'Paul Simon - Graceland' },
  { entryId: 'music-39', main: 'Eagles - Hotel California', imposter: 'Dire Straits - Brothers in Arms' },
  { entryId: 'music-40', main: 'Elton John - Goodbye Yellow Brick Road', imposter: 'Queen - A Night at the Opera' },
  { entryId: 'music-41', main: "Guns N' Roses - Appetite for Destruction", imposter: 'AC/DC - Back in Black' },
  { entryId: 'music-42', main: 'Amy Winehouse - Back to Black', imposter: 'Adele - 21' },
  { entryId: 'music-43', main: 'The Police - Synchronicity', imposter: 'Duran Duran - Rio' },
  { entryId: 'music-44', main: 'Dire Straits - Brothers in Arms', imposter: 'U2 - The Joshua Tree' },
  { entryId: 'music-45', main: 'Duran Duran - Rio', imposter: 'Blondie - Parallel Lines' },
  { entryId: 'music-46', main: 'Kate Bush - The Kick Inside', imposter: 'Kate Bush - Hounds of Love' },
  { entryId: 'music-47', main: 'Adele - 21', imposter: 'Alanis Morissette - Jagged Little Pill' },
  { entryId: 'music-48', main: 'George Michael - Faith', imposter: 'Madonna - Like a Prayer' },
  { entryId: 'music-49', main: 'Billy Joel - The Stranger', imposter: 'Carole King - Tapestry' },
  { entryId: 'music-50', main: 'The Clash - London Calling', imposter: "Sex Pistols - Never Mind the Bollocks, Here's the Sex Pistols" },
];

const SCREEN_ENTRIES = [
  { entryId: 'screen-01', main: 'Citizen Kane', imposter: 'Sunset Boulevard' },
  { entryId: 'screen-02', main: 'Casablanca', imposter: 'Titanic' },
  { entryId: 'screen-03', main: 'The Godfather', imposter: 'Goodfellas' },
  { entryId: 'screen-04', main: '2001: A Space Odyssey', imposter: 'Blade Runner' },
  { entryId: 'screen-05', main: 'Vertigo', imposter: 'Rear Window' },
  { entryId: 'screen-06', main: 'Psycho', imposter: 'The Shining' },
  { entryId: 'screen-07', main: "Singin' in the Rain", imposter: 'The Wizard of Oz' },
  { entryId: 'screen-08', main: 'Sunset Boulevard', imposter: 'Citizen Kane' },
  { entryId: 'screen-09', main: 'Lawrence of Arabia', imposter: 'Seven Samurai' },
  { entryId: 'screen-10', main: 'The Wizard of Oz', imposter: 'Spirited Away' },
  { entryId: 'screen-11', main: 'Seven Samurai', imposter: 'Lawrence of Arabia' },
  { entryId: 'screen-12', main: 'Chinatown', imposter: 'No Country for Old Men' },
  { entryId: 'screen-13', main: 'Taxi Driver', imposter: 'Raging Bull' },
  { entryId: 'screen-14', main: 'Jaws', imposter: 'Alien' },
  { entryId: 'screen-15', main: 'Alien', imposter: 'Jaws' },
  { entryId: 'screen-16', main: 'Goodfellas', imposter: 'The Godfather' },
  { entryId: 'screen-17', main: 'Pulp Fiction', imposter: 'Fargo' },
  { entryId: 'screen-18', main: 'The Shawshank Redemption', imposter: "One Flew Over the Cuckoo's Nest" },
  { entryId: 'screen-19', main: "Schindler's List", imposter: 'Lawrence of Arabia' },
  { entryId: 'screen-20', main: 'Raging Bull', imposter: 'Taxi Driver' },
  { entryId: 'screen-21', main: 'Apocalypse Now', imposter: 'There Will Be Blood' },
  { entryId: 'screen-22', main: 'The Silence of the Lambs', imposter: 'Psycho' },
  { entryId: 'screen-23', main: 'Raiders of the Lost Ark', imposter: 'Star Wars' },
  { entryId: 'screen-24', main: 'The Graduate', imposter: 'Eternal Sunshine of the Spotless Mind' },
  { entryId: 'screen-25', main: 'Do the Right Thing', imposter: 'Moonlight' },
  { entryId: 'screen-26', main: 'Blade Runner', imposter: 'The Matrix' },
  { entryId: 'screen-27', main: 'Fargo', imposter: 'No Country for Old Men' },
  { entryId: 'screen-28', main: 'The Matrix', imposter: 'Blade Runner' },
  { entryId: 'screen-29', main: 'Back to the Future', imposter: 'Groundhog Day' },
  { entryId: 'screen-30', main: 'Fight Club', imposter: 'The Social Network' },
  { entryId: 'screen-31', main: 'Titanic', imposter: 'Casablanca' },
  { entryId: 'screen-32', main: 'No Country for Old Men', imposter: 'Fargo' },
  { entryId: 'screen-33', main: 'There Will Be Blood', imposter: 'Apocalypse Now' },
  { entryId: 'screen-34', main: 'The Shining', imposter: 'Psycho' },
  { entryId: 'screen-35', main: 'E.T. the Extra-Terrestrial', imposter: 'Spirited Away' },
  { entryId: 'screen-36', main: "One Flew Over the Cuckoo's Nest", imposter: 'The Shawshank Redemption' },
  { entryId: 'screen-37', main: 'Dr. Strangelove', imposter: 'The Big Lebowski' },
  { entryId: 'screen-38', main: 'Parasite', imposter: 'Do the Right Thing' },
  { entryId: 'screen-39', main: 'Moonlight', imposter: 'The Graduate' },
  { entryId: 'screen-40', main: "Pan's Labyrinth", imposter: 'The Wizard of Oz' },
  { entryId: 'screen-41', main: 'Eternal Sunshine of the Spotless Mind', imposter: 'The Truman Show' },
  { entryId: 'screen-42', main: 'The Social Network', imposter: 'Citizen Kane' },
  { entryId: 'screen-43', main: 'Rear Window', imposter: 'Vertigo' },
  { entryId: 'screen-44', main: 'Groundhog Day', imposter: 'Back to the Future' },
  { entryId: 'screen-45', main: 'The Truman Show', imposter: 'Eternal Sunshine of the Spotless Mind' },
  { entryId: 'screen-46', main: 'The Big Lebowski', imposter: 'Fargo' },
  { entryId: 'screen-47', main: 'Spirited Away', imposter: "Pan's Labyrinth" },
  { entryId: 'screen-48', main: 'Amadeus', imposter: "Singin' in the Rain" },
  { entryId: 'screen-49', main: 'City Lights', imposter: 'Casablanca' },
  { entryId: 'screen-50', main: 'Star Wars', imposter: 'Raiders of the Lost Ark' },
];

const MUSIC_COMPOSITION_MODES = [
  'a spoof album-cover portrait with one bold central figure',
  'a fake gatefold-album sleeve composition with a compact transformed ensemble',
  'an exaggerated spoof vinyl-cover layout with cutout collage framing and strong central iconography',
  'a mock greatest-hits album sleeve built around caricature, silhouette, and signature props',
];

const SCREEN_COMPOSITION_MODES = [
  'a spoof theatrical one-sheet poster with transformed archetypes',
  'a fake blockbuster movie-poster layout with bold central figure placement',
  'an editorial caricature collage framed as a spoof cinema poster, not a direct poster recreation',
  'a parody movie-poster composition with iconic props, tag-line space, and simplified dramatic background',
];

const PACKS = {
  music: {
    categoryId: 'music',
    packId: 'music-parodies-v1',
    label: 'Top 50 Pop/Rock Album Cover Parodies v1',
    groupId: 'music-parodies',
    groupName: 'Album Cover Parodies',
    previewLabel: 'Describe the album-cover parody image clearly without naming the exact album.',
    promptHint: 'Picture Prompt • Album Cover Parody',
    entries: MUSIC_ENTRIES,
    compositionModes: MUSIC_COMPOSITION_MODES,
  },
  screen: {
    categoryId: 'screen',
    packId: 'screen-parodies-v1',
    label: 'Top 50 Film Poster Parodies v1',
    groupId: 'screen-parodies',
    groupName: 'Film Poster Parodies',
    previewLabel: 'Describe the film-poster parody image clearly without naming the exact film.',
    promptHint: 'Picture Prompt • Film Poster Parody',
    entries: SCREEN_ENTRIES,
    compositionModes: SCREEN_COMPOSITION_MODES,
  },
};

function usage() {
  console.log('Usage: npm run picture:generate-parody-rounds -- [options]');
  console.log('');
  console.log('Options:');
  console.log('  --category <music|screen|all>  Which curated pack(s) to process (default: all)');
  console.log(`  --output-root <path>            Output folder (default: ${path.relative(repoRoot, defaultOutputRoot)})`);
  console.log('  --provider <openai|flux>        Image provider (default: openai)');
  console.log('  --api-key <key>                 Provider API key (OPENAI_API_KEY or FAL_KEY / FAL_API_KEY / FLUX_API_KEY)');
  console.log('  --model <name>                  Model name (OpenAI default: gpt-image-1, FLUX default: fal-ai/flux/dev)');
  console.log('  --size <WxH>                    Image size (default: 800x800)');
  console.log('  --quality <low|medium|high>     Image quality (default: high)');
  console.log('  --safety-tolerance <0-6>        Reserved for non-fal FLUX backends');
  console.log('  --limit <n>                     Limit entries per pack for sampling/review');
  console.log('  --style-notes <text>            Override the built-in visual style notes');
  console.log('  --delay-ms <n>                  Wait time between OpenAI calls (default: 500)');
  console.log('  --overwrite                     Regenerate images even if they exist');
  console.log('  --prompts-only                  Write manifest/prompt files without calling OpenAI');
  console.log('  --dry-run                       Print planned actions without writing files');
  console.log('  --help                          Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  npm run picture:generate-parody-rounds -- --prompts-only');
  console.log('  npm run picture:generate-parody-rounds -- --category music --limit 5 --prompts-only');
  console.log('  npm run picture:generate-parody-rounds -- --category screen --output-root public/assets/graphic-packs/picture --overwrite');
}

function parseArgs(argv) {
  const options = {
    category: 'all',
    provider: 'openai',
    model: '',
    size: '800x800',
    quality: 'high',
    safetyTolerance: 6,
    outputRoot: defaultOutputRoot,
    delayMs: 500,
    overwrite: false,
    promptsOnly: false,
    dryRun: false,
    styleNotes: DEFAULT_STYLE_NOTES,
    limit: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--category') { options.category = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; }
    else if (arg === '--provider') { options.provider = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; }
    else if (arg === '--api-key') { options.apiKey = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--model') { options.model = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--size') { options.size = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--quality') { options.quality = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--safety-tolerance') { options.safetyTolerance = Number.parseInt(String(argv[i + 1] || '6'), 10); i += 1; }
    else if (arg === '--output-root') { options.outputRoot = path.resolve(repoRoot, String(argv[i + 1] || '').trim()); i += 1; }
    else if (arg === '--limit') { options.limit = Number.parseInt(String(argv[i + 1] || '0'), 10) || 0; i += 1; }
    else if (arg === '--style-notes') { options.styleNotes = String(argv[i + 1] || '').trim() || DEFAULT_STYLE_NOTES; i += 1; }
    else if (arg === '--delay-ms') { options.delayMs = Number.parseInt(String(argv[i + 1] || '0'), 10) || 0; i += 1; }
    else if (arg === '--overwrite') options.overwrite = true;
    else if (arg === '--prompts-only') options.promptsOnly = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function resolveApiKey(provider, cliKey) {
  if (cliKey) return cliKey;
  if (provider === 'openai') {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    const local = readJsonSafe(localKeysPath, {});
    return String(local.openaiApiKey || '').trim();
  }
  if (provider === 'flux') {
    if (process.env.FAL_KEY) return process.env.FAL_KEY;
    if (process.env.FAL_API_KEY) return process.env.FAL_API_KEY;
    if (process.env.FLUX_API_KEY) return process.env.FLUX_API_KEY;
    const local = readJsonSafe(localKeysPath, {});
    return String(local.falApiKey || local.fluxApiKey || '').trim();
  }
  return '';
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getDefaultModel(provider) {
  if (provider === 'flux') return 'fal-ai/flux/dev';
  return 'gpt-image-1';
}

function parseSize(size) {
  const match = String(size || '').trim().match(/^(\d+)x(\d+)$/i);
  if (!match) throw new Error(`Invalid --size "${size}". Use WIDTHxHEIGHT, for example 800x800.`);
  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid --size "${size}". Width and height must be positive integers.`);
  }
  return { width, height };
}

function validateFluxSize(size) {
  const { width, height } = parseSize(size);
  const validWidth = width >= 256 && width <= 1440 && width % 32 === 0;
  const validHeight = height >= 256 && height <= 1440 && height % 32 === 0;
  if (!validWidth || !validHeight) {
    throw new Error(`FLUX requires width/height between 256 and 1440, each a multiple of 32. Received ${width}x${height}.`);
  }
  return { width, height };
}

const SAFE_SUBJECT_BRIEFS = {
  music: {
    'The Beatles': 'a 1960s British mop-top rock quartet with matching-era tailoring, cheeky charisma, and beat-combo energy',
    'The Rolling Stones': 'a swaggering blues-rock band with messy glamour, skinny silhouettes, and rebellious stage attitude',
    'Elvis Presley': 'a pompadoured rock-and-roll showman in flashy stagewear with retro microphone energy',
    'Johnny Cash': 'a solemn country outlaw singer in stark dark clothing with an acoustic guitar and no-frills stage presence',
    'Madonna': 'a chameleon pop diva with era-shifting fashion, bold dance-pop attitude, and theatrical pose language',
    'Lady Gaga': 'an avant-pop performance icon in surreal high-fashion styling and dramatic stage spectacle',
    'David Bowie': 'an androgynous glam-rock star with lightning-bolt theatricality, vivid styling, and alien-pop charisma',
    'Prince': 'a flamboyant purple-toned funk-pop virtuoso with ornate tailoring and electric-guitar royalty energy',
    'Freddie Mercury': 'a moustached arena-rock frontman with commanding stage pose and stadium singalong energy',
    'Mick Jagger': 'a wiry rock singer with flamboyant movement, pouty swagger, and vintage stage glamour',
    'Taylor Swift': 'a modern stadium-pop songwriter archetype with glittery tour styling, acoustic-pop cues, and diaristic glamour',
    'Olivia Rodrigo': 'a young pop-rock heartbreak star with punky prom-night styling and purple stage energy',
    'Beyonce': 'a regal pop and R&B superstar with gold stage glamour, commanding choreography, and queenly presence',
    'Rihanna': 'a cool fashion-forward pop icon with edgy styling, Caribbean-inflected attitude, and beauty-mogul confidence',
    'Adele': 'a soulful powerhouse vocalist in elegant classic styling with microphone-in-the-spotlight drama',
    'Amy Winehouse': 'a beehive-haired retro-soul rebel with winged eyeliner, tattoos, and smoky jazz-club energy',
    'Michael Jackson': 'a precision-dancing pop legend with military-style stage jacket cues, fedora energy, and moonwalk attitude',
    'Bruno Mars': 'a retro-funk pop entertainer with slick tailoring, showband energy, and charismatic dance moves',
    'Elton John': 'a piano-rock showman with outrageous glasses, sparkling costume flair, and joyful stage exuberance',
    'Billy Joel': 'a piano bar troubadour with New York everyman energy and classic singer-songwriter styling',
    'Bob Dylan': 'a scruffy poetic folk-rock troubadour with harmonica cues and counterculture mystique',
    'Neil Young': 'a rugged folk-rock loner with flannel-ish styling, weathered guitar energy, and melancholic cool',
    'Bruce Springsteen': 'a blue-collar heartland rocker with denim, sweaty arena sincerity, and working-class bravado',
    'Tom Petty': 'a laid-back American rock songwriter with lanky silhouette, jangly guitar vibes, and dusty cool',
    'Dolly Parton': 'a rhinestone country queen with towering blonde hair, sparkling stagewear, and warm Southern charisma',
    'Shania Twain': 'a crossover country-pop diva with leopard-print flair, stadium confidence, and polished glamour',
    'The Sex Pistols': 'a sneering punk band with torn clothes, safety-pin chaos, and tabloid-anarchy energy',
    'The Clash': 'a politically charged punk group with militant street style, guitars, and restless rebel energy',
    'Nirvana': 'a scruffy grunge trio with thrift-store styling, slacker angst, and fuzzy guitar energy',
    'Pearl Jam': 'a brooding 1990s alt-rock band with long-haired earnestness, flannel textures, and arena-grunge vibe',
    'Metallica': 'a heavy metal band with black denim, aggressive guitar attack, and thunderous stage presence',
    'Iron Maiden': 'a theatrical metal act with mascots, galloping riffs, and dramatic fantasy-war imagery',
    'AC/DC': 'a hard-rock band with schoolboy-uniform cheek, duckwalk energy, and giant guitar-riff swagger',
    "Guns N' Roses": 'a sleazy glam-hard-rock group with bandanas, leather, and wild Sunset Strip excess',
    'The Ramones': 'a leather-jacket punk quartet with bowl-cut simplicity, fast chords, and comic-book toughness',
    'Green Day': 'a bratty pop-punk trio with dyed hair, skate-kid energy, and sarcastic suburban rebellion',
    'The Cure': 'a gothic new-wave act with teased black hair, smeared eyeliner, and moody romantic melancholy',
    'Depeche Mode': 'a sleek synth-pop group in dark tailored styling with brooding electronic cool',
    'ABBA': 'a glittery Scandinavian pop quartet with bright harmonies, satin stagewear, and disco brightness',
    'Bee Gees': 'a falsetto disco-pop trio with chest hair, white suits, and dance-floor shimmer',
    'Daft Punk': 'a robot-helmet electronic duo with sleek chrome anonymity and neon club energy',
    'Kraftwerk': 'a minimalist electronic group with matching outfits, precision geometry, and deadpan machine cool',
    'Tupac Shakur': 'a fiery 1990s West Coast rap icon with bandana cues, intense gaze, and revolutionary swagger',
    'The Notorious B.I.G.': 'a larger-than-life East Coast rap king with crown motifs, luxury streetwear, and smooth confidence',
    'Kendrick Lamar': 'a cerebral modern rap poet with understated streetwear and intense, focused stage presence',
    'J. Cole': 'a thoughtful rap storyteller with hoodie-and-dreadlock cues and grounded introspective energy',
    'Dr. Dre': 'a legendary hip-hop producer archetype with studio authority, black streetwear, and West Coast polish',
    'Snoop Dogg': 'a lanky laid-back rap icon with braids, smooth attitude, and lowrider-party cool',
    'Jay-Z': 'a mogul rapper in luxury minimalist tailoring with cool confidence and empire-builder presence',
    'Kanye West': 'a polarizing fashion-minded rap auteur in oversized silhouettes and stark performance minimalism',
    'Britney Spears': 'a millennial pop princess with glossy dance-pop styling and high-energy teen-idol spectacle',
    'Christina Aguilera': 'a powerhouse pop vocalist with glamorous stage styling and diva-level vocal bravado',
    'Billie Eilish': 'a whisper-pop anti-pop star in oversized streetwear with eerie cool and neon-green edge',
    'Lorde': 'an art-pop outsider with dark curls, moody minimalism, and witchy cool',
    'Ed Sheeran': 'a ginger acoustic pop troubadour with loop-pedal busker energy and casual stadium charm',
    'Shawn Mendes': 'a polished young pop heartthrob with clean-cut guitar-pop styling and soft-rock charm',
    'Justin Bieber': 'a tattooed modern pop idol with streetwear polish and tabloid-bred celebrity aura',
    'Harry Styles': 'a flamboyant retro-pop heartthrob with feathered fashion, satin shirts, and charming stage confidence',
    'Whitney Houston': 'a glamorous vocal powerhouse with radiant stage presence and soaring pop-soul elegance',
    'Mariah Carey': 'a melismatic diva with festive glam, luxurious styling, and superstar sparkle',
    'Celine Dion': 'a grand theatrical ballad singer with elegant couture and powerhouse Vegas polish',
    'Barbra Streisand': 'a classic showbiz legend with dramatic profile, old-school glamour, and torch-song poise',
    'Frank Sinatra': 'a tuxedoed lounge crooner with fedora cues, whiskey-bar cool, and Rat Pack polish',
    'Dean Martin': 'a smooth martini-era entertainer with relaxed tuxedo swagger and easy lounge charm',
    'Aretha Franklin': 'a soul queen in regal stagewear with church-to-stage power and commanding vocal aura',
    'Tina Turner': 'a lion-maned rock-soul dynamo with fierce legs-forward stage energy and unstoppable motion',
    'The Beach Boys': 'a sunlit harmony group with striped shirts, surf cues, and California nostalgia',
    'The Backstreet Boys': 'a coordinated late-1990s boy band with frosted-pop glamour and synchronized poses',
    'Oasis': 'a swaggering Britpop brother band in parkas with sneering Manchester guitar cool',
    'Blur': 'an arty Britpop group with cheeky mod styling and clever London indie energy',
    'Coldplay': 'a polished arena-pop band with heartfelt uplift, colorful stage visuals, and earnest anthemic mood',
    'U2': 'a stadium-rock quartet with activist grandeur, windblown hero poses, and giant-anthem intensity',
    'Radiohead': 'an anxious art-rock band with glitchy mood, introspective tension, and cerebral melancholy',
    'Muse': 'a bombastic sci-fi rock trio with dramatic lighting, dystopian flair, and operatic intensity',
    'Red Hot Chili Peppers': 'a funk-rock band with shirtless chaos, slap-bass energy, and sunburnt California weirdness',
    'Foo Fighters': 'a friendly hard-rock band with bearded frontman energy and straightforward arena uplift',
    'Pink Floyd': 'a psychedelic prog-rock act with prism-like light, cosmic mood, and expansive sonic dreaminess',
    'Led Zeppelin': 'a mythic hard-rock band with wizardly hair, dragonish grandeur, and thunder god energy',
    'Linkin Park': 'a rap-rock band with spiky hair, urban angst, and turn-of-the-millennium emotional intensity',
    'Limp Bizkit': 'a bratty nu-metal act with baseball-cap swagger, baggy streetwear, and mosh-pit chaos',
    'The White Stripes': 'a red-white-black garage-rock duo with minimal props and sharp striped visual identity',
    'The Black Keys': 'a bluesy garage-rock duo with beard-and-drum simplicity and analog grit',
    'Kiss': 'a theatrical shock-rock band with face paint, platform boots, and comic-book pyrotechnic excess',
    'Twisted Sister': 'a glam-metal band with huge hair, clownish makeup, and rebellious cartoon aggression',
    'Janet Jackson': 'a sleek dance-pop icon with military-chic performance styling and cool choreographic precision',
    'Paula Abdul': 'a cheerful dance-pop performer with choreographer energy and bright 1990s TV-ready polish',
    'Cher': 'a legendary diva with endless reinvention, dramatic hair, and glamorous stage-camp presence',
    'Cyndi Lauper': 'a colorful new-wave pop eccentric with mismatched fashion, playful attitude, and quirky charm',
    'The Weeknd': 'a dark sleek pop-R&B antihero with red-suit nightlife mood and noir decadence',
    'Drake': 'a luxury rap-pop superstar with moody introspection, beard, and understated designer cool',
    'Bad Bunny': 'a flamboyant Latin trap superstar with bold shades, wrestling flair, and playful fashion chaos',
    'J Balvin': 'a neon-colored reggaeton star with streetwear polish and hyper-saturated urban-pop energy',
    'Selena Quintanilla': 'a sparkling Tejano-pop star with stage charisma, purple glamour, and warm crossover shine',
    'Shakira': 'a global pop star with wild curls, belly-dance motion, and Latin-rock performance energy',
    'BTS': 'a polished global boy band with coordinated fashion, bright hair, and hyper-stylized performance precision',
    'NSYNC': 'a glossy late-1990s boy band with synchronized poses, frosted fashion, and teen-mag charisma',
    'The Spice Girls': 'a playful five-member pop group with contrasting fashion personas and cheeky girl-power energy',
    "Destiny's Child": 'a glamorous R&B trio in coordinated stagewear with confident diva synchronization',
  },
  screen: {
    'Citizen Kane': 'a grand old-Hollywood media-emperor tableau with looming mansion scale, snow-globe symbolism, and deep-focus dramatic power',
    'Sunset Boulevard': 'a decaying silent-era glamour image with theatrical diva stare, mansion noir, and fatal Hollywood decadence',
    'Casablanca': 'a wartime romance tableau with trench coats, foggy runway mood, and bittersweet black-and-white longing',
    'Titanic': 'a sweeping doomed-romance image with ocean-liner grandeur, formalwear embrace, and icy catastrophe beneath luxury',
    'The Godfather': 'a shadowy old-world crime-family image with tuxedoed power, roses, and patriarchal menace',
    'Goodfellas': 'a sharp mob-life image with suits, bars, cash, and fast-talking streetwise swagger',
    '2001: A Space Odyssey': 'a monumental cosmic image with astronaut minimalism, glowing monolith-like shape, and cold evolutionary awe',
    'Blade Runner': 'a rain-soaked neon-future city image with noir detective silhouette, glowing signage, and synthetic-human melancholy',
    'Vertigo': 'a dizzy romantic-thriller image with spirals, rooftops, and obsessive dreamlike unease',
    'Rear Window': 'a voyeuristic apartment-courtyard image framed from a single window with binocular suspense and urban intrigue',
    'Psycho': 'a stark shower-curtain horror image with motel isolation, knife-shadow menace, and black-and-white shock',
    'The Shining': 'a haunted-hotel image with winter isolation, geometric carpet dread, and manic stare energy',
    "Singin' in the Rain": 'a joyous golden-age musical image with umbrella dancing, streetlamp charm, and rain-soaked theatrical delight',
    'The Wizard of Oz': 'a fantastical technicolor journey image with yellow-road energy, whimsical companions, and emerald dreamland wonder',
    'Lawrence of Arabia': 'an epic desert image with flowing robes, endless dunes, and heroic horizon-scale grandeur',
    'Seven Samurai': 'a windswept warrior ensemble image with rain, armor, muddy village defense, and stoic heroic sacrifice',
    'Chinatown': 'a smoky neo-noir image with fedora, corruption, sun-bleached Los Angeles dread, and tangled conspiracy mood',
    'No Country for Old Men': 'a stark desert-crime image with cattle-gun menace, empty highways, and fatalistic modern-western tension',
    'Taxi Driver': 'a neon-soaked urban-loneliness image with mohawk menace, yellow cab grime, and alienated vigilante energy',
    'Jaws': 'a seaside panic image with huge lurking shark, swimmers above, and classic summer-terror composition',
    'Alien': 'a claustrophobic spaceship-horror image with industrial corridors, egg-like menace, and sleek nightmare creature tension',
    'Pulp Fiction': 'a cool crime-collage image with diner guns, retro suits, pulp-paperback attitude, and ironic pop swagger',
    'Fargo': 'a snowbound crime image with dark tiny figures, red-on-white violence, and deadpan Midwestern absurdity',
    'The Shawshank Redemption': 'a prison-hope image with rain-soaked liberation pose, stone walls, and endurance-against-despair feeling',
    "One Flew Over the Cuckoo's Nest": 'a rebellious institutional-drama image with hospital whites, wild anti-authority grin, and trapped-group tension',
    "Schindler's List": 'a historical black-and-white image with moral urgency, wartime oppression, and one vivid symbolic accent',
    'Raging Bull': 'a monochrome boxing image with sweat spray, ring ropes, and self-destruction in violent slow motion',
    'Apocalypse Now': 'a hallucinatory war image with jungle-fire skies, river-mission dread, and fever-dream military chaos',
    'The Silence of the Lambs': 'a psychological-thriller image with moth motif, prison-glass stare, and elegant serial-killer menace',
    'Raiders of the Lost Ark': 'a dusty pulp-adventure image with fedora, whip, relics, and tomb-raiding action-serial charm',
    'Star Wars': 'a mythic space-opera image with laser swords, masked tyrant, rebel heroism, and starship battle drama',
    'The Graduate': 'a satirical coming-of-age image with awkward young man, older-seduction glamour, and suburban ennui',
    'Eternal Sunshine of the Spotless Mind': 'a fragmented romance-memory image with icy landscapes, handwritten intimacy, and surreal heartache',
    'Do the Right Thing': 'a hot-city street image with saturated summer color, neighborhood tension, and urgent communal energy',
    'The Matrix': 'a black-leather cyber-rebellion image with code rain, shades, and reality-bending gunfight cool',
    'Back to the Future': 'a time-travel adventure image with lightning, puffy vest, and gull-wing-car urgency',
    'Fight Club': 'a grimy anti-consumerism image with bruised faces, soap iconography, and anarchic basement-night violence',
    'The Social Network': 'a cold digital-ambition image with laptop glow, elite-campus isolation, and ruthless modern success energy',
    "E.T. the Extra-Terrestrial": 'a moonlit suburban-fantasy image with child-and-alien friendship, bicycle flight wonder, and gentle cosmic magic',
    'Dr. Strangelove': 'a satirical war-room image with bomb-riding absurdity, black-comedy paranoia, and Cold War apocalypse',
    'Parasite': 'a class-thriller image with sleek modern house lines, hidden spaces, and darkly comic infiltration tension',
    'Moonlight': 'a lyrical coming-of-age image with blue-night color, ocean memory, and intimate identity-search tenderness',
    "Pan's Labyrinth": 'a dark fairy-tale image with labyrinth roots, moonlit innocence, and monstrous wartime fantasy',
    'The Truman Show': 'a bright false-utopia image with stage-managed suburbia, giant spotlight truth, and smiling existential dread',
    'The Big Lebowski': 'a shaggy noir-comedy image with bathrobe slacker cool, bowling motifs, and stoned Los Angeles absurdity',
    'Spirited Away': 'a magical bathhouse-fantasy image with brave child silhouette, spirit creatures, and glowing lantern wonder',
    'Amadeus': 'a candlelit period-music image with powdered wigs, theatrical genius, and gleeful envy in gilded halls',
    'City Lights': 'a silent-era romantic image with tramp charm, flower-girl tenderness, and luminous city-night sentiment',
    'There Will Be Blood': 'a ruthless oil-boom image with black-gold wealth, plainview menace, and scorched frontier obsession',
    'Groundhog Day': 'a whimsical time-loop small-town image with clock motifs, repeated snowfall, and comic existential frustration'
  },
};

function buildFallbackPromptForSubject(pack, subject, options, compositionMode) {
  const safeBriefs = SAFE_SUBJECT_BRIEFS[pack.categoryId] || {};
  const brief = String(safeBriefs[subject] || '').trim();
  if (!brief) return '';
  if (pack.categoryId === 'music') {
    return [
      'Create a single square original spoof album-cover image built from a transformed pop-or-rock album concept.',
      `Subject brief: ${brief}.`,
      `Composition mode: ${compositionMode}.`,
      `Style direction: ${options.styleNotes}.`,
      'Make it feel playful, iconic, and music-quiz readable while staying generic enough to avoid recreating any exact album cover or exact identifiable portrait.',
      'Render face shape, hairstyle, costume, symbolic props, and color story with enough crisp detail to read clearly at 800x800 without becoming an exact likeness or direct cover match.',
      'Use only broad era cues, wardrobe shapes, props, silhouette, and exaggerated caricature energy.',
      'Do not include names, readable text, logos, exact facial resemblance, or an exact album-cover recreation.',
    ].join(' ');
  }
  return [
    'Create a single square original spoof movie-poster image built from transformed film archetypes.',
    `Subject brief: ${brief}.`,
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Make it readable as a playful spoof for a quiz image while staying generic enough to avoid depicting exact copyrighted characters or a recreated film poster.',
    'Render face shape, hair, costume, props, and setting clues with enough crisp detail to read clearly at 800x800 without becoming an exact character design or direct poster match.',
    'Use broad costume language, props, setting hints, and silhouette only.',
    'Do not include names, readable title text, logos, or any exact character design.',
  ].join(' ');
}

function buildUltraSafePromptForSubject(pack, subject, options, compositionMode) {
  const safeBriefs = SAFE_SUBJECT_BRIEFS[pack.categoryId] || {};
  const brief = String(safeBriefs[subject] || '').trim();
  if (pack.categoryId === 'music') {
    return [
      'Create a single square original spoof album-cover graphic built from symbolic pop-or-rock concept cues only.',
      brief ? `Subject brief: ${brief}.` : 'Use a generic pop-or-rock album concept with transformed symbolic cues only.',
      `Composition mode: ${compositionMode}.`,
      `Style direction: ${options.styleNotes}.`,
      'Prefer anonymous transformed figures, cropped body language, silhouettes, props, wardrobe fragments, and iconic color-story cues over any direct portrait.',
      'Make it quiz-readable and detailed at 800x800 while avoiding any exact real person, exact album layout, readable text, or trademark-like design.',
      'No names, no album titles, no logos, no readable typography, and no exact facial resemblance.',
    ].join(' ');
  }
  return [
    'Create a single square original spoof movie-poster graphic built from symbolic film concept cues only.',
    brief ? `Subject brief: ${brief}.` : 'Use a generic film-poster concept with transformed symbolic cues only.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Prefer anonymous transformed figures, silhouettes, props, environments, and lighting mood over any exact character depiction.',
    'Make it quiz-readable and detailed at 800x800 while avoiding any exact copyrighted character, exact poster layout, readable text, or trademark-like design.',
    'No names, no film titles, no logos, no readable typography, and no exact character likeness.',
  ].join(' ');
}

function isModerationBlock(error) {
  const message = String(error && error.message ? error.message : error || '');
  return (
    message.includes('moderation_blocked')
    || message.includes('safety system')
    || message.includes('image_generation_user_error')
  );
}

function pickCompositionMode(pack, index) {
  const list = Array.isArray(pack.compositionModes) ? pack.compositionModes : [];
  if (!list.length) return 'a clean caricature poster layout';
  return list[index % list.length];
}

function parseMusicAlbumSubject(subject) {
  const separator = ' - ';
  const index = String(subject || '').indexOf(separator);
  if (index <= 0) {
    return { artist: String(subject || '').trim(), album: '' };
  }
  return {
    artist: String(subject || '').slice(0, index).trim(),
    album: String(subject || '').slice(index + separator.length).trim(),
  };
}

function buildMusicPrompt(subject, options, compositionMode) {
  const { artist, album } = parseMusicAlbumSubject(subject);
  const namedReference = album
    ? `the pop or rock album cover "${album}" by ${artist}`
    : `the pop or rock album cover associated with ${artist}`;
  return [
    `Create a single square original spoof album cover inspired by ${namedReference}.`,
    'Make it recognisable to a music-trivia player through transformed cover-era styling, silhouette, wardrobe, props, color story, and iconic album-cover energy rather than a direct recreation.',
    'Show one central transformed performer, a compact transformed group, or one highly iconic symbolic setup, depending on what best suits the album being spoofed.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Push the humour, caricature, pose, and visual motif choices so it feels like a satirical spoof cover, not a clone.',
    'Render face shape, hair, costume, props, and expression with enough crisp detail that the features are easy to read at 800x800 and still recognizable in a quiz.',
    'Keep the composition bold, clean, and instantly legible at thumbnail size for a party-game picture round.',
    'Do not include album titles, artist names, readable text, logos, wordmarks, watermarks, exact cover layouts, or exact face matching.',
  ].join(' ');
}

function buildScreenPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original spoof movie poster inspired by the film "${subject}".`,
    'Make it recognisable through transformed archetypes, costume cues, props, setting hints, and silhouette, while clearly avoiding a direct still, poster recreation, or exact character copy.',
    'Show one to three transformed archetypal characters, or one iconic central figure with strong supporting props, depending on what best suits the film being spoofed.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Lean into comic exaggeration, caricature proportions, and playful parody energy so it reads as a fresh spoof rather than a replica.',
    'Render face shape, hair, costume, props, and setting clues with enough crisp detail that the features are easy to read at 800x800.',
    'Keep the image bold, high-contrast, and instantly legible in a picture round.',
    'Do not include title text, readable tag lines, logos, studio marks, watermarks, copyrighted typography, exact costume duplication, or anything other than a spoof movie-poster composition.',
  ].join(' ');
}

function buildPromptForSubject(pack, subject, options, compositionMode) {
  if (pack.categoryId === 'music') return buildMusicPrompt(subject, options, compositionMode);
  return buildScreenPrompt(subject, options, compositionMode);
}

function buildPackManifest(pack, entries) {
  return {
    id: pack.packId,
    version: 1,
    label: pack.label,
    category: 'picture',
    releaseChannel: 'dlc',
    enabled: true,
    basePath: `/assets/graphic-packs/picture/${pack.packId}/images`,
    entries: entries.map((entry, index) => ({
      entryId: entry.entryId,
      groupId: pack.groupId,
      groupName: pack.groupName,
      hint: `${pack.promptHint} ${index + 1}`,
      main: entry.main,
      imposter: entry.imposter,
      mainMediaFile: `${entry.entryId}-main.png`,
      imposterMediaFile: `${entry.entryId}-imposter.png`,
      previewLabel: pack.previewLabel,
    })),
  };
}

function buildPromptPlan(pack, options) {
  const selectedEntries = options.limit > 0
    ? pack.entries.slice(0, options.limit)
    : pack.entries.slice();
  const manifest = buildPackManifest(pack, selectedEntries);
  const promptRecords = [];
  const useSafePrimary = options.provider === 'openai';

  selectedEntries.forEach((entry) => {
    const compositionMode = pickCompositionMode(pack, promptRecords.length);
    const mainNamedPrompt = buildPromptForSubject(pack, entry.main, options, compositionMode);
    const mainSafePrompt = buildFallbackPromptForSubject(pack, entry.main, options, compositionMode);
    const mainUltraSafePrompt = buildUltraSafePromptForSubject(pack, entry.main, options, compositionMode);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'main',
      subject: entry.main,
      mediaFile: `${entry.entryId}-main.png`,
      compositionMode,
      originalPrompt: mainNamedPrompt,
      prompt: useSafePrimary ? (mainSafePrompt || mainNamedPrompt) : mainNamedPrompt,
      promptStrategy: useSafePrimary
        ? (mainSafePrompt ? 'safe_concept_primary' : 'named_title_primary')
        : 'named_title_primary',
      retryPrompt: useSafePrimary ? (mainUltraSafePrompt || mainSafePrompt || mainNamedPrompt) : (mainSafePrompt || mainUltraSafePrompt || mainNamedPrompt),
      retryPromptStrategy: useSafePrimary
        ? (mainUltraSafePrompt ? 'ultra_safe_symbolic_retry' : 'safe_concept_retry')
        : (mainSafePrompt ? 'safe_concept_retry' : 'ultra_safe_symbolic_retry'),
      finalRetryPrompt: useSafePrimary ? '' : (mainUltraSafePrompt || ''),
      finalRetryPromptStrategy: 'ultra_safe_symbolic_retry',
    });
    const imposterCompositionMode = pickCompositionMode(pack, promptRecords.length);
    const imposterNamedPrompt = buildPromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    const imposterSafePrompt = buildFallbackPromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    const imposterUltraSafePrompt = buildUltraSafePromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'imposter',
      subject: entry.imposter,
      mediaFile: `${entry.entryId}-imposter.png`,
      compositionMode: imposterCompositionMode,
      originalPrompt: imposterNamedPrompt,
      prompt: useSafePrimary ? (imposterSafePrompt || imposterNamedPrompt) : imposterNamedPrompt,
      promptStrategy: useSafePrimary
        ? (imposterSafePrompt ? 'safe_concept_primary' : 'named_title_primary')
        : 'named_title_primary',
      retryPrompt: useSafePrimary ? (imposterUltraSafePrompt || imposterSafePrompt || imposterNamedPrompt) : (imposterSafePrompt || imposterUltraSafePrompt || imposterNamedPrompt),
      retryPromptStrategy: useSafePrimary
        ? (imposterUltraSafePrompt ? 'ultra_safe_symbolic_retry' : 'safe_concept_retry')
        : (imposterSafePrompt ? 'safe_concept_retry' : 'ultra_safe_symbolic_retry'),
      finalRetryPrompt: useSafePrimary ? '' : (imposterUltraSafePrompt || ''),
      finalRetryPromptStrategy: 'ultra_safe_symbolic_retry',
    });
  });

  return {
    pack,
    selectedEntries,
    manifest,
    promptRecords,
  };
}

function buildPackReadme(plan) {
  const { pack, selectedEntries } = plan;
  return [
    `# ${pack.label}`,
    '',
    `Generated by \`scripts/generateParodyPictureRounds.cjs\`.`,
    '',
    `- Pack ID: \`${pack.packId}\``,
    `- Entries prepared: ${selectedEntries.length}`,
    '- Output images live in `images/`.',
    '- Prompt metadata lives in `generation-prompts.json`.',
    '- `manifest.json` matches the picture DLC schema used by the app.',
    '',
    '## Important review note',
    '',
    'This generator is designed to push images toward transformed parody/caricature territory,',
    'but it does not make legal determinations. Review outputs manually before shipping.',
    '',
    '## To install into the live app after review',
    '',
    '1. Copy the finished pack folder into `public/assets/graphic-packs/picture/` if it was generated elsewhere.',
    '2. Run `npm run dlc:lint-picture-manifests`.',
    '3. Run `npm run dlc:sync-picture-manifests`.',
  ].join('\n');
}

async function generateWithOpenAi({ prompt, apiKey, model, size, quality }) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      n: 1,
      background: 'transparent',
      output_format: 'png',
    }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`OpenAI image generation failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageBase64 = (
    payload
    && Array.isArray(payload.data)
    && payload.data[0]
    && payload.data[0].b64_json
  ) || '';
  if (!imageBase64) {
    throw new Error('OpenAI response did not include image data.');
  }
  return Buffer.from(imageBase64, 'base64');
}

async function pollFluxResult(pollingUrl, apiKey) {
  while (true) {
    await sleep(500);
    const response = await fetch(pollingUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-key': apiKey,
      },
    });
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`FLUX polling failed: HTTP ${response.status} ${message}`);
    }
    const payload = await response.json();
    const status = String(payload && payload.status ? payload.status : '').trim();
    if (status === 'Ready') return payload;
    if (status === 'Error' || status === 'Failed') {
      throw new Error(`FLUX image generation failed: ${JSON.stringify(payload)}`);
    }
  }
}

async function generateWithFlux({ prompt, apiKey, model, size }) {
  const { width, height } = validateFluxSize(size);
  const modelId = String(model || 'fal-ai/flux/dev').trim().replace(/^\/+/, '');
  const response = await fetch(`https://fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: { width, height },
      num_images: 1,
      output_format: 'png',
      enable_safety_checker: true,
      sync_mode: false,
    }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`FLUX image generation failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageUrl = String(
    payload
    && Array.isArray(payload.images)
    && payload.images[0]
    && payload.images[0].url
      ? payload.images[0].url
      : ''
  ).trim();
  if (!imageUrl) {
    throw new Error(`FLUX response did not include an image URL: ${JSON.stringify(payload)}`);
  }
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    const message = await imageResponse.text().catch(() => '');
    throw new Error(`FLUX image download failed: HTTP ${imageResponse.status} ${message}`);
  }
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateImageWithProvider({ provider, prompt, apiKey, model, size, quality, safetyTolerance }) {
  if (provider === 'flux') {
    return generateWithFlux({ prompt, apiKey, model, size, safetyTolerance });
  }
  return generateWithOpenAi({ prompt, apiKey, model, size, quality });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

async function runPack(plan, options) {
  const packDir = path.join(options.outputRoot, plan.pack.packId);
  const imagesDir = path.join(packDir, 'images');
  const manifestPath = path.join(packDir, 'manifest.json');
  const promptsPath = path.join(packDir, 'generation-prompts.json');
  const readmePath = path.join(packDir, 'README.md');

  console.log(`\n[generateParodyPictureRounds] Pack: ${plan.pack.packId}`);
  console.log(`[generateParodyPictureRounds] Entries: ${plan.selectedEntries.length}`);
  console.log(`[generateParodyPictureRounds] Images planned: ${plan.promptRecords.length}`);

  if (!options.dryRun) {
    ensureDir(packDir);
    ensureDir(imagesDir);
    writeJson(manifestPath, plan.manifest);
    writeJson(promptsPath, {
      packId: plan.pack.packId,
      label: plan.pack.label,
      generatedAt: new Date().toISOString(),
      styleNotes: options.styleNotes,
      promptsOnly: options.promptsOnly,
      entries: plan.promptRecords,
    });
    fs.writeFileSync(readmePath, `${buildPackReadme(plan)}\n`, 'utf8');
  } else {
    console.log(`- PLAN write ${path.relative(repoRoot, manifestPath)}`);
    console.log(`- PLAN write ${path.relative(repoRoot, promptsPath)}`);
  }

  if (options.promptsOnly) {
    console.log('[generateParodyPictureRounds] prompts-only enabled, skipping image provider calls.');
    return;
  }

  let created = 0;
  let skipped = 0;
  let blocked = 0;
  const results = [];
  for (let index = 0; index < plan.promptRecords.length; index += 1) {
    const record = plan.promptRecords[index];
    const outputPath = path.join(imagesDir, record.mediaFile);
    const relOutputPath = path.relative(repoRoot, outputPath);
    const exists = fs.existsSync(outputPath);

    if (exists && !options.overwrite) {
      skipped += 1;
      results.push({ subject: record.subject, side: record.side, mediaFile: record.mediaFile, status: 'skipped' });
      console.log(`- [${index + 1}/${plan.promptRecords.length}] SKIP ${record.subject} (${relOutputPath})`);
      continue;
    }

    if (options.dryRun) {
      results.push({ subject: record.subject, side: record.side, mediaFile: record.mediaFile, status: 'planned' });
      console.log(`- [${index + 1}/${plan.promptRecords.length}] PLAN ${record.subject} -> ${relOutputPath}`);
      continue;
    }

    let imageBuffer = null;
    let usedRetryPrompt = false;
    let usedPromptStrategy = record.promptStrategy || 'unknown';
    try {
      imageBuffer = await generateImageWithProvider({
        provider: options.provider,
        prompt: record.prompt,
        apiKey: options.apiKey,
        model: options.model,
        size: options.size,
        quality: options.quality,
        safetyTolerance: options.safetyTolerance,
      });
    } catch (error) {
      if (!isModerationBlock(error) || !record.retryPrompt || record.retryPrompt === record.prompt) {
        throw error;
      }
      console.warn(`- [${index + 1}/${plan.promptRecords.length}] RETRY ${record.subject} with safer prompt`);
      try {
        imageBuffer = await generateImageWithProvider({
          provider: options.provider,
          prompt: record.retryPrompt,
          apiKey: options.apiKey,
          model: options.model,
          size: options.size,
          quality: options.quality,
          safetyTolerance: options.safetyTolerance,
        });
        usedRetryPrompt = true;
        usedPromptStrategy = record.retryPromptStrategy || 'retry_prompt';
      } catch (fallbackError) {
        if (
          isModerationBlock(fallbackError)
          && record.finalRetryPrompt
          && record.finalRetryPrompt !== record.retryPrompt
          && record.finalRetryPrompt !== record.prompt
        ) {
          console.warn(`- [${index + 1}/${plan.promptRecords.length}] FINAL RETRY ${record.subject} with ultra-safe symbolic prompt`);
          try {
            imageBuffer = await generateImageWithProvider({
              provider: options.provider,
              prompt: record.finalRetryPrompt,
              apiKey: options.apiKey,
              model: options.model,
              size: options.size,
              quality: options.quality,
              safetyTolerance: options.safetyTolerance,
            });
            usedRetryPrompt = true;
            usedPromptStrategy = record.finalRetryPromptStrategy || 'final_retry_prompt';
            fs.writeFileSync(outputPath, imageBuffer);
            created += 1;
            results.push({
              subject: record.subject,
              side: record.side,
              mediaFile: record.mediaFile,
              status: 'created_with_retry',
              promptStrategy: usedPromptStrategy,
              provider: options.provider,
              model: options.model,
            });
            console.log(`- [${index + 1}/${plan.promptRecords.length}] WROTE ${record.subject} (${relOutputPath}) [retry]`);
            if (options.delayMs > 0 && index < plan.promptRecords.length - 1) {
              await sleep(options.delayMs);
            }
            continue;
          } catch (finalRetryError) {
            if (!isModerationBlock(finalRetryError)) {
              throw finalRetryError;
            }
            fallbackError = finalRetryError;
            usedPromptStrategy = record.finalRetryPromptStrategy || usedPromptStrategy;
          }
        }
        if (!isModerationBlock(fallbackError)) {
          throw fallbackError;
        }
        blocked += 1;
        results.push({
          subject: record.subject,
          side: record.side,
          mediaFile: record.mediaFile,
          status: 'blocked',
          promptStrategy: usedPromptStrategy,
          provider: options.provider,
          model: options.model,
          reason: String(fallbackError.message || fallbackError),
        });
        console.warn(`- [${index + 1}/${plan.promptRecords.length}] BLOCKED ${record.subject} (${relOutputPath})`);
        continue;
      }
    }

    fs.writeFileSync(outputPath, imageBuffer);
    created += 1;
    results.push({
      subject: record.subject,
      side: record.side,
      mediaFile: record.mediaFile,
      status: usedRetryPrompt ? 'created_with_retry' : 'created',
      promptStrategy: usedPromptStrategy,
      provider: options.provider,
      model: options.model,
    });
    console.log(`- [${index + 1}/${plan.promptRecords.length}] WROTE ${record.subject} (${relOutputPath})${usedRetryPrompt ? ' [retry]' : ''}`);
    if (options.delayMs > 0 && index < plan.promptRecords.length - 1) {
      await sleep(options.delayMs);
    }
  }

  if (!options.dryRun) {
    writeJson(path.join(packDir, 'generation-results.json'), {
      packId: plan.pack.packId,
      generatedAt: new Date().toISOString(),
      provider: options.provider,
      model: options.model,
      created,
      skipped,
      blocked,
      results,
    });
  }

  console.log(`[generateParodyPictureRounds] Pack done. Created: ${created}, Skipped: ${skipped}, Blocked: ${blocked}`);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (!['music', 'screen', 'all'].includes(options.category)) {
    throw new Error(`Unsupported --category "${options.category}". Use music, screen, or all.`);
  }
  if (!['openai', 'flux'].includes(options.provider)) {
    throw new Error(`Unsupported provider "${options.provider}". Use "openai" or "flux".`);
  }
  if (options.limit < 0) {
    throw new Error('--limit must be 0 or greater.');
  }
  if (!options.model) {
    options.model = getDefaultModel(options.provider);
  }
  if (options.provider === 'flux') {
    validateFluxSize(options.size);
    if (!Number.isFinite(options.safetyTolerance) || options.safetyTolerance < 0 || options.safetyTolerance > 6) {
      throw new Error('--safety-tolerance must be an integer between 0 and 6.');
    }
  }

  if (!options.promptsOnly) {
    options.apiKey = resolveApiKey(options.provider, options.apiKey);
    if (!options.apiKey && !options.dryRun) {
      if (options.provider === 'flux') {
        throw new Error('Missing FLUX API key. Use --api-key, FAL_KEY, FAL_API_KEY, FLUX_API_KEY, or scripts/royaltyFreeApiKeys.local.json (falApiKey / fluxApiKey).');
      }
      throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
    }
  }

  const packKeys = options.category === 'all' ? ['music', 'screen'] : [options.category];
  console.log(`[generateParodyPictureRounds] Category: ${options.category}`);
  console.log(`[generateParodyPictureRounds] Provider: ${options.provider}`);
  console.log(`[generateParodyPictureRounds] Model: ${options.model}`);
  console.log(`[generateParodyPictureRounds] Output root: ${path.relative(repoRoot, options.outputRoot) || '.'}`);
  if (options.promptsOnly) console.log('[generateParodyPictureRounds] Prompt export mode enabled.');
  if (options.dryRun) console.log('[generateParodyPictureRounds] Dry run enabled.');
  if (options.limit > 0) console.log(`[generateParodyPictureRounds] Entry limit per pack: ${options.limit}`);

  for (const packKey of packKeys) {
    const pack = PACKS[packKey];
    const plan = buildPromptPlan(pack, options);
    await runPack(plan, options);
  }

  console.log('\n[generateParodyPictureRounds] Completed.');
}

run().catch((error) => {
  console.error(`[generateParodyPictureRounds] ${error.message}`);
  process.exit(1);
});
