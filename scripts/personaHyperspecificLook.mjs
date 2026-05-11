/**
 * Dense, identity-specific bust descriptions for persona avatar prompts.
 * Covers varied ages, ethnicities, social presentation, glasses, facial hair,
 * makeup, scars, piercings, teeth, skin texture, and class cues.
 * Used by scripts/rewriteTailoredSegments.mjs and scripts/generateDlcPersonaRoster.mjs.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { extractDisplayNameVisualSteer } = require('./personaNameVisualCues.cjs');

/** Exact overrides — unmistakably different from synthesized faces. */
export const LOOK_OVERRIDES_BY_ID = {
  'default-barry-side-eye-collins':
    'GENDER LOCK (NON-NEGOTIABLE): adult human man — must read male. White man, chubby, mid-50s, mostly bald crown with gingery-grey hair only around the sides and back; narrow slitty inquisitive eyes deliberately looking sideways under a heavy brow; soft jaw and flushed cheeks; shiny sweat on forehead and upper lip; nervous tight mouth like he is mid-overhear; cheap loose polo shirt with a stretched collar and a faint food stain; silver chain just visible; anxious weight-shift implied in the shoulders; no glasses.',
};

/** Mirrors `exportPersonaAvatarPrompts.cjs` name hints so gender matches common names. */
const FEMALE_NAME_HINTS = new Set([
  'nina', 'edith', 'tasha', 'pixie', 'zara', 'penny', 'chloe', 'rachel', 'jett', 'amy',
  'ingrid', 'bianca', 'harper', 'sadie', 'cleo', 'lena', 'priya', 'naomi', 'carmen',
  'agatha', 'lillian', 'margaret', 'vivian', 'clara', 'mabel', 'beatrice', 'nora',
  'winifred', 'evelyn', 'helena', 'mildred', 'maeve', 'nyx', 'lira', 'elin', 'nettles',
  'zuri', 'bride', 'annie', 'mel', 'beth', 'hilda', 'mourne', 'floe', 'fang', 'astrid',
  'sigrid', 'freya', 'matilda', 'cordelia', 'beatrix', 'seraphina', 'henrietta',
  'gwendolyn', 'adelaide', 'penelope', 'vivienne', 'cassia', 'aurelia', 'octavia',
]);
const MALE_NAME_HINTS = new Set([
  'barry', 'marvin', 'callum', 'gregor', 'leon', 'dave', 'malik', 'ronan', 'colin', 'yusuf',
  'kyle', 'arthur', 'nico', 'marco', 'oscar', 'dex', 'freddie', 'owen', 'reginald', 'thomas',
  'harold', 'bernard', 'doyle', 'cedric', 'douglas', 'leonard', 'victor', 'rupert', 'eddie',
  'stu', 'bill', 'tom', 'redd', 'jenkins', 'burke', 'rami', 'dreg', 'harlan', 'silas', 'donny',
  'kaito', 'rolf', 'bjorn', 'ulf', 'eirik', 'harald', 'gunnar', 'snorri', 'magnus', 'ivar',
  'tiber', 'flavius', 'brutus', 'lucius', 'marcellus', 'maximus', 'percival',
  'alistair', 'felix', 'mortimer', 'clive', 'horace', 'barnaby', 'edmund',
]);
const NON_BINARY_NAME_HINTS = new Set(['jules', 'rio', 'reefspawn', 'glim', 'void', 'rook']);

