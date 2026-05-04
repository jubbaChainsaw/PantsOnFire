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
  { entryId: 'music-01', main: "Sgt. Pepper's Lonely Hearts Club Band - The Beatles", imposter: 'Pet Sounds - The Beach Boys' },
  { entryId: 'music-02', main: 'Pet Sounds - The Beach Boys', imposter: "Sgt. Pepper's Lonely Hearts Club Band - The Beatles" },
  { entryId: 'music-03', main: 'Thriller - Michael Jackson', imposter: 'Purple Rain - Prince' },
  { entryId: 'music-04', main: 'Purple Rain - Prince', imposter: 'Thriller - Michael Jackson' },
  { entryId: 'music-05', main: 'Rumours - Fleetwood Mac', imposter: 'Tapestry - Carole King' },
  { entryId: 'music-06', main: 'Tapestry - Carole King', imposter: 'Blue - Joni Mitchell' },
  { entryId: 'music-07', main: 'Abbey Road - The Beatles', imposter: 'Exile on Main St. - The Rolling Stones' },
  { entryId: 'music-08', main: 'Exile on Main St. - The Rolling Stones', imposter: 'London Calling - The Clash' },
  { entryId: 'music-09', main: 'Born to Run - Bruce Springsteen', imposter: 'Born in the U.S.A. - Bruce Springsteen' },
  { entryId: 'music-10', main: 'Highway 61 Revisited - Bob Dylan', imposter: 'Blood on the Tracks - Bob Dylan' },
  { entryId: 'music-11', main: 'The Dark Side of the Moon - Pink Floyd', imposter: 'Led Zeppelin IV - Led Zeppelin' },
  { entryId: 'music-12', main: 'Led Zeppelin IV - Led Zeppelin', imposter: 'Back in Black - AC/DC' },
  { entryId: 'music-13', main: 'Nevermind - Nirvana', imposter: 'The Bends - Radiohead' },
  { entryId: 'music-14', main: 'OK Computer - Radiohead', imposter: 'Disintegration - The Cure' },
  { entryId: 'music-15', main: "What's Going On - Marvin Gaye", imposter: 'Songs in the Key of Life - Stevie Wonder' },
  { entryId: 'music-16', main: 'Songs in the Key of Life - Stevie Wonder', imposter: "What's Going On - Marvin Gaye" },
  { entryId: 'music-17', main: 'Hounds of Love - Kate Bush', imposter: 'The Kick Inside - Kate Bush' },
  { entryId: 'music-18', main: 'Blue - Joni Mitchell', imposter: 'Tapestry - Carole King' },
  { entryId: 'music-19', main: 'Back in Black - AC/DC', imposter: "Appetite for Destruction - Guns N' Roses" },
  { entryId: 'music-20', main: 'A Night at the Opera - Queen', imposter: 'Goodbye Yellow Brick Road - Elton John' },
  { entryId: 'music-21', main: 'Graceland - Paul Simon', imposter: 'Bridge Over Troubled Water - Simon & Garfunkel' },
  { entryId: 'music-22', main: 'The Joshua Tree - U2', imposter: 'Brothers in Arms - Dire Straits' },
  { entryId: 'music-23', main: 'The Queen Is Dead - The Smiths', imposter: 'The Stone Roses - The Stone Roses' },
  { entryId: 'music-24', main: 'Like a Prayer - Madonna', imposter: 'Faith - George Michael' },
  { entryId: 'music-25', main: 'Born in the U.S.A. - Bruce Springsteen', imposter: 'Born to Run - Bruce Springsteen' },
  { entryId: 'music-26', main: 'Parallel Lines - Blondie', imposter: 'Rio - Duran Duran' },
  { entryId: 'music-27', main: 'The Rise and Fall of Ziggy Stardust and the Spiders from Mars - David Bowie', imposter: 'Hunky Dory - David Bowie' },
  { entryId: 'music-28', main: 'Automatic for the People - R.E.M.', imposter: 'The Bends - Radiohead' },
  { entryId: 'music-29', main: 'Jagged Little Pill - Alanis Morissette', imposter: '21 - Adele' },
  { entryId: 'music-30', main: "Never Mind the Bollocks, Here's the Sex Pistols - Sex Pistols", imposter: 'London Calling - The Clash' },
  { entryId: 'music-31', main: 'The Bends - Radiohead', imposter: 'OK Computer - Radiohead' },
  { entryId: 'music-32', main: 'The Velvet Underground & Nico - The Velvet Underground & Nico', imposter: 'The Stone Roses - The Stone Roses' },
  { entryId: 'music-33', main: 'Blood on the Tracks - Bob Dylan', imposter: 'Highway 61 Revisited - Bob Dylan' },
  { entryId: 'music-34', main: 'Off the Wall - Michael Jackson', imposter: 'Thriller - Michael Jackson' },
  { entryId: 'music-35', main: 'Disintegration - The Cure', imposter: 'The Queen Is Dead - The Smiths' },
  { entryId: 'music-36', main: 'Hunky Dory - David Bowie', imposter: 'The Rise and Fall of Ziggy Stardust and the Spiders from Mars - David Bowie' },
  { entryId: 'music-37', main: 'The Stone Roses - The Stone Roses', imposter: 'The Queen Is Dead - The Smiths' },
  { entryId: 'music-38', main: 'Bridge Over Troubled Water - Simon & Garfunkel', imposter: 'Graceland - Paul Simon' },
  { entryId: 'music-39', main: 'Hotel California - Eagles', imposter: 'Brothers in Arms - Dire Straits' },
  { entryId: 'music-40', main: 'Goodbye Yellow Brick Road - Elton John', imposter: 'A Night at the Opera - Queen' },
  { entryId: 'music-41', main: "Appetite for Destruction - Guns N' Roses", imposter: 'Back in Black - AC/DC' },
  { entryId: 'music-42', main: 'Back to Black - Amy Winehouse', imposter: '21 - Adele' },
  { entryId: 'music-43', main: 'Synchronicity - The Police', imposter: 'Rio - Duran Duran' },
  { entryId: 'music-44', main: 'Brothers in Arms - Dire Straits', imposter: 'The Joshua Tree - U2' },
  { entryId: 'music-45', main: 'Rio - Duran Duran', imposter: 'Parallel Lines - Blondie' },
  { entryId: 'music-46', main: 'The Kick Inside - Kate Bush', imposter: 'Hounds of Love - Kate Bush' },
  { entryId: 'music-47', main: '21 - Adele', imposter: 'Jagged Little Pill - Alanis Morissette' },
  { entryId: 'music-48', main: 'Faith - George Michael', imposter: 'Like a Prayer - Madonna' },
  { entryId: 'music-49', main: 'The Stranger - Billy Joel', imposter: 'Tapestry - Carole King' },
  { entryId: 'music-50', main: 'London Calling - The Clash', imposter: "Never Mind the Bollocks, Here's the Sex Pistols - Sex Pistols" },
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
  console.log('  --provider <openai>             Image provider (default: openai)');
  console.log('  --api-key <key>                 OpenAI API key (or OPENAI_API_KEY)');
  console.log('  --model <name>                  OpenAI model (default: gpt-image-1)');
  console.log('  --size <WxH>                    Image size (default: 800x800)');
  console.log('  --quality <low|medium|high>     Image quality (default: high)');
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
    size: '800x800',
    quality: 'high',
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
    "Sgt. Pepper's Lonely Hearts Club Band - The Beatles": 'a flamboyant psychedelic brass-band tableau with colorful military-style outfits, moustaches, and surreal crowd-pageant energy',
    'Pet Sounds - The Beach Boys': 'a sun-bleached 1960s pop scene with striped casualwear, animal-petting-zoo whimsy, and warm California harmony vibes',
    'Thriller - Michael Jackson': 'a sleek pop-horror nightlife image with red-jacket swagger, cinematic spotlighting, and eerie dance-floor tension',
    'Purple Rain - Prince': 'a purple-soaked romantic rock tableau with ornate stagewear, motorcycle glamour, and moody neon rainfall',
    'Rumours - Fleetwood Mac': 'a bohemian 1970s duo portrait with shawls, top hat flair, mystical poses, and soft sepia stage mystique',
    'Tapestry - Carole King': 'a warm singer-songwriter interior with curly hair, window light, domestic coziness, and quiet piano-era intimacy',
    'Blue - Joni Mitchell': 'a melancholy close-up singer-songwriter portrait with blue-toned mood, introspective gaze, and sparse confessional elegance',
    'Abbey Road - The Beatles': 'a stylized street-crossing scene with four transformed rock figures in distinct outfits and crisp graphic road symmetry',
    'Exile on Main St. - The Rolling Stones': 'a gritty collage of ragged rock-star faces, circus-like fragments, and black-and-white outlaw glamour',
    'Born to Run - Bruce Springsteen': 'a denim-and-leather heartland-rock duo pose with guitar, urban romance, and youthful street-corner swagger',
    'Born in the U.S.A. - Bruce Springsteen': 'a patriotic stadium-rock image with denim, workwear toughness, and red-white-blue arena bravado',
    'Highway 61 Revisited - Bob Dylan': 'a cool 1960s folk-rock portrait with tousled hair, mod tailoring, and cryptic roadside attitude',
    'Blood on the Tracks - Bob Dylan': 'a wistful painterly breakup-era portrait with autumn color, lonely silhouette, and folk-poet melancholy',
    'The Dark Side of the Moon - Pink Floyd': 'a minimalist prism-like visual with spectral light, deep black space, and cosmic progressive-rock mystery',
    'Led Zeppelin IV - Led Zeppelin': 'an old-world rustic image with weathered figure, heavy symbolic mood, and mythic hard-rock gravitas',
    'Nevermind - Nirvana': 'a confrontational grunge-pop scene built around a surreal underwater-money chase motif and raw 1990s irony',
    'OK Computer - Radiohead': 'a glitchy cold-tech collage with alienated modern-city visuals, digital white-blue noise, and anxious future shock',
    "What's Going On - Marvin Gaye": 'a soulful rain-speckled portrait with trench-coat elegance, compassionate gaze, and urban social-conscience mood',
    'Songs in the Key of Life - Stevie Wonder': 'a radiant colorful soul-funk portrait with circular sunburst design, joyful motion, and spiritual optimism',
    'Hounds of Love - Kate Bush': 'a dreamy storybook portrait with flowing red hair, theatrical romanticism, and soft fantasy-night atmosphere',
    'Back in Black - AC/DC': 'a stark black-on-black hard-rock statement with aggressive simplicity, thunderous attitude, and funeral-to-party energy',
    'A Night at the Opera - Queen': 'a regal theatrical crest-based design with ornate symmetry, dramatic color, and flamboyant rock-opera grandeur',
    'Graceland - Paul Simon': 'a warm worldly singer-songwriter tableau with folk-pop craft, travel-poster color, and eclectic rhythmic texture',
    'Bridge Over Troubled Water - Simon & Garfunkel': 'a windswept duo portrait with soft focus, turtleneck earnestness, and reflective folk-pop melancholy',
    'The Joshua Tree - U2': 'a stark desert-band silhouette with monochrome atmosphere, open horizon, and spiritual arena-rock yearning',
    'The Queen Is Dead - The Smiths': 'a melancholic art-pop image with vintage cinema glamour, deadpan wit, and moody romantic pallor',
    'Like a Prayer - Madonna': 'a provocative devotional pop tableau with candlelit glamour, Catholic iconography echoes, and bold crimson-gold drama',
    'Parallel Lines - Blondie': 'a chic new-wave band lineup in monochrome fashion with one standout pop-star contrast and sleek graphic styling',
    'Rio - Duran Duran': 'a glossy tropical new-romantic image with yacht-club fashion, pastel glamour, and art-deco pop escapism',
    'The Rise and Fall of Ziggy Stardust and the Spiders from Mars - David Bowie': 'a glam-alien street tableau with vivid hair, sci-fi signage mood, and theatrical outsider charisma',
    'Automatic for the People - R.E.M.': 'a wistful Americana image with faded carnival-star symbolism, muted color, and reflective adult-alternative mood',
    'Jagged Little Pill - Alanis Morissette': 'a fiery 1990s alt-pop portrait with saturated color, emotional intensity, and youthful confessional edge',
    "Never Mind the Bollocks, Here's the Sex Pistols - Sex Pistols": 'a loud ransom-note punk graphic with acidic color, sneering attitude, and DIY anti-design chaos',
    'The Bends - Radiohead': 'a eerie hospital-tech image with plasticized expression, anxious humanity, and late-1990s alt-rock disquiet',
    'The Velvet Underground & Nico - The Velvet Underground & Nico': 'a minimalist pop-art fruit icon with avant-garde cool, clean space, and downtown art-scene provocation',
    'Off the Wall - Michael Jackson': 'a glossy tuxedoed disco-pop portrait with brick-wall glamour, youthful grin, and post-disco sparkle',
    'Disintegration - The Cure': 'a blurred gothic dream portrait with smeared color, teased hair mood, and romantic end-of-the-world melancholy',
    'Hunky Dory - David Bowie': 'a glamorous soft-focus portrait with artful hand pose, golden retro makeup, and androgynous pop elegance',
    'The Stone Roses - The Stone Roses': 'a paint-splattered indie-psych collage with Jackson-pollock-like texture, lemon motifs, and baggy-guitar cool',
    'Hotel California - Eagles': 'a dusky luxury-hotel scene with sunset decadence, palm silhouettes, and West Coast melancholy glamour',
    "Appetite for Destruction - Guns N' Roses": 'a dangerous tattoo-flash hard-rock image with skulls, pistols, roses, and sleazy Sunset Strip menace',
    'Back to Black - Amy Winehouse': 'a smoky retro-soul portrait with beehive hair, monochrome elegance, and heartbreak-club atmosphere',
    'Synchronicity - The Police': 'a fragmented colorful grid image with sharp new-wave geometry, trio tension, and angular pop intelligence',
    'Brothers in Arms - Dire Straits': 'a clean sky-backed guitar emblem image with reflective steel-string heroism and polished adult-rock calm',
    'The Kick Inside - Kate Bush': 'a whimsical literary-dance portrait with theatrical movement, youthful mystery, and ethereal red-gold fantasy',
    '21 - Adele': 'a dramatic monochrome soul-pop portrait with side-lit expression, emotional gravity, and classic modern elegance',
    'Faith - George Michael': 'a black-leather pop icon portrait with stubble, jukebox cool, and confident late-1980s minimalism',
    'The Stranger - Billy Joel': 'a moody piano-songwriter scene with suit jacket, Venetian-mask symbolism, and noir barroom introspection',
    'Goodbye Yellow Brick Road - Elton John': 'a fantastical rainbow-road departure scene with glittering stagewear and theatrical dream-pop whimsy'
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

function buildMusicPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original spoof album cover inspired by the pop or rock album "${subject}".`,
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
      prompt: mainSafePrompt || mainNamedPrompt,
      promptStrategy: mainSafePrompt ? 'safe_concept_primary' : 'named_title_primary',
      retryPrompt: mainUltraSafePrompt || mainSafePrompt || mainNamedPrompt,
      retryPromptStrategy: mainUltraSafePrompt ? 'ultra_safe_symbolic_retry' : 'safe_concept_retry',
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
      prompt: imposterSafePrompt || imposterNamedPrompt,
      promptStrategy: imposterSafePrompt ? 'safe_concept_primary' : 'named_title_primary',
      retryPrompt: imposterUltraSafePrompt || imposterSafePrompt || imposterNamedPrompt,
      retryPromptStrategy: imposterUltraSafePrompt ? 'ultra_safe_symbolic_retry' : 'safe_concept_retry',
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
    let usedRetryPrompt = false;
    let usedPromptStrategy = record.promptStrategy || 'unknown';
    try {
      imageBuffer = await generateWithOpenAi({
        prompt: record.prompt,
        apiKey: options.apiKey,
        model: options.model,
        size: options.size,
        quality: options.quality,
      });
    } catch (error) {
      if (!isModerationBlock(error) || !record.retryPrompt || record.retryPrompt === record.prompt) {
        throw error;
      }
      console.warn(`- [${index + 1}/${plan.promptRecords.length}] RETRY ${record.subject} with ultra-safe symbolic prompt`);
      try {
        imageBuffer = await generateWithOpenAi({
          prompt: record.retryPrompt,
          apiKey: options.apiKey,
          model: options.model,
          size: options.size,
          quality: options.quality,
        });
        usedRetryPrompt = true;
        usedPromptStrategy = record.retryPromptStrategy || 'retry_prompt';
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
          promptStrategy: usedPromptStrategy,
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
