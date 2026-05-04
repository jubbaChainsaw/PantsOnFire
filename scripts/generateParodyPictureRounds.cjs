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
  'spoof album-cover and movie-poster layout instincts without recreating any exact cover or poster',
  'punk-zine attitude with occasional retro paper-cut collage framing',
  'clean pale or transparent background unless a simple poster backdrop helps readability',
  'punchy cel shading and high contrast',
  'instantly readable central subject or compact ensemble',
].join(', ');

const MUSIC_ENTRIES = [
  { entryId: 'music-01', main: 'The Beatles', imposter: 'The Rolling Stones' },
  { entryId: 'music-02', main: 'Elvis Presley', imposter: 'Johnny Cash' },
  { entryId: 'music-03', main: 'Madonna', imposter: 'Lady Gaga' },
  { entryId: 'music-04', main: 'David Bowie', imposter: 'Prince' },
  { entryId: 'music-05', main: 'Freddie Mercury', imposter: 'Mick Jagger' },
  { entryId: 'music-06', main: 'Taylor Swift', imposter: 'Olivia Rodrigo' },
  { entryId: 'music-07', main: 'Beyonce', imposter: 'Rihanna' },
  { entryId: 'music-08', main: 'Adele', imposter: 'Amy Winehouse' },
  { entryId: 'music-09', main: 'Michael Jackson', imposter: 'Bruno Mars' },
  { entryId: 'music-10', main: 'Elton John', imposter: 'Billy Joel' },
  { entryId: 'music-11', main: 'Bob Dylan', imposter: 'Neil Young' },
  { entryId: 'music-12', main: 'Bruce Springsteen', imposter: 'Tom Petty' },
  { entryId: 'music-13', main: 'Dolly Parton', imposter: 'Shania Twain' },
  { entryId: 'music-14', main: 'The Sex Pistols', imposter: 'The Clash' },
  { entryId: 'music-15', main: 'Nirvana', imposter: 'Pearl Jam' },
  { entryId: 'music-16', main: 'Metallica', imposter: 'Iron Maiden' },
  { entryId: 'music-17', main: "AC/DC", imposter: "Guns N' Roses" },
  { entryId: 'music-18', main: 'The Ramones', imposter: 'Green Day' },
  { entryId: 'music-19', main: 'The Cure', imposter: 'Depeche Mode' },
  { entryId: 'music-20', main: 'ABBA', imposter: 'Bee Gees' },
  { entryId: 'music-21', main: 'Daft Punk', imposter: 'Kraftwerk' },
  { entryId: 'music-22', main: 'Tupac Shakur', imposter: 'The Notorious B.I.G.' },
  { entryId: 'music-23', main: 'Kendrick Lamar', imposter: 'J. Cole' },
  { entryId: 'music-24', main: 'Dr. Dre', imposter: 'Snoop Dogg' },
  { entryId: 'music-25', main: 'Jay-Z', imposter: 'Kanye West' },
  { entryId: 'music-26', main: 'Britney Spears', imposter: 'Christina Aguilera' },
  { entryId: 'music-27', main: 'Billie Eilish', imposter: 'Lorde' },
  { entryId: 'music-28', main: 'Ed Sheeran', imposter: 'Shawn Mendes' },
  { entryId: 'music-29', main: 'Justin Bieber', imposter: 'Harry Styles' },
  { entryId: 'music-30', main: 'Whitney Houston', imposter: 'Mariah Carey' },
  { entryId: 'music-31', main: 'Celine Dion', imposter: 'Barbra Streisand' },
  { entryId: 'music-32', main: 'Frank Sinatra', imposter: 'Dean Martin' },
  { entryId: 'music-33', main: 'Aretha Franklin', imposter: 'Tina Turner' },
  { entryId: 'music-34', main: 'Stevie Wonder', imposter: 'Ray Charles' },
  { entryId: 'music-35', main: 'The Beach Boys', imposter: 'The Backstreet Boys' },
  { entryId: 'music-36', main: 'Oasis', imposter: 'Blur' },
  { entryId: 'music-37', main: 'Coldplay', imposter: 'U2' },
  { entryId: 'music-38', main: 'Radiohead', imposter: 'Muse' },
  { entryId: 'music-39', main: 'Red Hot Chili Peppers', imposter: 'Foo Fighters' },
  { entryId: 'music-40', main: 'Pink Floyd', imposter: 'Led Zeppelin' },
  { entryId: 'music-41', main: 'Linkin Park', imposter: 'Limp Bizkit' },
  { entryId: 'music-42', main: 'The White Stripes', imposter: 'The Black Keys' },
  { entryId: 'music-43', main: 'Kiss', imposter: 'Twisted Sister' },
  { entryId: 'music-44', main: 'Janet Jackson', imposter: 'Paula Abdul' },
  { entryId: 'music-45', main: 'Cher', imposter: 'Cyndi Lauper' },
  { entryId: 'music-46', main: 'The Weeknd', imposter: 'Drake' },
  { entryId: 'music-47', main: 'Bad Bunny', imposter: 'J Balvin' },
  { entryId: 'music-48', main: 'Selena Quintanilla', imposter: 'Shakira' },
  { entryId: 'music-49', main: 'BTS', imposter: 'NSYNC' },
  { entryId: 'music-50', main: 'The Spice Girls', imposter: "Destiny's Child" },
];

