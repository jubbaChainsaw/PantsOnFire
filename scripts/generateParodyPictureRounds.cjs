#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');
const defaultOutputRoot = path.join(repoRoot, 'exports', 'parody-picture-rounds');
const DEFAULT_MUSIC_REFERENCE_FEED_URL = 'https://www.besteveralbums.com/feeds/BestEverAlbumsdotCom_OverallChart.xml';
const DEFAULT_STYLE_REFERENCE_URL = 'https://media.craiyon.com/2025-08-06/Kx1Iy3b-RCSGhKhPYW3Aog.webp';
const DEFAULT_MUSIC_STYLE_REFERENCE_URL = 'https://media.craiyon.com/2025-08-06/Kx1Iy3b-RCSGhKhPYW3Aog.webp';
const DEFAULT_ALBUMS_PACK_ID = 'albums-parodies-v1';

const DEFAULT_STYLE_NOTES = [
  'bold comic-caricature linework',
  'warped anatomy and exaggerated silhouettes',
  'editorial collage poster energy',
  'strictly artist-logo-mark or spoof movie-poster composition language without recreating any exact official logo, cover, or poster',
  'punk-zine attitude with occasional retro paper-cut collage framing',
  'rich readable costume, hair, prop, and face-shape detail at 800x800',
  'clean but fully designed poster or cover background that helps recognition',
  'punchy cel shading and high contrast',
  'instantly readable central subject or compact ensemble',
].join(', ');

const ROCK_BAND_ACTS = [
  { name: 'The Beatles', brief: 'a 1960s mop-top quartet with tailored suits, cheeky charisma, and psychedelic Sgt. Pepper color bursts' },
  { name: 'The Rolling Stones', brief: 'a swaggering blues-rock band with skinny silhouettes, tongue-out attitude, and ragged glam energy' },
  { name: 'Eagles', brief: 'a polished California country-rock band with desert sunsets, hotel decadence, and laid-back West Coast cool' },
  { name: 'Fleetwood Mac', brief: 'a mystic 1970s rock group with shawls, stage romance, and elegant bohemian drama' },
  { name: 'Led Zeppelin', brief: 'a mythic hard-rock band with wizard-hair grandeur, runic mystique, and thunder-god energy' },
  { name: 'Queen', brief: 'a flamboyant arena-rock band with regal crests, theatrical camp, and operatic stage force' },
  { name: 'Pink Floyd', brief: 'a psychedelic prog-rock band with prism light, surreal space, and cerebral cosmic mood' },
  { name: 'Genesis', brief: 'an art-rock band with British theatricality, surreal prog motifs, and polished 1980s arena sheen' },
  { name: 'AC/DC', brief: 'a hard-rock band with schoolboy-uniform cheek, duckwalk swagger, and giant guitar-riff punch' },
  { name: "Guns N' Roses", brief: 'a sleazy hard-rock band with bandanas, roses, tattoo-flash menace, and Sunset Strip chaos' },
  { name: 'Aerosmith', brief: 'a flashy American rock band with scarves, big hair, microphones, and sleazy stage motion' },
  { name: 'Bon Jovi', brief: 'an anthemic arena-rock band with leather jackets, New Jersey grit, and glam-radio swagger' },
  { name: 'Metallica', brief: 'a heavy metal band with black denim, angular lightning forms, and aggressive thrash intensity' },
  { name: 'Def Leppard', brief: 'a glossy British rock band with leopard patterns, neon geometry, and radio-metal shine' },
  { name: 'U2', brief: 'a stadium-rock band with windswept silhouettes, desert horizons, and earnest activist grandeur' },
  { name: 'Coldplay', brief: 'a polished arena-pop-rock band with colorful light bursts, heartfelt uplift, and soft cosmic visuals' },
  { name: 'Chicago', brief: 'a brass-driven rock band with bold horn iconography, city-night polish, and classic FM warmth' },
  { name: 'Journey', brief: 'a melodic arena-rock band with soaring sci-fi fantasy motifs and uplifting power-ballad energy' },
  { name: 'Van Halen', brief: 'a party-hard guitar-rock band with striped guitar graphics, acrobatic motion, and flashy California swagger' },
  { name: 'Kiss', brief: 'a shock-rock band with face paint, platform boots, comic-book flames, and pyrotechnic excess' },
  { name: 'The Beach Boys', brief: 'a harmony surf-pop band with striped shirts, beach motifs, and bright California nostalgia' },
  { name: 'The Who', brief: 'a mod-rock band with Union Jack stage cues, smashed instruments, and explosive target iconography' },
  { name: 'Santana', brief: 'a guitar-led Latin rock band with spiritual iconography, swirling colors, and smooth Afro-Latin groove' },
  { name: 'ZZ Top', brief: 'a blues-rock band with giant beards, hot-rod cool, and dusty Texas swagger' },
  { name: 'Foreigner', brief: 'a polished arena-rock band with chrome typography, dramatic lighting, and radio-rock sharpness' },
  { name: 'Dire Straits', brief: 'a clean guitar-rock band with steel-string emblems, sky-back calm, and tasteful adult-rock elegance' },
  { name: 'Nirvana', brief: 'a scruffy grunge band with thrift-store attitude, scribbled smiley iconography, and raw 1990s angst' },
  { name: 'Green Day', brief: 'a bratty pop-punk band with skate-kid energy, graffiti textures, and sarcastic suburban rebellion' },
  { name: 'Red Hot Chili Peppers', brief: 'a funk-rock band with shirtless chaos, slap-bass energy, and spiky California weirdness' },
  { name: 'Foo Fighters', brief: 'a friendly hard-rock band with bearded frontman energy, bold circles-and-rays graphics, and arena uplift' },
  { name: 'Linkin Park', brief: 'a rap-rock band with urban angst, sharp tech-metal edges, and turn-of-the-millennium emotional intensity' },
  { name: 'Maroon 5', brief: 'a slick pop-rock band with fashion-forward stage styling, glossy romance, and radio-chart polish' },
  { name: 'The Police', brief: 'a sharp new-wave rock trio with angular contrast colors, reggae-pop bounce, and sting-driven cool' },
  { name: 'Duran Duran', brief: 'a glossy new-romantic band with yacht-club glamour, pastel fashion, and art-deco pop energy' },
  { name: 'The Clash', brief: 'a politically charged punk band with militant street style, collage typography, and rebel urgency' },
  { name: 'Oasis', brief: 'a swaggering Britpop band in parkas with sneering Manchester cool and union-jack-adjacent lad energy' },
  { name: 'The Cure', brief: 'a gothic new-wave band with teased hair, smeared eyeliner, and romantic end-of-the-world melancholy' },
  { name: 'Depeche Mode', brief: 'a sleek synth-pop band with dark tailored styling, industrial geometry, and brooding electronic cool' },
  { name: 'The Doors', brief: 'a psychedelic rock band with leather-poet mystique, sunset silhouettes, and smoky nightclub surrealism' },
  { name: 'R.E.M.', brief: 'an introspective alternative rock band with Americana iconography, faded signage, and thoughtful college-radio mood' },
];