function firstNameToken(name) {
  const parts = String(name || '')
    .replace(/["“”'().]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const titles = new Set(['dr', 'mr', 'mrs', 'ms', 'miss', 'sir', 'lady', 'professor', 'prof', 'captain', 'sgt', 'cpl', 'lt', 'ada', 'cmdr', 'ensign', 'judge', 'detective', 'inspector', 'sergeant', 'major', 'colonel', 'general', 'nurse', 'matron']);
  if (parts.length > 1 && titles.has(parts[0].toLowerCase().replace(/\.$/, ''))) {
    return parts[1].toLowerCase();
  }
  return (parts[0] || '').toLowerCase();
}

/** @returns {'female'|'male'|'non-binary'|'unknown'} */
function inferGenderBucket(name, bio) {
  const b = String(bio || '').toLowerCase();
  const first = firstNameToken(name);
  if (/\b(she|her|hers|woman|girl|lady|queen|bride|mother|mum|granny)\b/.test(b)) return 'female';
  if (/\b(he|him|his|man|boy|father|king)\b/.test(b)) return 'male';
  if (/\b(they|them|their|nonbinary|non-binary)\b/.test(b)) return 'non-binary';
  if (FEMALE_NAME_HINTS.has(first)) return 'female';
  if (MALE_NAME_HINTS.has(first)) return 'male';
  if (NON_BINARY_NAME_HINTS.has(first)) return 'non-binary';
  return 'unknown';
}

function genderLockPrefix(bucket) {
  if (bucket === 'female') {
    return 'GENDER LOCK (NON-NEGOTIABLE): adult human woman — must read unmistakably female; do NOT render as male or masc-androgynous. ';
  }
  if (bucket === 'male') {
    return 'GENDER LOCK (NON-NEGOTIABLE): adult human man — must read unmistakably male; do NOT render as female. ';
  }
  if (bucket === 'non-binary') {
    return 'GENDER LOCK (NON-NEGOTIABLE): adult non-binary / androgynous-presenting person — honor neutral cues; do NOT force binary gender. ';
  }
  return '';
}

function pickGenderPhrase(bucket, id) {
  if (bucket === 'female') return pick(['adult woman', 'adult woman', 'adult woman', 'person read clearly as femme'], id, 'gf');
  if (bucket === 'male') return pick(['adult man', 'adult man', 'adult man', 'person read clearly as masc'], id, 'gm');
  if (bucket === 'non-binary') {
    return pick(['nonbinary-presenting adult', 'androgynous-presenting adult'], id, 'gn');
  }
  return pick(GENDERS, id, 'gen');
}

/** Theme-local costume steer (bust only, no readable logos/text). */
export const THEME_BUST_COSTUME_CUE = {
  Vikings:
    'fur mantle, ring-mail collar suggestion, runic brooch abstract, braided or wild hair, battle-scar cheek, hornless pragmatic gear',
  Gladiators:
    'bronze greaves hint, leather pteruges shoulder, sweat-salt sheen, arena grit, laurel-or-not victory crown optional',
  Royalty:
    'velvet or brocade high collar, jeweled chain abstract, powdered wig OR slick aristocrat hair, haughty chin',
  'Mythology (Gods & Legends)':
    'gold laurel or circlet abstract, draped chiton or toga fold, divine glow as hard cel rim light not soft bloom',
  'Time Travelers':
    'mismatched era jacket lapels, LED strip accents, pocket watch with wrong hands, chronometer pin generic',
  Spies: 'trench or tailored black coat, earpiece wire, mirrored shades half-down, bruised knuckle optional',
  Cowboys: 'dusty hat brim, bandana knot, denim or duster collar, sun-leather skin',
  'Detectives Noir': 'fedora shadow, trench lapel, cigarette prop unlit, five-o-clock grit',
  Medical: 'scrubs or lab coat, stethoscope, ID badge blank plastic, tired smug eyes',
  Wrestlers: 'face paint stripes, championship belt buckle abstract shape, sweat sheen, mic cord at neck edge',
  Cyberpunk: 'neon piping jacket, chrome cheek implant, under-eye HUD glasses blank, cable collar',
  Aliens: 'slightly green or grey skin, antenna nubs, jumpsuit with triangle insignia abstract, too-many eyelids suggestion',
  'Wizards & Witches':
    'pointed hat brim cut by frame top, cloak clasp crystal, wand tip barely visible at chest line',
  Ninjas: 'wrapped mask half-down OR hood, throwing knife handle in headband, black gi collar',
  'Rock Stars': 'spandex, torn fishnet, heavy eyeliner, wild hair, lightning makeup bolt',
  'Flying Squad': 'flight jacket patches as abstract shapes, headset boom, aviator frames',
  'Drag Queens': 'big wig volume, lashes to forehead, sequin bustier, contour warpaint',
  Superheroes: 'spandex suit chevron emblem abstract, cape fold, heroic jaw, mask lines',
  Medieval: 'chain-mail coif, surcoat with heraldic shape blocks only, mud-splattered cheek, iron pauldron edge',
  Gangsters: 'pinstripe suit, fedora tilt, cigar stub, gold ring glint, shoulder holster strap suggestion',
  'Law and Order': 'court blazer or police blues, lapel mic nub, blank badge, stack of folders prop edge',
  'Sci-Fi': 'jumpsuit with glowing seam lines, chest computer panel abstract, comm badge no text, zero-g hair float',
  Anime: 'spiky two-tone hair, school-uniform collar OR hero scarf, huge expressive cel eyes still with pin pupils per style guide',
  Cartoons: 'rubber-hose gloves, polka-dot bow tie, pie-on-face smear optional, oversized shoes collar only',
  'Under the Sea': 'kelp hair strands, fish-scale makeup pattern, barnacle shoulder speckles, wet sheen',
  Military: 'camo pattern blocks, dog tags blank, crew cut, rank chevrons abstract shapes',
  Animals: 'anthro muzzle or ears on humanoid party-game body, collar tag blank, fur tuft at neckline',
  Sports: 'jersey mesh, team stripe color blocks no logos, sweatband, whistle on lanyard',
  'Post-Apocalypse': 'goggles on forehead, dust scarf, scrap armor plates, tire tread shoulder pad',
  Monsters: 'green-grey skin, neck bolts cartoon, stitched cheek, tattered lab coat collar',
  Carnival: 'ruffled collar, clown nose paint optional, top hat cut by frame, sequin lapels',
  Default: 'gritty contemporary streetwear, worn fabrics, nothing corporate-polished',
};

const AGES = [
  'very young-looking adult, college-age',
  'late teens appearance',
  'early 20s',
  'mid-20s',
  'late 20s',
  'early 30s',
  'mid-30s',
  'late 30s',
  'early 40s',
  'mid-40s',
  'late 40s',
  'early 50s',
  'mid-50s',
  'late 50s',
  'early 60s',
  'mid-60s',
  'late 60s',
  'early 70s',
  'late 70s',
  '80s with deep wrinkles and paper-thin skin',
];

const GENDERS = [
  'man',
  'woman',
  'person read as masc',
  'person read as femme',
  'androgynous-presenting person',
  'nonbinary-presenting person',
];

/** Broad ethnic / regional appearance cues — rotate heavily for roster variety. */
const ETHNICITIES = [
  'West African-heritage Black',
  'Caribbean Black',
  'East African-heritage Black',
  'African American Black',
  'Nigerian-heritage Black',
  'Ethiopian-heritage features',
  'Korean',
  'Japanese',
  'Chinese',
  'Vietnamese',
  'Filipino',
  'Indian subcontinent Desi brown skin',
  'Pakistani-heritage warm brown skin',
  'Bangladeshi-heritage',
  'Arab Middle Eastern',
  'Persian Iranian',
  'Turkish olive',
  'white British-Irish pale',
  'white Eastern European ruddy',
  'white Scandinavian very pale',
  'white Mediterranean olive',
  'Latino Central American Indigenous mix',
  'Latino Caribbean mix',
  'Brazilian mixed heritage',
  'Mexican mestizo features',
  'Indigenous North American features',
  'Indigenous Latin American features',
  'Pacific Islander broad features',
  'Southeast Asian Thai',
  'Southeast Asian Indonesian',
  'Eastern European Jewish curly dark hair texture',
  'bright patterned scarf stacked neck layers',
  'mixed-race visibly blended features',
];

const SOCIAL_CUES = [
  'working-class tired uniform energy',
  'manual-labor sun-creased neck',
  'office-drone cheap shirt and bad posture',
  'trust-fund crisp collar too clean for the room',
  'student broke hoodie and backpack strap',
  'suburban soft layers and nervous smile',
  'aging club kid glitter dust in hairline',
  'warehouse reflective safety stripe on shoulder',
  'retiree soft jowls and hearing-aid BTE outline behind one ear',
  'service-industry grease pencil behind ear',
  'gig-economy lanyard stack at neck',
  'rough-sleeper layered collars mismatched',
  'country-club tan line at sunglasses zone',
  'artist paint specks on cheekbone',
  'nurse scrub v-neck with faint stain',
];

const BUILDS = [
  'rail-thin and bony',
  'soft overweight with a heavy middle',
  'compact muscular',
  'tall lanky with visible ribs',
  'short stocky',
  'average build slightly hunched',
  'broad-shouldered thick neck',
  'pear-shaped torso',
  'wiry runner build',
  'heavy upper arms',
  'pregnant-looking belly soft curve',
  'bodybuilder thick traps',
];

const FACE_SHAPES = [
  'long horse-like face',
  'round moon face',
  'square jaw that dominates',
  'weak chin tucked back',
  'sharp triangular chin',
  'wide cheekbones with hollow temples',
  'puffy cheeks',
  'asymmetric jaw from old break',
  'heart-shaped face wide forehead',
  'long philtrum and narrow mouth zone',
];

const NOSES = [
  'hooked nose with a bump',
  'tiny upturned nose',
  'wide flattened nose',
  'long narrow nose',
  'bulbous tip',
  'deviated septum crooked bridge',
  'snub nose',
  'button nose too small for the face',
  'nose broken once and healed crooked',
];

const MOUTHS = [
  'thin lips pressed white',
  'full lips chapped and peeling',
  'overbite with a gap tooth',
  'smoker lines around mouth',
  'permanent half-smirk corner',
  'mouth slightly open breathing heavy',
  'tight line hiding a lie',
  'gold tooth glint one canine',
  'braces metal on teeth teen-coded',
  'dentures slightly wrong gum color',
];

const EYES = [
  'small suspicious eyes darting sideways',
  'huge bulging eyes with pin-dot pupils staring straight',
  'heavy-lidded half-sleep eyes that still judge',
  'deep-set eyes under a shelf brow',
  'one eye squinting harder than the other',
  'wet glassy eyes avoiding contact',
  'narrow fox eyes locked on camera',
  'under-eye bags like bruises',
  'hooded monolid eyes',
  'different-sized eyes subtle uncanny valley',
  'one sclera slightly bloodshot',
];

const BROWS = [
  'thick tangled eyebrows',
  'plucked thin 90s brows',
  'one brow permanently raised',
  'furrowed vertical worry lines',
  'shaved scar through one brow',
  'bushy unibrow suggestion center',
  'high arched femme brows drawn sharp',
];

const GLASSES = [
  'no glasses',
  'no glasses',
  'no glasses',
  'heavy black rectangular frames sliding down nose',
  'tiny wire oval granny glasses',
  'round John Lennon wire rims',
  'thick cat-eye frames',
  'sports safety goggles strap on forehead',
  'half-moon reading glasses low on nose',
  'clip-on sunglasses flipped up awkwardly',
  'coke-bottle thick lenses magnifying eyes',
  'monocle on black string Victorian gag',
  'sunglasses hiding half the face indoors',
];

const MASC_FACIAL_HAIR = [
  'clean-shaven but five-o-clock shadow',
  'patchy teenager mustache only',
  'dense lumberjack beard to mid-chest',
  'neat corporate goatee',
  'soul patch only',
  'muttonchops wide and loud',
  'pencil mustache too precise',
  'week-old scruff uneven',
  'chinstrap beard sharp lines',
  'handlebar mustache waxed tips',
];

const FEMME_FACIAL_HAIR = [
  'no facial hair smooth jaw',
  'no facial hair smooth jaw',
  'faint sideburn down-peach fuzz',
  'bleached invisible mustache shadow',
];

const AMBIG_FACIAL_HAIR = [
  'light ambiguous stubble on jaw',
  'smooth jaw ambiguous',
  'peach fuzz upper lip only',
];

const MAKEUP = [
  'no visible makeup',
  'no visible makeup',
  'concealer cake line at jaw mismatch',
  'heavy Instagram contour and highlight',
  'smudged raccoon eyeliner',
  'matte red lipstick feathered cracks',
  'goth black lipstick bleeding corners',
  'drag-level cut crease and huge lashes',
  'mature soft rose blush and thin liner',
  'cheap glitter eyeshadow fallout on cheek',
  'sunburn with foundation color wrong',
  'boy-beat barely-there tinted balm',
];

const SCARS_MARKS = [
  'no big facial scars',
  'no big facial scars',
  'old cheek slash scar white line',
  'cleft lip repair tiny scar under nose',
  'port-wine stain birthmark on one cheek',
  'vitiligo patch on jaw symmetric odd',
  'cluster of moles constellation on cheek',
  'burn scar puckered near ear',
  'acne pitting icepick scars temples',
  'chickenpox pock one cheek',
  'surgical line scar along jaw hidden by stubble',
  'bindi dot OR decorative forehead jewel no text',
];

const PIERCINGS = [
  'no facial piercings',
  'septum ring small silver',
  'labret stud below lip',
  'nostril stud one side',
  'double nostril studs',
  'eyebrow barbell',
  'monroe piercing off-center lip',
  'industrial bar ear only one ear visible',
];

const TEETH = [
  'teeth normal closed mouth',
  'slight overjet buck teeth visible talking',
  'grillz gold glint abstract shapes no letters',
  'missing one lateral incisor gap when grinning',
  'yellow smoker stain visible',
  'perfect veneers uncanny white',
];

const HAIRS = [
  'dyed magenta roots showing dark grow-out',
  'greasy black hair slicked flat',
  'frizzy copper perm gone wrong',
  'severe undercut with long top flop',
  'patchy receding hairline comb-over',
  'white shock hair sticking out',
  'tight cornrows ending in beads',
  'messy bun with broken pencil stuck in',
  'stringy blonde extensions',
  'buzzcut fresh with nicks',
  'natural 4C afro picked out wide',
  'locs mid-back heavy',
  'hijab fabric frame face only',
  'turban cloth wrapped neat',
  'sikh uncut beard long with tied hair bundle',
  'greying temples only rest dyed black',
  'shaved head fresh razor bumps',
];

const SKIN = [
  'ruddy rosacea patches on cheeks',
  'pale almost grey undertone',
  'sunburn peeling on nose',
  'acne scarring along jaw',
  'freckles dense across nose bridge',
  'oily shine on T-zone',
  'dry flaky patch near mouth',
  'stubble shadow even where shaved',
  'deep melanin rich even tone',
  'ashy elbows implied cropped',
  'tattoo neck creeping to jawline abstract shapes no text',
];

const SWEAT = [
  'clean dry skin',
  'beads of sweat at hairline',
  'upper lip sweat mustache',
  'neck damp with nervous perspiration',
  'temple vein pulsing with stress',
];

const TOPS = [
  'faded black tee with stretched collar',
  'tight ribbed tank with pit stains',
  'wrinkled flannel half-buttoned wrong',
  'cheap nylon windbreaker zipped to chin',
  'cropped denim jacket with fray threads',
  'oversized hoodie swallowing neck',
  'stained white chef-style shirt',
  'leopard tube top under open shirt',
  'corporate polo with coffee ring',
  'silk blouse button straining',
  'denim vest over bare shoulders',
  'track jacket shiny polyester',
];

const EXTRA_JEWELRY = [
  'no extra jewelry',
  'chunky resin earrings',
  'thin gold chain tangled in chest hair',
  'safety pin earring',
  'nothing but a cheap digital watch',
  'layered silver chains',
  'choker tight black band',
  'religious pendant abstract shape no text',
];

const SILHOUETTE = [
  'tiny head huge shoulders',
  'big head narrow shoulders',
  'long neck like a suspicious heron',
  'no neck barrel torso',
  'one shoulder higher than the other',
];

function fnv1a(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function pick(arr, id, salt) {
  if (!arr.length) return '';
  return arr[fnv1a(`${id}|${salt}`) % arr.length];
}

function facialHairFor(genderBucket, genPhrase, id) {
  if (genderBucket === 'female') return pick(FEMME_FACIAL_HAIR, id, 'fh1');
  if (genderBucket === 'male') return pick(MASC_FACIAL_HAIR, id, 'fh2');
  if (genderBucket === 'non-binary') return pick(AMBIG_FACIAL_HAIR, id, 'fh3');
  const g = String(genPhrase || '').toLowerCase();
  if (g.includes('woman') || g.includes('femme')) return pick(FEMME_FACIAL_HAIR, id, 'fh1b');
  if (g.includes('masc') || g.includes('man')) return pick(MASC_FACIAL_HAIR, id, 'fh2b');
  return pick(AMBIG_FACIAL_HAIR, id, 'fh3b');
}

/**
 * @param {{ id: string, name: string, bio?: string, themeName?: string }} p
 */
export function buildHyperspecificLook(p) {
  const id = String(p.id || '');
  if (LOOK_OVERRIDES_BY_ID[id]) return LOOK_OVERRIDES_BY_ID[id];

  const name = String(p.name || 'Unknown');
  const bio = String(p.bio || '').slice(0, 160);
  const theme = String(p.themeName || '').trim();

  const genderBucket = inferGenderBucket(name, bio);
  const genderLock = genderLockPrefix(genderBucket);
  const gen = pickGenderPhrase(genderBucket, id);

  const age = pick(AGES, id, 'age');
  const eth = pick(ETHNICITIES, id, 'eth');
  const social = pick(SOCIAL_CUES, id, 'soc');
  const build = pick(BUILDS, id, 'build');
  const face = pick(FACE_SHAPES, id, 'face');
  const nose = pick(NOSES, id, 'nose');
  const mouth = pick(MOUTHS, id, 'mouth');
  const browList = genderBucket === 'female' ? BROWS.filter((b) => !b.includes('unibrow')) : BROWS;
  const brow = pick(browList, id, 'brow');
  const eye = pick(EYES, id, 'eye');
  const nameSteer = extractDisplayNameVisualSteer(name);
  const hair = nameSteer.hair || pick(HAIRS, id, 'hair');
  const top = nameSteer.top || pick(TOPS, id, 'top');
  const glasses = pick(GLASSES, id, 'gl');
  const fh = facialHairFor(genderBucket, gen, id);
  const makeup = pick(MAKEUP, id, 'mk');
  const scar = pick(SCARS_MARKS, id, 'sc');
  const pierce = pick(PIERCINGS, id, 'pi');
  const teeth = pick(TEETH, id, 'te');
  const skin = pick(SKIN, id, 'skin');
  const sweat = pick(SWEAT, id, 'sweat');
  const jewelry = pick(EXTRA_JEWELRY, id, 'jw');
  const sil = pick(SILHOUETTE, id, 'sil');

  const costume = THEME_BUST_COSTUME_CUE[theme] || THEME_BUST_COSTUME_CUE.Default;

  const vibe = bio
    ? `Acting vibe from bio (never render text): ${bio.replace(/"/g, "'")}.`
    : 'Party-game liar energy: shifty confidence.';

  let glassesPhrase = nameSteer.glassesOverride
    ? nameSteer.glassesOverride
    : (glasses === 'no glasses' ? 'No glasses.' : `Eyewear: ${glasses}.`);
  if (nameSteer.neckAccessory) {
    glassesPhrase = `${glassesPhrase} Neck/head gear: ${nameSteer.neckAccessory}.`;
  }

  const expressionSteer = nameSteer.expression ? `Name expression steer: ${nameSteer.expression}. ` : '';

  return [
    `${genderLock}${expressionSteer}${age} ${eth} ${gen}, ${build}; social read: ${social}.`,
    `Face: ${face}; nose: ${nose}; mouth: ${mouth}; brows: ${brow}; eyes: ${eye}. ${glassesPhrase}`,
    `Facial hair: ${fh}. Makeup: ${makeup}. Marks: ${scar}. Piercings: ${pierce}. Teeth: ${teeth}.`,
    `Hair: ${hair}. Skin texture: ${skin}; ${sweat}. Torso clothing: ${top}; other jewelry: ${jewelry}.`,
    `Theme bust costume steer: ${costume}.`,
    `Silhouette quirk: ${sil} — must look like a totally different person from every other roster portrait (unique nose/eyes/jaw age weight).`,
    vibe,
  ].join(' ');
}