const SCREEN_ENTRIES = [
  { entryId: 'screen-01', main: 'Star Wars', imposter: 'Star Trek' },
  { entryId: 'screen-02', main: 'Harry Potter', imposter: 'The Lord of the Rings' },
  { entryId: 'screen-03', main: 'Breaking Bad', imposter: 'Better Call Saul' },
  { entryId: 'screen-04', main: 'The Simpsons', imposter: 'Family Guy' },
  { entryId: 'screen-05', main: 'Friends', imposter: 'Seinfeld' },
  { entryId: 'screen-06', main: 'The Office', imposter: 'Parks and Recreation' },
  { entryId: 'screen-07', main: 'Stranger Things', imposter: 'Dark' },
  { entryId: 'screen-08', main: 'Game of Thrones', imposter: 'House of the Dragon' },
  { entryId: 'screen-09', main: 'Batman', imposter: 'Spider-Man' },
  { entryId: 'screen-10', main: 'Superman', imposter: 'Captain America' },
  { entryId: 'screen-11', main: 'The Matrix', imposter: 'Tron' },
  { entryId: 'screen-12', main: 'Jurassic Park', imposter: 'King Kong' },
  { entryId: 'screen-13', main: 'Ghostbusters', imposter: 'Men in Black' },
  { entryId: 'screen-14', main: 'Rocky', imposter: 'The Karate Kid' },
  { entryId: 'screen-15', main: 'Indiana Jones', imposter: 'National Treasure' },
  { entryId: 'screen-16', main: 'Top Gun', imposter: 'Mission: Impossible' },
  { entryId: 'screen-17', main: 'Pirates of the Caribbean', imposter: 'Hook' },
  { entryId: 'screen-18', main: 'The Godfather', imposter: 'Goodfellas' },
  { entryId: 'screen-19', main: 'Pulp Fiction', imposter: 'Reservoir Dogs' },
  { entryId: 'screen-20', main: 'The Silence of the Lambs', imposter: 'American Psycho' },
  { entryId: 'screen-21', main: 'Back to the Future', imposter: "Bill & Ted's Excellent Adventure" },
  { entryId: 'screen-22', main: 'Alien', imposter: 'Predator' },
  { entryId: 'screen-23', main: 'The Terminator', imposter: 'RoboCop' },
  { entryId: 'screen-24', main: 'Die Hard', imposter: 'Lethal Weapon' },
  { entryId: 'screen-25', main: 'The Addams Family', imposter: 'The Munsters' },
  { entryId: 'screen-26', main: 'South Park', imposter: 'Rick and Morty' },
  { entryId: 'screen-27', main: 'Beavis and Butt-Head', imposter: "Wayne's World" },
  { entryId: 'screen-28', main: 'The X-Files', imposter: 'Fringe' },
  { entryId: 'screen-29', main: 'Doctor Who', imposter: 'Sherlock' },
  { entryId: 'screen-30', main: 'Peaky Blinders', imposter: 'Boardwalk Empire' },
  { entryId: 'screen-31', main: 'The Sopranos', imposter: 'Sons of Anarchy' },
  { entryId: 'screen-32', main: 'Narcos', imposter: 'Scarface' },
  { entryId: 'screen-33', main: 'Avatar', imposter: 'Dune' },
  { entryId: 'screen-34', main: 'Mad Max', imposter: 'Waterworld' },
  { entryId: 'screen-35', main: 'Mean Girls', imposter: 'Clueless' },
  { entryId: 'screen-36', main: 'Barbie', imposter: 'Legally Blonde' },
  { entryId: 'screen-37', main: 'Wednesday', imposter: 'Sabrina the Teenage Witch' },
  { entryId: 'screen-38', main: 'Bridgerton', imposter: 'Pride and Prejudice' },
  { entryId: 'screen-39', main: 'The Walking Dead', imposter: 'The Last of Us' },
  { entryId: 'screen-40', main: 'The Mandalorian', imposter: 'The Witcher' },
  { entryId: 'screen-41', main: 'Shrek', imposter: 'Monsters, Inc.' },
  { entryId: 'screen-42', main: 'Toy Story', imposter: 'Cars' },
  { entryId: 'screen-43', main: 'Frozen', imposter: 'Moana' },
  { entryId: 'screen-44', main: 'The Lion King', imposter: 'Madagascar' },
  { entryId: 'screen-45', main: 'SpongeBob SquarePants', imposter: 'Minions' },
  { entryId: 'screen-46', main: 'Black Mirror', imposter: 'The Twilight Zone' },
  { entryId: 'screen-47', main: 'Jaws', imposter: 'Deep Blue Sea' },
  { entryId: 'screen-48', main: 'Home Alone', imposter: 'Dennis the Menace' },
  { entryId: 'screen-49', main: 'Kill Bill', imposter: "Charlie's Angels" },
  { entryId: 'screen-50', main: 'The Hunger Games', imposter: 'Squid Game' },
];