const POP_STAR_ACTS = [
  { name: 'Michael Jackson', brief: 'a precision-dancing pop icon with red-jacket glamour, fedora cues, and moonwalk electricity' },
  { name: 'Prince', brief: 'a purple-toned pop-funk virtuoso with ornate tailoring, electric-guitar royalty, and erotic glamour' },
  { name: 'Elvis Presley', brief: 'a pompadoured rock-and-roll king with gold-lamé spectacle, vintage microphone flair, and Vegas shine' },
  { name: 'Cliff Richard', brief: 'a clean-cut British pop idol with polished suits, old-school smile, and evergreen stage charm' },
  { name: 'Madonna', brief: 'a chameleon pop diva with devotional glamour, cone-bra-era boldness, and reinvention energy' },
  { name: 'Lady Gaga', brief: 'an avant-pop icon in surreal high-fashion looks, theatrical spectacle, and fearless stage drama' },
  { name: 'Mariah Carey', brief: 'a melismatic diva with luxurious sparkle, microphone glamour, and holiday-pop queen energy' },
  { name: 'Whitney Houston', brief: 'a radiant vocal powerhouse with elegant gowns, spotlight drama, and soaring pop-soul strength' },
  { name: 'Elton John', brief: 'a piano-pop showman with outrageous glasses, glittering jackets, and joyful spectacle' },
  { name: 'Billy Joel', brief: 'a piano-bar storyteller with New York cool, classic tuxedo energy, and everyman charm' },
  { name: 'Barbra Streisand', brief: 'a dramatic showbiz legend with classic profile, old-Hollywood glamour, and torch-song poise' },
  { name: 'Celine Dion', brief: 'a grand theatrical ballad singer with elegant couture and powerhouse Vegas polish' },
  { name: 'Taylor Swift', brief: 'a modern stadium-pop star with glittery tour styling, diaristic glamour, and era-switching polish' },
  { name: 'Ariana Grande', brief: 'a high-ponytail pop diva with cloudlike gloss, sleek performance styling, and whistle-note sparkle' },
  { name: 'Rihanna', brief: 'a cool fashion-forward pop icon with edgy styling, beauty-mogul poise, and island-inflected confidence' },
  { name: 'Beyonce', brief: 'a regal pop and R&B superstar with gold stage glamour, commanding choreography, and queenly presence' },
  { name: 'Britney Spears', brief: 'a glossy millennial pop princess with schoolgirl-to-stage iconography and dance-pop sparkle' },
  { name: 'Christina Aguilera', brief: 'a powerhouse pop vocalist with glamorous stage styling and diva-level vocal bravado' },
  { name: 'Adele', brief: 'a soulful powerhouse vocalist in monochrome elegance with side-lit expression and emotional gravity' },
  { name: 'Katy Perry', brief: 'a candy-colored pop star with pin-up gloss, playful costume fantasy, and chart-pop brightness' },
  { name: 'Justin Bieber', brief: 'a tattooed pop idol with streetwear polish, tabloid celebrity aura, and youthful heartthrob energy' },
  { name: 'Ed Sheeran', brief: 'a ginger acoustic pop troubadour with loop-pedal busker charm and casual stadium appeal' },
  { name: 'Bruno Mars', brief: 'a retro-funk pop entertainer with slick tailoring, showband energy, and charismatic dance moves' },
  { name: 'George Michael', brief: 'a cool leather-jacket pop icon with stubble, jukebox swagger, and late-1980s confidence' },
  { name: 'Janet Jackson', brief: 'a sleek dance-pop icon with military-chic styling and cool choreographic precision' },
  { name: 'Cher', brief: 'a legendary diva with endless reinvention, dramatic hair, and glamorous camp spectacle' },
  { name: 'Shania Twain', brief: 'a crossover country-pop diva with leopard-print flair, radio polish, and stage confidence' },
  { name: 'Dolly Parton', brief: 'a rhinestone country-pop queen with towering blonde hair, sparkle, and warm Southern charisma' },
  { name: 'Olivia Newton-John', brief: 'a sunshine pop icon with roller-disco glow, soft curls, and wholesome-to-glam transformation' },
  { name: 'Cyndi Lauper', brief: 'a colorful pop eccentric with mismatched fashion, playful attitude, and quirky 1980s neon charm' },
  { name: 'Phil Collins', brief: 'a polished soft-rock pop star with drum-icon cues, blazer styling, and adult-contemporary cool' },
  { name: 'Rod Stewart', brief: 'a raspy-voiced pop-rock crooner with spiky hair, satin swagger, and stage-rogue charm' },
  { name: 'Lionel Richie', brief: 'a smooth pop-soul hitmaker with tuxedo ease, romantic ballad polish, and warm smile energy' },
  { name: 'Julio Iglesias', brief: 'a suave Latin pop crooner with luxury-suit elegance, romantic gaze, and international glamour' },
  { name: 'Frank Sinatra', brief: 'a tuxedoed lounge legend with fedora cues, martini cool, and old-school big-band polish' },
  { name: 'Tony Bennett', brief: 'a classic standards singer with tailored elegance, painterly warmth, and jazz-club sophistication' },
  { name: 'Tina Turner', brief: 'a lion-maned rock-pop dynamo with fierce stage energy, leather glamour, and unstoppable motion' },
  { name: 'Shakira', brief: 'a global pop star with wild curls, belly-dance motion, and Latin-rock performance energy' },
  { name: 'Selena Quintanilla', brief: 'a sparkling Tejano-pop icon with purple glamour, warm charisma, and crossover shine' },
  { name: 'Gloria Estefan', brief: 'a polished Latin pop star with Miami glamour, tropical rhythm cues, and bright crossover elegance' },
];