const MUSIC_COMPOSITION_MODES = [
  'a spoof album-cover portrait with one bold central figure',
  'a fake tour-poster composition with dramatic pose and oversized prop cues',
  'an exaggerated editorial collage portrait with cutout shapes and playful framing',
  'a mock greatest-hits sleeve design built around caricature and silhouette',
];

const SCREEN_COMPOSITION_MODES = [
  'a spoof theatrical poster composition with transformed archetypes',
  'a fake streaming key-art layout with bold central figure placement',
  'an editorial caricature collage inspired by poster art, not a direct poster recreation',
  'a parody one-sheet style image with clean iconic props and simplified background',
];

const PACKS = {
  music: {
    categoryId: 'music',
    packId: 'music-parodies-v1',
    label: 'Music Parody Caricatures v1',
    groupId: 'music-parodies',
    groupName: 'Music Parodies',
    previewLabel: 'Describe the music parody image clearly without naming the exact act.',
    promptHint: 'Picture Prompt • Music Parody',
    entries: MUSIC_ENTRIES,
    compositionModes: MUSIC_COMPOSITION_MODES,
  },
  screen: {
    categoryId: 'screen',
    packId: 'screen-parodies-v1',
    label: 'Film and TV Parody Caricatures v1',
    groupId: 'screen-parodies',
    groupName: 'Film & TV Parodies',
    previewLabel: 'Describe the parody scene clearly without naming the exact title or franchise.',
    promptHint: 'Picture Prompt • Film/TV Parody',
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
  console.log('  --provider <openai>             Image provider (default: openai)');
  console.log('  --api-key <key>                 OpenAI API key (or OPENAI_API_KEY)');
  console.log('  --model <name>                  OpenAI model (default: gpt-image-1)');
  console.log('  --size <WxH>                    Image size (default: 1024x1024)');
  console.log('  --quality <low|medium|high>     Image quality (default: medium)');
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
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
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
  return '';
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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
    'Star Wars': 'a space-opera adventure with laser swords, a masked dark tyrant, scrappy rebels, and desert-to-starship imagery',
    'Star Trek': 'a utopian starship crew in colorful uniforms exploring strange new worlds with sleek sci-fi optimism',
    'Harry Potter': 'a school-of-magic fantasy with round spectacles, house-scarf cues, owls, and wand-casting drama',
    'The Lord of the Rings': 'an epic quest fantasy with cloaked travelers, a glowing ring, mountains, and ancient-medieval grandeur',
    'Breaking Bad': 'a desert crime drama with chemistry-cook imagery, yellow protective gear, and tense moral collapse',
    'Better Call Saul': 'a flashy strip-mall lawyer world with cheap suits, legal ads, and scheming underdog energy',
    'The Simpsons': 'a yellow suburban cartoon family in a goofy small-town living-room setup',
    'Family Guy': 'a cutaway-gag cartoon family with awkward suburban chaos and an irreverent living-room vibe',
    'Friends': 'a cozy coffeehouse ensemble sitcom with city-apartment friendship energy and 1990s casual fashion',
    'Seinfeld': 'a neurotic New York apartment sitcom with stand-up-comedy vibes and observational everyday absurdity',
    'The Office': 'a cringe-comedy mockumentary in a drab paper office with awkward boss energy',
    'Parks and Recreation': 'an optimistic small-town government mockumentary with civic-chaos charm and cheerful bureaucrats',
    'Stranger Things': 'a retro synth-horror adventure with kids on bikes, glowing portals, and small-town monster dread',
    'Dark': 'a moody European time-loop mystery with raincoats, caves, and tangled family timelines',
    'Game of Thrones': 'a grim medieval power struggle with iron-throne vibes, dragons, fur cloaks, and noble intrigue',
    'House of the Dragon': 'a silver-haired dragon-rider dynasty in fiery medieval court politics and regal family conflict',
    'Batman': 'a brooding urban vigilante in bat-like silhouette overlooking a dark crime-ridden city',
    'Spider-Man': 'a quippy wall-crawling hero in red-blue bug-like costume language swinging above a city skyline',
    'Superman': 'a bright primary-colored flying hero with cape, farm-boy nobility, and clean skyward optimism',
    'Captain America': 'a patriotic shield-carrying super-soldier in military-inspired comic-book heroism',
    'The Matrix': 'a black-coated cyberpunk rebellion with dark glasses, code-rain atmosphere, and reality-bending action',
    'Tron': 'a neon digital arena with glowing suits, light-cycle geometry, and computer-grid futurism',
    'Jurassic Park': 'a dinosaur theme-park disaster with jeeps, electric fences, and towering prehistoric predator tension',
    'King Kong': 'a giant ape adventure with skyscraper peril, jungle drama, and beauty-and-beast spectacle',
    'Ghostbusters': 'a paranormal comedy team with jumpsuits, proton-pack-like gear, and city-ghost chaos',
    'Men in Black': 'a secret-agent alien-policing duo in black suits with sleek sci-fi gadgets and deadpan cool',
    'Rocky': 'an underdog boxing drama with grey sweats, worn gloves, and triumphant training montage energy',
    'The Karate Kid': 'a teen martial-arts story with dojo rivalry, crane-kick attitude, and mentor-student wisdom',
    'Indiana Jones': 'a whip-cracking fedora-wearing archaeologist in dusty tomb-raiding adventure mode',
    'National Treasure': 'a modern clue-chasing treasure hunter with maps, lantern light, and historical-puzzle excitement',
    'Top Gun': 'a swaggering fighter-pilot drama with aviators, jets, and sunlit runway cool',
    'Mission: Impossible': 'a high-tech spy-action thriller with dangling heist poses and impossible gadget stunts',
    'Pirates of the Caribbean': 'a chaotic swashbuckling sea adventure with eyeliner, tricorn hats, cursed treasure, and rum-soaked mischief',
    'Hook': 'a whimsical grown-up Peter Pan pirate tale with bright costumes and theatrical family adventure',
    'The Godfather': 'a shadowy old-world crime-family drama with suits, roses, and patriarchal menace',
    'Goodfellas': 'a flashy mob-life story with suits, bars, cash, and fast-talking streetwise energy',
    'Pulp Fiction': 'a cool crime anthology with diner-guns tension, retro suits, and pop-culture swagger',
    'Reservoir Dogs': 'a minimalist heist-gang image with skinny black suits, ties, and warehouse tension',
    'The Silence of the Lambs': 'a psychological thriller with moth imagery, prison-glass tension, and an eerie serial-killer stare',
    'American Psycho': 'a glossy yuppie horror satire with slicked-back hair, luxury business cards, and manic menace',
    'Back to the Future': 'a time-travel comedy adventure with a teen in puffy vest, lightning, and gull-wing car vibes',
    "Bill & Ted's Excellent Adventure": 'a goofy buddy time-travel romp with enthusiastic rock-kid poses and phone-booth absurdity',
    'Alien': 'a claustrophobic sci-fi horror with industrial spaceship corridors and a sleek nightmare creature in the shadows',
    'Predator': 'a jungle action-horror hunt with a camouflaged alien warrior and macho commando tension',
    'The Terminator': 'a relentless killer cyborg with leather, red-eye menace, and urban-apocalypse action',
    'RoboCop': 'a metallic lawman in a dystopian city with corporate satire and armored justice vibes',
    'Die Hard': 'a lone everyman action hero in a skyscraper siege with bare feet, radio banter, and explosive chaos',
    'Lethal Weapon': 'a mismatched buddy-cop action story with rough detectives, guns, and reckless city-chase energy',
    'The Addams Family': 'a gothic comic clan in elegant black costumes, spooky mansion decor, and deadpan family weirdness',
    'The Munsters': 'a goofy suburban monster family in retro TV-horror style with cheerful creature-household charm',
    'South Park': 'a crude snowy-town cartoon with colorful winter hats and outrageous satirical chaos',
    'Rick and Morty': 'a frantic portal-jumping sci-fi cartoon duo with lab-coat chaos and multiverse absurdity',
    'Beavis and Butt-Head': 'two dim grunge-metal teens on a couch with slacker snickering and TV-glow stupidity',
    "Wayne's World": 'a goofy public-access rock-comedy duo with long hair, caps, and basement-party enthusiasm',
    'The X-Files': 'a paranormal-investigation duo with flashlights, FBI-ish coats, and eerie alien-conspiracy mood',
    'Fringe': 'a weird-science investigation team with lab gear, strange phenomena, and blue-toned mystery',
    'Doctor Who': 'a whimsical time-travel adventurer with eccentric coat, impossible gadget, and cosmic British charm',
    'Sherlock': 'a modern detective in long coat and scarf with violin-and-deduction cool in moody London',
    'Peaky Blinders': 'a razor-edged period gang drama with flat caps, long coats, and smoky industrial Birmingham mood',
    'Boardwalk Empire': 'a Prohibition crime saga with suits, fedoras, and seaside corruption in 1920s America',
    'The Sopranos': 'a suburban mob-boss drama with therapist tension, ducks, and heavy New Jersey family menace',
    'Sons of Anarchy': 'an outlaw biker-family drama with leather vests, motorcycles, and dusty brotherhood tension',
    'Narcos': 'a cartel-crime saga with tropical heat, aviator cops, and drug-war intensity',
    'Scarface': 'a flashy rise-and-fall gangster epic with white suit swagger, excess, and cocaine-fueled decadence',
    'Avatar': 'a bioluminescent alien-world adventure with blue jungle tribes, giant trees, and soaring creatures',
    'Dune': 'a desert prophecy epic with sand, veils, giant worms, and austere sci-fi nobility',
    'Mad Max': 'a wasteland road-war apocalypse with spiked vehicles, dust storms, and feral survival energy',
    'Waterworld': 'a soggy post-apocalyptic ocean adventure with improvised sea gear and floating-settlement chaos',
    'Mean Girls': 'a glossy high-school clique comedy with pink fashion codes and cafeteria-power politics',
    'Clueless': 'a sunny Beverly Hills teen-comedy world with plaid fashion, makeover energy, and valley-girl charm',
    'Barbie': 'a hyper-pink toy-dream fantasy with plastic-perfect suburbia and playful self-aware glamour',
    'Legally Blonde': 'a bright pink legal-comedy heroine with fashionable confidence, tiny-dog energy, and campus-to-court ambition',
    'Wednesday': 'a deadpan gothic teen with braids, black school uniform cues, and creepy-academy cool',
    'Sabrina the Teenage Witch': 'a bubbly magical-teen sitcom with sparkly spells, cat familiar energy, and bright suburban fantasy',
    'Bridgerton': 'a pastel Regency romance world with ballroom glamour, gossip scandal, and floral aristocratic excess',
    'Pride and Prejudice': 'a classic Regency courtship world with windswept estates, formal dress, and restrained romantic tension',
    'The Walking Dead': 'a grim zombie-survival ensemble trudging through ruined roads and desperate campfire tension',
    'The Last of Us': 'a fungal-apocalypse road journey with weary guardianship, ruined cities, and tender survival sadness',
    'The Mandalorian': 'a lone armored space bounty hunter with a tiny green companion crossing dusty frontier worlds',
    'The Witcher': 'a white-haired monster hunter with swords, potions, and grim fantasy tavern-road atmosphere',
    'Shrek': 'a swamp-dwelling green ogre fairy-tale comedy with grumpy charm and storybook chaos',
    'Monsters, Inc.': 'a bright cartoon monster workplace with furry giant creature energy and colorful factory comedy',
    'Toy Story': 'a secret-life-of-toys adventure with plastic cowboy-spaceman rivalry and bedroom wonder',
    'Cars': 'a glossy talking-racecar world with highway nostalgia and small-town speedway charm',
    'Frozen': 'an icy musical fairy tale with snow powers, regal sisters, and glittering winter wonderland drama',
    'Moana': 'an ocean-voyage adventure with island heroine energy, giant waves, and mythic Polynesian-inspired spirit',
    'The Lion King': 'a savannah animal-royalty epic with dramatic sunrise cliffs and coming-of-age pride drama',
    'Madagascar': 'a comic zoo-animal escape with wild-eyed critters and tropical island mayhem',
    'SpongeBob SquarePants': 'a zany undersea cartoon world with square yellow fry-cook energy and nautical silliness',
    'Minions': 'a chaotic gaggle of small yellow helpers in goggles causing slapstick trouble',
    'Black Mirror': 'a cold near-future tech dystopia with screens, surveillance, and unsettling digital paranoia',
    'The Twilight Zone': 'a classic eerie anthology with black-and-white uncanny suburbia and cosmic weirdness',
    'Jaws': 'a seaside summer thriller with a giant shark lurking beneath swimmers and poster-like beach panic',
    'Deep Blue Sea': 'a glossy shark-lab action thriller with stormy seas, scientific hubris, and toothy chaos',
    'Home Alone': 'a festive kid-vs-burglars slapstick setup with booby traps, winter house, and shocked expressions',
    'Dennis the Menace': 'a mischievous suburban kid-comedy setup with striped overalls, neighborhood chaos, and exasperated adults',
    'Kill Bill': 'a revenge-action saga with yellow-suited swordfighter energy, stylized violence, and comic-book cool',
    "Charlie's Angels": 'a glamorous action-team setup with spy poses, fashion-forward attitude, and playful crime-fighting energy',
    'The Hunger Games': 'a dystopian survival-competition saga with archer iconography, fiery pageantry, and defiant rebellion',
    'Squid Game': 'a deadly game-show dystopia with numbered tracksuits, masked guards, and geometric neon menace',
  },
};