const BOY_BAND_ACTS = [
  { name: 'Backstreet Boys', brief: 'a polished boy band with coordinated poses, glossy late-1990s styling, and frosted teen-mag charisma' },
  { name: 'NSYNC', brief: 'a synchronized boy band with futuristic-pop styling, bright smiles, and shiny Y2K stage polish' },
  { name: 'Boyz II Men', brief: 'a smooth vocal harmony group with tailored suits, romantic R&B elegance, and classic quartet polish' },
  { name: 'New Kids on the Block', brief: 'a bright mall-pop boy band with varsity-jacket energy, big smiles, and bubblegum choreography' },
  { name: 'Westlife', brief: 'a clean-cut ballad-heavy boy band with glossy suits, heartfelt pop romance, and polished smiles' },
  { name: 'One Direction', brief: 'a modern global boy band with tousled hair, casual-chic styling, and playful arena-pop energy' },
  { name: 'Take That', brief: 'a British pop group with stage-suit polish, cheeky choreo, and long-running comeback confidence' },
  { name: 'Jackson 5', brief: 'a family pop-soul group with Afros, rainbow stagewear, and joyful retro Motown energy' },
  { name: 'BTS', brief: 'a hyper-stylized global boy band with fashion-forward looks, bright hair, and precision performance energy' },
  { name: 'Jonas Brothers', brief: 'a family pop-rock trio with glossy guitar-pop styling, teen-idol polish, and sibling-brand energy' },
  { name: 'Menudo', brief: 'a Latin teen-pop boy group with bright stagewear, synchronized smiles, and youthful tropical flair' },
  { name: '98 Degrees', brief: 'a sleek boy band with silk-shirt romance, smooth poses, and late-1990s pop polish' },
  { name: 'O-Town', brief: 'a reality-TV-era boy band with coordinated fashion, glossy photoshoot styling, and pop-star aspiration' },
  { name: 'Big Time Rush', brief: 'a TV-born boy band with bright California fun, shiny pop energy, and playful group branding' },
  { name: 'JLS', brief: 'a British vocal boy band with matching stagewear, glossy pop-soul styling, and performance swagger' },
  { name: 'The Osmonds', brief: 'a family pop group with clean-cut smiles, purple-era stage flair, and wholesome retro showbiz energy' },
  { name: 'Bros', brief: 'an 80s teen-pop boy act with denim jackets, teased hair, and glossy poster-wall fandom energy' },
  { name: 'Hanson', brief: 'a long-haired brother pop group with sunny power-pop energy, youthful charm, and guitar hooks' },
  { name: 'New Edition', brief: 'a foundational boy group with Boston street flair, polished choreography, and smooth R&B crossover style' },
  { name: 'The Monkees', brief: 'a TV-pop band with mod haircuts, comic charm, and colorful 1960s bubblegum energy' },
];

const GIRL_GROUP_ACTS = [
  { name: 'Spice Girls', brief: 'a girl-power pop group with bold individual personas, British sass, and bright spice-coded colors' },
  { name: "Destiny's Child", brief: 'a glamorous R&B girl group with coordinated stagewear, confident poses, and polished diva energy' },
  { name: 'TLC', brief: 'a colorful R&B trio with baggy fashion, bright primary colors, and playful 1990s attitude' },
  { name: 'The Supremes', brief: 'a classic Motown girl group with elegant gowns, beehive glamour, and polished 1960s stage symmetry' },
  { name: 'Little Mix', brief: 'a modern vocal girl group with glam-pop styling, coordinated confidence, and arena-ready sparkle' },
  { name: 'Fifth Harmony', brief: 'a sleek pop girl group with high-fashion poses, glossy hair, and social-media-era shine' },
  { name: 'En Vogue', brief: 'a sophisticated vocal group with sharp black couture, smooth elegance, and cool R&B authority' },
  { name: 'Bananarama', brief: 'a bright 80s pop trio with colorful fashion, beach-party energy, and playful new-wave charm' },
  { name: 'The Pussycat Dolls', brief: 'a cabaret-pop group with burlesque glamour, corset styling, and high-heel performance swagger' },
  { name: 'Girls Aloud', brief: 'a British pop girl group with glossy magazine styling, coordinated glam, and chart-pop sparkle' },
  { name: 'BLACKPINK', brief: 'a luxury-styled global girl group with black-pink contrast, high-fashion edge, and fierce stage precision' },
  { name: 'The Chicks', brief: 'a country-pop trio with boots, fiddle cues, and outspoken modern-roots confidence' },
  { name: 'SWV', brief: 'a 90s R&B trio with smooth harmony styling, cool oversized fashion, and romantic streetwise polish' },
  { name: 'All Saints', brief: 'a British girl group with cargo-pants cool, understated fashion, and moody pop-soul edge' },
  { name: 'Wilson Phillips', brief: 'a California harmony group with flowing hair, soft-focus adult-pop polish, and warm vocal blend' },
  { name: 'Sugababes', brief: 'a UK girl group with fashion-forward cool, changing-lineup mystique, and sleek electro-pop edge' },
  { name: 'AKB48', brief: 'a giant Japanese idol group with school-uniform sparkle, ribbon motifs, and cheerful pop maximalism' },
  { name: '2NE1', brief: 'a K-pop girl group with bold street-glam styling, sharp attitude, and futuristic stage energy' },
  { name: 'The Pointer Sisters', brief: 'a stylish vocal group with dance-floor gloss, retro-soul sparkle, and warm performance charisma' },
  { name: 'Sister Sledge', brief: 'a family disco-soul group with glittering stagewear, unity motifs, and bright dance-floor elegance' },
];

const RAP_HIPHOP_ACTS = [
  { name: 'Eminem', kind: 'solo', brief: 'a sharp-tongued rap icon with hoodie energy, bleach-blond edge, and Detroit battle intensity' },
  { name: 'Drake', kind: 'solo', brief: 'a luxury rap-pop star with beard iconography, moody introspection, and understated designer cool' },
  { name: 'Jay-Z', kind: 'solo', brief: 'a mogul rapper with minimalist luxury, empire-building confidence, and black-and-gold prestige' },
  { name: 'Kanye West', kind: 'solo', brief: 'a fashion-forward rap auteur with oversized silhouettes, stark minimalism, and polarizing grandeur' },
  { name: 'Tupac Shakur', kind: 'solo', brief: 'a revolutionary rap icon with bandana motifs, intense gaze, and West Coast street poetry' },
  { name: 'The Notorious B.I.G.', kind: 'solo', brief: 'a crown-tipped rap king with luxury streetwear, smooth swagger, and East Coast opulence' },
  { name: 'Lil Wayne', kind: 'solo', brief: 'a tattoo-heavy rap star with dreadlocks, skate-punk chaos, and Southern mixtape intensity' },
  { name: 'Nicki Minaj', kind: 'solo', brief: 'a flamboyant rap-pop queen with hyper-color wigs, toy-like glam, and fierce alter-ego energy' },
  { name: 'Snoop Dogg', kind: 'solo', brief: 'a lanky rap icon with braids, lowrider cool, and laid-back West Coast swagger' },
  { name: 'Dr. Dre', kind: 'solo', brief: 'a producer-rap legend with studio authority, black streetwear polish, and heavy-beat gravitas' },
  { name: 'Kendrick Lamar', kind: 'solo', brief: 'a cerebral rap poet with understated streetwear, intense focus, and activist edge' },
  { name: 'J. Cole', kind: 'solo', brief: 'a thoughtful rap storyteller with hoodie cues, locs, and grounded introspective energy' },
  { name: '50 Cent', kind: 'solo', brief: 'a bulletproof-era rap star with tank-top swagger, gritty New York bravado, and muscular menace' },
  { name: 'Missy Elliott', kind: 'solo', brief: 'a futuristic rap innovator with inflatable silhouettes, chrome weirdness, and playful hip-hop surrealism' },
  { name: 'Run-D.M.C.', kind: 'group', brief: 'an old-school rap trio with adidas-shell-toe cues, bold stripes, and hard-hitting street simplicity' },
  { name: 'Beastie Boys', kind: 'group', brief: 'a bratty rap trio with skate-punk energy, block-letter graphics, and chaotic downtown cool' },
  { name: 'OutKast', kind: 'group', brief: 'an eclectic southern rap duo with cosmic funk color, fur-and-flash style, and fearless creativity' },
  { name: 'Public Enemy', kind: 'group', brief: 'a militant rap group with target iconography, loud protest energy, and black-red urgency' },
  { name: 'N.W.A.', kind: 'group', brief: 'a stark street-rap crew with black caps, confrontational typography, and West Coast menace' },
  { name: 'Cardi B', kind: 'solo', brief: 'a bold rap-pop star with maximal glamour, long nails, luxury fashion, and outspoken Bronx energy' },
];