function buildFallbackPromptForSubject(pack, subject, options, compositionMode) {
  const safeBriefs = SAFE_SUBJECT_BRIEFS[pack.categoryId] || {};
  const brief = String(safeBriefs[subject] || '').trim();
  if (!brief) return '';
  if (pack.categoryId === 'music') {
    return [
      'Create a single square original parody caricature of a transformed music archetype.',
      `Subject brief: ${brief}.`,
      `Composition mode: ${compositionMode}.`,
      `Style direction: ${options.styleNotes}.`,
      'Make it feel playful, iconic, and music-quiz readable while staying generic enough to avoid depicting any exact real person.',
      'Use only broad era cues, wardrobe shapes, props, silhouette, and exaggerated caricature energy.',
      'Do not include names, text, logos, exact facial resemblance, or an album-cover recreation.',
    ].join(' ');
  }
  return [
    'Create a single square original parody poster-style caricature built from transformed fictional archetypes.',
    `Subject brief: ${brief}.`,
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Make it readable as a playful spoof for a quiz image while staying generic enough to avoid depicting exact copyrighted characters or a recreated poster.',
    'Use broad costume language, props, setting hints, and silhouette only.',
    'Do not include names, title text, logos, or any exact character design.',
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

function buildMusicPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original parody caricature inspired by the musician or band "${subject}".`,
    'Make it recognisable to a music-trivia player through transformed visual cues, exaggerated silhouette, performance attitude, hair, wardrobe, props, and stage energy rather than an exact likeness.',
    'If the inspiration is a group, show a compact ensemble of two to four transformed members; if it is a solo act, show one central performer.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Push the humour, facial exaggeration, pose, and costume shapes so it feels like a spoof or satirical caricature, not a clone.',
    'Keep the composition clean and readable at thumbnail size for a party-game picture round.',
    'Do not include band names, song titles, logos, wordmarks, watermarks, album-cover recreations, exact face matching, or direct poster layouts.',
  ].join(' ');
}

function buildScreenPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original parody caricature inspired by the film or TV property "${subject}".`,
    'Make it recognisable through transformed archetypes, costume cues, props, setting hints, and silhouette, while clearly avoiding a direct still, poster recreation, or exact character copy.',
    'If the inspiration is a broad franchise or ensemble, show one to three transformed archetypal characters; if it centers on one icon, focus on a single lead parody figure.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Lean into comic exaggeration, caricature proportions, and playful parody energy so it reads as a fresh spoof rather than a replica.',
    'Keep the image clean, high-contrast, and easy to read in a picture round.',
    'Do not include title text, logos, studio marks, watermarks, copyrighted typography, exact costume duplication, or a recreated poster composition.',
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

  selectedEntries.forEach((entry) => {
    const compositionMode = pickCompositionMode(pack, promptRecords.length);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'main',
      subject: entry.main,
      mediaFile: `${entry.entryId}-main.png`,
      compositionMode,
      prompt: buildPromptForSubject(pack, entry.main, options, compositionMode),
      fallbackPrompt: buildFallbackPromptForSubject(pack, entry.main, options, compositionMode),
    });
    const imposterCompositionMode = pickCompositionMode(pack, promptRecords.length);
    promptRecords.push({
      entryId: entry.entryId,
      side: 'imposter',
      subject: entry.imposter,
      mediaFile: `${entry.entryId}-imposter.png`,
      compositionMode: imposterCompositionMode,
      prompt: buildPromptForSubject(pack, entry.imposter, options, imposterCompositionMode),
      fallbackPrompt: buildFallbackPromptForSubject(pack, entry.imposter, options, imposterCompositionMode),
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
    console.log('[generateParodyPictureRounds] prompts-only enabled, skipping OpenAI image calls.');
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
    let usedFallbackPrompt = false;
    try {
      imageBuffer = await generateWithOpenAi({
        prompt: record.prompt,
        apiKey: options.apiKey,
        model: options.model,
        size: options.size,
        quality: options.quality,
      });
    } catch (error) {
      if (!isModerationBlock(error) || !record.fallbackPrompt) {
        throw error;
      }
      console.warn(`- [${index + 1}/${plan.promptRecords.length}] RETRY ${record.subject} with safer fallback prompt`);
      try {
        imageBuffer = await generateWithOpenAi({
          prompt: record.fallbackPrompt,
          apiKey: options.apiKey,
          model: options.model,
          size: options.size,
          quality: options.quality,
        });
        usedFallbackPrompt = true;
      } catch (fallbackError) {
        if (!isModerationBlock(fallbackError)) {
          throw fallbackError;
        }
        blocked += 1;
        results.push({
          subject: record.subject,
          side: record.side,
          mediaFile: record.mediaFile,
          status: 'blocked',
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
      status: usedFallbackPrompt ? 'created_with_fallback' : 'created',
    });
    console.log(`- [${index + 1}/${plan.promptRecords.length}] WROTE ${record.subject} (${relOutputPath})${usedFallbackPrompt ? ' [fallback]' : ''}`);
    if (options.delayMs > 0 && index < plan.promptRecords.length - 1) {
      await sleep(options.delayMs);
    }
  }

  if (!options.dryRun) {
    writeJson(path.join(packDir, 'generation-results.json'), {
      packId: plan.pack.packId,
      generatedAt: new Date().toISOString(),
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
  if (options.provider !== 'openai') {
    throw new Error(`Unsupported provider "${options.provider}". Currently only "openai" is implemented.`);
  }
  if (options.limit < 0) {
    throw new Error('--limit must be 0 or greater.');
  }

  if (!options.promptsOnly) {
    options.apiKey = resolveApiKey(options.provider, options.apiKey);
    if (!options.apiKey && !options.dryRun) {
      throw new Error('Missing OpenAI API key. Use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
    }
  }

  const packKeys = options.category === 'all' ? ['music', 'screen'] : [options.category];
  console.log(`[generateParodyPictureRounds] Category: ${options.category}`);
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