function buildMusicEntriesFromActs(prefix, groupId, groupName, acts) {
  const entries = [];
  for (let index = 0; index < acts.length; index += 2) {
    const pairNumber = Math.floor(index / 2) + 1;
    entries.push({
      entryId: `${prefix}-${String(pairNumber).padStart(2, '0')}`,
      groupId,
      groupName,
      hint: `Picture Prompt • ${groupName} Logo ${pairNumber}`,
      main: acts[index].name,
      imposter: acts[index + 1].name,
    });
  }
  return entries;
}

const MUSIC_ACT_META = Object.fromEntries(
  [
    ...ROCK_BAND_ACTS.map((act) => [act.name, { kind: 'band', descriptor: 'best-selling rock band', segment: 'rock', brief: act.brief }]),
    ...POP_STAR_ACTS.map((act) => [act.name, { kind: 'solo', descriptor: 'best-selling pop star', segment: 'pop', brief: act.brief }]),
    ...BOY_BAND_ACTS.map((act) => [act.name, { kind: 'group', descriptor: 'best-selling boy band', segment: 'boy-band', brief: act.brief }]),
    ...GIRL_GROUP_ACTS.map((act) => [act.name, { kind: 'group', descriptor: 'best-selling girl group', segment: 'girl-group', brief: act.brief }]),
    ...RAP_HIPHOP_ACTS.map((act) => [act.name, { kind: act.kind || 'solo', descriptor: act.kind === 'group' ? 'best-selling rap or hip-hop group' : 'best-selling rap or hip-hop artist', segment: 'rap-hip-hop', brief: act.brief }]),
  ]
);

function getMusicActMeta(subject) {
  return MUSIC_ACT_META[String(subject || '').trim()] || { kind: 'artist', segment: 'music', brief: '' };
}

const MUSIC_ENTRIES = [
  ...buildMusicEntriesFromActs('rock', 'rock-bands', 'Rock Bands', ROCK_BAND_ACTS),
  ...buildMusicEntriesFromActs('pop', 'pop-stars', 'Pop Stars', POP_STAR_ACTS),
  ...buildMusicEntriesFromActs('boy', 'boy-bands', 'Boy Bands', BOY_BAND_ACTS),
  ...buildMusicEntriesFromActs('girl', 'girl-groups', 'Girl Groups', GIRL_GROUP_ACTS),
  ...buildMusicEntriesFromActs('rap', 'rap-hip-hop', 'Rap & Hip-Hop', RAP_HIPHOP_ACTS),
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
  'an embroidered jacket-patch badge with a bold central wordmark and surrounding themed icons',
  'a distressed back-patch emblem with stacked text, stitched border, and symbolic act imagery',
  'a circular woven bag-patch design with a crest-like logo and small surrounding motifs',
  'a sticker-like merch patch with rugged outline, banner text treatment, and iconic symbolic elements',
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
    label: 'Top-Selling Music Patch Logo Parodies v1',
    groupId: 'music-parodies',
    groupName: 'Music Patch Logo Parodies',
    previewLabel: 'Describe the music patch logo clearly without naming the exact act.',
    promptHint: 'Picture Prompt • Music Patch Logo',
    entries: MUSIC_ENTRIES,
    compositionModes: MUSIC_COMPOSITION_MODES,
  },
  albums: {
    categoryId: 'albums',
    packId: DEFAULT_ALBUMS_PACK_ID,
    label: 'Top Albums Cover Parodies v1',
    groupId: 'albums-parodies',
    groupName: 'Album Cover Parodies',
    previewLabel: 'Describe the album-cover parody image clearly without naming the exact album.',
    promptHint: 'Picture Prompt • Album Cover Parody',
    entries: [],
    compositionModes: [
      'a spoof album-cover poster layout with one bold central visual',
      'a dramatic illustrated sleeve composition with transformed cover symbolism',
      'a collage-heavy faux vinyl-cover layout with iconic visual motifs',
      'a clean graphic album-jacket design with strong color blocking and emblematic props',
    ],
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
  console.log('  --category <music|albums|screen|all>  Which curated pack(s) to process (default: all)');
  console.log(`  --output-root <path>            Output folder (default: ${path.relative(repoRoot, defaultOutputRoot)})`);
  console.log('  --provider <openai|flux>        Image provider (default: openai)');
  console.log('  --api-key <key>                 Provider API key (OPENAI_API_KEY or FAL_KEY / FAL_API_KEY / FLUX_API_KEY)');
  console.log('  --model <name>                  Model name (OpenAI default: gpt-image-1, FLUX default: fal-ai/flux/dev)');
  console.log('  --size <WxH>                    Image size (default: 800x800)');
  console.log('  --quality <low|medium|high>     Image quality (default: high)');
  console.log('  --safety-tolerance <0-6>        Reserved for non-fal FLUX backends');
  console.log(`  --music-reference-feed-url <url> Music cover RSS feed for references (default: ${DEFAULT_MUSIC_REFERENCE_FEED_URL})`);
  console.log('  --no-music-reference-feed       Disable music cover reference image lookup');
  console.log(`  --style-reference-url <url>     Default music style reference image (default: ${DEFAULT_STYLE_REFERENCE_URL})`);
  console.log('  --no-style-reference            Disable default music style reference image');
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
    musicReferenceFeedUrl: DEFAULT_MUSIC_REFERENCE_FEED_URL,
    musicReferenceFeedEnabled: true,
    styleReferenceUrl: DEFAULT_STYLE_REFERENCE_URL,
    styleReferenceEnabled: true,
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
    else if (arg === '--music-reference-feed-url') { options.musicReferenceFeedUrl = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--no-music-reference-feed') { options.musicReferenceFeedEnabled = false; options.musicReferenceFeedUrl = ''; }
    else if (arg === '--style-reference-url') { options.styleReferenceUrl = String(argv[i + 1] || '').trim(); i += 1; }
    else if (arg === '--no-style-reference') { options.styleReferenceEnabled = false; options.styleReferenceUrl = ''; }
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

function normalizeMusicActName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function fetchTextWithUserAgent(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 CursorCloudAgent',
      Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Reference feed fetch failed: HTTP ${response.status} ${message}`);
  }
  return response.text();
}

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractCoverUrlFromRssDescription(description = '') {
  const match = String(description).match(/https:\/\/albumart\.besteveralbums\.com\/albumart\/[^"'\s>]+?\.(?:jpg|jpeg|png|webp)/i);
  return match ? decodeXmlEntities(match[0]) : '';
}

function parseMusicReferenceFeedItems(xmlText = '') {
  const items = [];
  const itemMatches = String(xmlText).match(/<item>[\s\S]*?<\/item>/gi) || [];
  itemMatches.forEach((itemXml) => {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const descriptionMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)
      || itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    const title = decodeXmlEntities(titleMatch ? titleMatch[1] : '').trim();
    const description = descriptionMatch ? descriptionMatch[1] : '';
    const coverUrl = extractCoverUrlFromRssDescription(description);
    if (!title || !coverUrl) return;
    const rankedTitle = title.replace(/^\d+\.\s*/, '').trim();
    const artistMatch = rankedTitle.match(/-\s*(.+)$/);
    const artist = artistMatch ? artistMatch[1].trim() : rankedTitle;
    items.push({
      title: rankedTitle,
      artist,
      coverUrl,
      normalizedArtist: normalizeMusicActName(artist),
    });
  });
  return items;
}

async function loadMusicReferenceMap(options) {
  if (!options.musicReferenceFeedEnabled || !options.musicReferenceFeedUrl) return new Map();
  const xml = await fetchTextWithUserAgent(options.musicReferenceFeedUrl);
  const items = parseMusicReferenceFeedItems(xml);
  const map = new Map();
  items.forEach((item) => {
    if (!item.normalizedArtist || map.has(item.normalizedArtist)) return;
    map.set(item.normalizedArtist, item.coverUrl);
  });
  return map;
}

function buildAlbumsEntriesFromFeedMap(referenceMap) {
  const entries = [];
  let index = 0;
  for (const [key, coverUrl] of referenceMap.entries()) {
    const source = referenceMap.__meta && referenceMap.__meta[key];
    if (!source || !source.title || !source.artist) continue;
    entries.push({
      entryId: `album-${String(index + 1).padStart(2, '0')}`,
      groupId: 'albums-reference',
      groupName: 'Albums',
      hint: `Picture Prompt • Albums ${index + 1}`,
      main: `${source.artist} - ${source.title}`,
      imposter: `${source.artist} - ${source.title}`,
      referenceCoverUrl: coverUrl,
    });
    index += 1;
  }
  return entries;
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
  music: Object.fromEntries(Object.entries(MUSIC_ACT_META).map(([name, meta]) => [name, meta.brief])),
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
      'Create a single square original artist or band-inspired patch emblem built from transformed visual identity cues.',
      `Subject brief: ${brief}.`,
      `Composition mode: ${compositionMode}.`,
      `Style direction: ${options.styleNotes}.`,
      'Make it feel playful, iconic, and music-quiz readable while staying generic enough to avoid recreating any exact trademarked band logo, album cover, or official merch patch.',
      'Use transformed motifs inspired by clothing, album-art colors, signature props, silhouette language, and attitude instead of literal copied branding.',
      'Keep it patch-like: embroidered or woven border, badge-emblem construction, bold central wordmark area, and symbolic act imagery around it.',
      'Do not include people, faces, exact existing logos, or exact album-cover layouts.',
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
      'Create a single square original patch-style music emblem built from symbolic identity cues only.',
      brief ? `Subject brief: ${brief}.` : 'Use a generic transformed music-identity concept with symbolic cues only.',
      `Composition mode: ${compositionMode}.`,
      `Style direction: ${options.styleNotes}.`,
      'Prefer symbols, props, instruments, costume fragments, insignia shapes, and color-story motifs over any people or portrait elements.',
      'Make it quiz-readable and detailed at 800x800 while avoiding any exact real person, readable extra text, or trademark-like design.',
      'No people, no faces, no exact logos, and no copied official wordmark styling.',
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
  const meta = getMusicActMeta(subject);
  const namedReference = meta.kind === 'band'
    ? `the best-selling rock band "${subject}"`
    : `the best-selling pop star "${subject}"`;
  return [
    `Create a single square original parody patch emblem for ${namedReference}.`,
    'Make the act name itself the central stylized text logo or wordmark.',
    'Do not include any people, faces, or character art.',
    'Surround the wordmark with symbolic imagery pulled from the act\'s clothing, stage persona, instruments, signature props, and album-art color cues.',
    'Design it like a jacket patch, bag patch, woven badge, embroidered crest, or rugged merch emblem that a music-trivia player could connect to the act at a glance.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Use the attached graphic direction as inspiration: comic-punk illustration, crisp outlines, flat saturated fills, distressed stitched-patch energy, and playful collage poster symbolism.',
    'Push the humour, symbolic motifs, and graphic identity choices so it feels like a satirical spoof patch, not a clone.',
    'Keep the composition bold, clean, high-contrast, and instantly legible at thumbnail size for a party-game picture round.',
    'Do not copy any exact official logo, exact album cover, exact merch patch, or trademarked wordmark styling.',
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

function buildAlbumsPrompt(subject, options, compositionMode) {
  return [
    `Create a single square original parody album-cover image inspired by "${subject}".`,
    'Use the reference album cover only as composition and motif material, then transform it into a fresh parody image rather than a direct recreation.',
    `Composition mode: ${compositionMode}.`,
    `Style direction: ${options.styleNotes}.`,
    'Preserve the broad visual read of the cover while making the artwork more comic, graphic, and stylized.',
    'Keep the result clean, bold, and recognisable at thumbnail size for a picture round.',
    'Do not reproduce exact title typography, logos, or the exact original layout one-for-one.',
  ].join(' ');
}

function buildPromptForSubject(pack, subject, options, compositionMode) {
  if (pack.categoryId === 'music') return buildMusicPrompt(subject, options, compositionMode);
  if (pack.categoryId === 'albums') return buildAlbumsPrompt(subject, options, compositionMode);
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
      groupId: entry.groupId || pack.groupId,
      groupName: entry.groupName || pack.groupName,
      hint: entry.hint || `${pack.promptHint} ${index + 1}`,
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
  const musicReferenceMap = (pack.categoryId === 'music' || pack.categoryId === 'albums')
    ? (options.musicReferenceMap || new Map())
    : new Map();
  const styleReferenceImageUrl = (
    (pack.categoryId === 'music' || pack.categoryId === 'albums')
    && options.styleReferenceEnabled
    && options.styleReferenceUrl
  )
    ? String(options.styleReferenceUrl).trim()
    : '';

  selectedEntries.forEach((entry) => {
    const compositionMode = pickCompositionMode(pack, promptRecords.length);
    const mainNamedPrompt = buildPromptForSubject(pack, entry.main, options, compositionMode);
    const mainSafePrompt = buildFallbackPromptForSubject(pack, entry.main, options, compositionMode);
    const mainUltraSafePrompt = buildUltraSafePromptForSubject(pack, entry.main, options, compositionMode);
    const mainDedupeKey = (pack.categoryId === 'music' || pack.categoryId === 'albums')
      ? String(entry.main).trim().toLowerCase()
      : '';
    const mainReferenceImageUrl = pack.categoryId === 'music'
      ? String(musicReferenceMap.get(normalizeMusicActName(entry.main)) || '').trim()
      : (pack.categoryId === 'albums' ? String(entry.referenceCoverUrl || '').trim() : '');
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
      dedupeKey: mainDedupeKey,
      referenceImageUrl: mainReferenceImageUrl,
      styleReferenceImageUrl,
    });
    const imposterCompositionMode = pickCompositionMode(pack, promptRecords.length);
    const imposterNamedPrompt = buildPromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    const imposterSafePrompt = buildFallbackPromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    const imposterUltraSafePrompt = buildUltraSafePromptForSubject(pack, entry.imposter, options, imposterCompositionMode);
    const imposterDedupeKey = (pack.categoryId === 'music' || pack.categoryId === 'albums')
      ? String(entry.imposter).trim().toLowerCase()
      : '';
    const imposterReferenceImageUrl = pack.categoryId === 'music'
      ? String(musicReferenceMap.get(normalizeMusicActName(entry.imposter)) || '').trim()
      : (pack.categoryId === 'albums' ? String(entry.referenceCoverUrl || '').trim() : '');
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
      dedupeKey: imposterDedupeKey,
      referenceImageUrl: imposterReferenceImageUrl,
      styleReferenceImageUrl,
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

async function generateWithFlux({ prompt, apiKey, model, size, referenceImageUrl = '', styleReferenceImageUrl = '' }) {
  const { width, height } = validateFluxSize(size);
  const useImageToImage = Boolean(referenceImageUrl);
  const modelId = String(
    model || (useImageToImage ? 'fal-ai/flux/dev/image-to-image' : 'fal-ai/flux/dev')
  ).trim().replace(/^\/+/, '');
  const promptWithStyle = styleReferenceImageUrl
    ? `${prompt} Use this style reference image as the visual style guide: ${styleReferenceImageUrl}`
    : prompt;
  const body = useImageToImage
    ? {
        image_url: referenceImageUrl,
        prompt: promptWithStyle,
        strength: 0.92,
        image_size: { width, height },
        num_images: 1,
        output_format: 'png',
        enable_safety_checker: true,
        sync_mode: false,
      }
    : {
        prompt: promptWithStyle,
        image_size: { width, height },
        num_images: 1,
        output_format: 'png',
        enable_safety_checker: true,
        sync_mode: false,
      };
  const response = await fetch(`https://fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

async function generateImageWithProvider({
  provider,
  prompt,
  apiKey,
  model,
  size,
  quality,
  safetyTolerance,
  referenceImageUrl = '',
  styleReferenceImageUrl = '',
}) {
  if (provider === 'flux') {
    return generateWithFlux({
      prompt,
      apiKey,
      model,
      size,
      safetyTolerance,
      referenceImageUrl,
      styleReferenceImageUrl,
    });
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
  const generatedByDedupeKey = new Map();

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
    const dedupeKey = String(record.dedupeKey || '').trim();

    if (dedupeKey && generatedByDedupeKey.has(dedupeKey)) {
      const sourcePath = generatedByDedupeKey.get(dedupeKey);
      if (sourcePath && fs.existsSync(sourcePath)) {
        if (!exists || options.overwrite) {
          fs.copyFileSync(sourcePath, outputPath);
        }
        skipped += 1;
        results.push({
          subject: record.subject,
          side: record.side,
          mediaFile: record.mediaFile,
          status: 'copied_from_duplicate',
          dedupeKey,
          copiedFrom: path.relative(repoRoot, sourcePath),
          provider: options.provider,
          model: options.model,
        });
        console.log(`- [${index + 1}/${plan.promptRecords.length}] COPY ${record.subject} (${relOutputPath}) <- ${path.relative(repoRoot, sourcePath)}`);
        continue;
      }
    }

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
        referenceImageUrl: record.referenceImageUrl,
        styleReferenceImageUrl: record.styleReferenceImageUrl,
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
          referenceImageUrl: record.referenceImageUrl,
          styleReferenceImageUrl: record.styleReferenceImageUrl,
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
              referenceImageUrl: record.referenceImageUrl,
              styleReferenceImageUrl: record.styleReferenceImageUrl,
            });
            usedRetryPrompt = true;
            usedPromptStrategy = record.finalRetryPromptStrategy || 'final_retry_prompt';
            fs.writeFileSync(outputPath, imageBuffer);
            if (dedupeKey) generatedByDedupeKey.set(dedupeKey, outputPath);
            created += 1;
            results.push({
              subject: record.subject,
              side: record.side,
              mediaFile: record.mediaFile,
              status: 'created_with_retry',
              promptStrategy: usedPromptStrategy,
              dedupeKey,
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
    if (dedupeKey) generatedByDedupeKey.set(dedupeKey, outputPath);
    created += 1;
    results.push({
      subject: record.subject,
      side: record.side,
      mediaFile: record.mediaFile,
      status: usedRetryPrompt ? 'created_with_retry' : 'created',
      promptStrategy: usedPromptStrategy,
      dedupeKey,
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
  if (!['music', 'albums', 'screen', 'all'].includes(options.category)) {
    throw new Error(`Unsupported --category "${options.category}". Use music, albums, screen, or all.`);
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

  options.musicReferenceMap = await loadMusicReferenceMap(options);
  if (options.musicReferenceMap && options.musicReferenceMap.size > 0) {
    options.musicReferenceMap.__meta = Object.fromEntries(
      Array.from(options.musicReferenceMap.entries()).map(([normalizedArtist, coverUrl]) => {
        const parts = normalizedArtist.split(' ');
        return [normalizedArtist, { artist: parts.join(' '), title: normalizedArtist, coverUrl }];
      })
    );
  }

  PACKS.albums.entries = buildAlbumsEntriesFromFeedMap(options.musicReferenceMap || new Map());

  const packKeys = options.category === 'all' ? ['music', 'albums', 'screen'] : [options.category];
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
