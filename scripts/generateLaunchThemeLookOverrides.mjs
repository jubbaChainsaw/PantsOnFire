#!/usr/bin/env node
/**
 * Builds scripts/data/launchThemeLookOverrides.mjs — one unique hyperspecific bust
 * look per beta-launch persona (Default + core + Cowboys/Wrestlers). Gangsters use
 * hand file gangstersLookOverrides.mjs instead. Barry kept as hand override in
 * personaHyperspecificLook.mjs (generator skips default-barry).
 *
 * Run: node scripts/generateLaunchThemeLookOverrides.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import {
  inferGenderBucket,
  genderLockPrefix,
  THEME_BUST_COSTUME_CUE,
  LOOK_POOLS,
  pickForPersona,
} from './personaHyperspecificLook.mjs';
import { GANGSTERS_LOOK_OVERRIDES_BY_ID } from './data/gangstersLookOverrides.mjs';

const require = createRequire(import.meta.url);
const { extractDisplayNameVisualSteer, formatNameVisualMandateBlock } = require('./personaNameVisualCues.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const LAUNCH_THEMES = [
  'Default',
  'Murder Mystery',
  'Pirates',
  'Cops and Robbers',
  'Ghosts and Ghouls',
  'Cowboys',
  'Wrestlers',
];

const SKIP_IDS = new Set([
  'default-barry-side-eye-collins',
  ...Object.keys(GANGSTERS_LOOK_OVERRIDES_BY_ID),
]);

/** One roster-unique bust prop or face quirk per slot (index order). */
const THEME_SIGNATURE_HOOKS = {
  Default: [
    'disposable coffee cup crushed at chest, logo blank',
    'two tiny checklist tick marks on wrist band abstract',
    'oversized glasses sliding down a long nose',
    'mullet silhouette visible at nape under cap',
    'leopard-print collar roaring at the clavicle',
    'forehead vein pulsing mid-overthink',
    'twin space buns with mismatched hair ties',
    'generic battery-shaped lapel pin no text',
    'head turned five degrees glancing back',
    'band-aid on cheek from probably-fine energy',
    'chunky over-ear headphones dominating the ears',
    'loud pink faux-fur collar impossible to miss',
    'stone-flat mouth and dead calm eyes',
    'crow-feet deep from seen-it-all stare',
    'muttering downturned lip corner',
    'bright cartoon-green hair at the hairline',
    'notebook corner peeking from jacket pocket no writing',
    'finger near lips mid-whisper inside bust crop',
    'wide alert eyes without moving the head',
    'razor-clean hair part and stiff collar',
    'backwards baseball cap brim pointing rear',
    'bright red blazer lapels framing the chin',
    'vintage waistcoat watch chain no numbers',
    'neon highlighter clipped to pocket',
    'crooked collar half-tucked panic',
    'colorful sticker patches on jacket no words',
    'blank phone-shaped prop at lapel secretive smirk',
    'chess-piece lapel pin generic shape',
    'lopsided smile one eye squinting harder',
    'notification-dot badge on jacket no UI',
    'too-wide grin with intense eye contact',
    'dramatic scarf knot theatrical brow',
    'folded paper corner in pocket no text',
    'tangled earbud knot at the neck',
    'rapid-talking open mouth mid-word',
    'poker-face micro-smirk cold eyes',
    'pedantic pointing finger at own chest',
    'subtle smirk guarded eyes',
    'split-dye hair hot pink and black halves',
    'nose ring and chipped black nail polish',
    'Bluetooth earpiece always in one ear',
    'lint roller fuzz on sleeve shoulder',
    'ring light reflection circle in both pupils',
    'crooked tie clip shaped like a question mark abstract',
    'half-empty energy drink can at bust edge no brand',
    'two mismatched earrings one hoop one stud',
    'faint barcode tattoo on neck abstract no numbers',
    'scrunchie on wrist doubled thick',
    'metallic dental retainer glint when mouth opens',
    'paint smear on cheek from hobby night',
    'dog-eared paperback tucked in waistband spine blank',
  ],
  'Murder Mystery': [
    'pearl choker and cameo brooch at throat',
    'monocle on black cord Victorian',
    'moth-eaten tweed lapel with elbow patches',
    'lace mourning collar high and stiff',
    'clergyman collar white tab',
    'feathered fascinator hat brim cutting frame top',
    'cigarette holder unlit between fingers',
    'magnifying glass handle at chest edge',
    'bloodless porcelain makeup and dark lipstick',
    'pocket watch chain no readable face',
    'fox-fur stole abstract shape at shoulders',
    'ink-stained fingers from letter writing',
    'opera glasses on ribbon around neck',
    'riding crop prop vertical at shoulder',
    'servant bell on chain at waist hint',
    'tea cup trembling at bust line no saucer text',
    'gloves white cotton buttoned tight',
    'police whistle on chain blank badge nearby',
    'typewriter key brooch abstract',
    'poison bottle silhouette prop green glass no label',
    'candelabra wax drip on lapel abstract',
    'will envelope sealed red wax blob no words',
    'chess knight cufflink',
    'rain-soaked trench collar popped',
    'heirloom locket oval at chest closed',
  ],
  Pirates: [
    'gold hoop earring oversized one ear',
    'eyepatch leather strap empty socket implied',
    'parrot feather tucked behind ear cartoon',
    'hook hand replaced with cup hook shape at chest crop',
    'tricorn hat shadow on brow',
    'rope burn scar on cheek white line',
    'tattoo anchor on neck abstract no text',
    'wooden leg suggestion only as peg-top prop at frame bottom edge',
    'rum bottle neck at sash no label',
    'compass locket open no numbers readable',
    'kraken tentacle brooch purple',
    'shark tooth on leather cord',
    'bandana skull pattern abstract no letters',
    'powder monkey soot smudge on forehead',
    'navigator sextant at chest',
    'coral ear cuff green',
    'barnacle crust on shoulder pauldron',
    'mermaid scale makeup on cheekbone',
    'flintlock pistol handle in sash no barrel toward camera',
    'treasure map corner rolled no writing',
    'peg-leg sailor whistle on string',
    'storm cloud bruise under one eye purple-yellow',
    'kelp strand in hair green',
    'cannon fuse spark prop safe cartoon',
    'jolly roger flag fold at shoulder abstract bones only',
  ],
  'Cops and Robbers': [
    'police cap badge shape blank metal',
    'handcuffs dangling from belt hook one cuff open',
    'radio mic nub at shoulder',
    'robber ski mask pushed up on forehead',
    'striped prisoner shirt under open jacket',
    'donut powder on uniform lapel joke subtle',
    'siren light reflection red-blue on cheek abstract',
    'mugshot height chart lines behind shoulders abstract',
    'evidence bag corner at chest no text',
    'nightstick handle at belt',
    'detective trench gum chewed',
    'SWAT earpiece coiled',
    'speed trap radar gun shape no numbers',
    'K-9 leash clip on belt',
    'riot shield edge reflection',
    'cash band bundle in jacket no denominations',
    'balaclava rolled at neck',
    'sirens bruise shadow red-blue on jaw',
    'ticket pad stub in pocket no writing',
    'fingerprint ink on thumb visible',
    'body cam rectangle on chest blank',
    'shoplifter coat hanger wire peeking',
    'squad car keyring chunky',
    'polygraph wire dots on fingers abstract',
    'jail bars shadow across face abstract',
  ],
  'Ghosts and Ghouls': [
    'stitches across forehead cartoon',
    'ectoplasm drip green from chin',
    'sheet ghost eyeholes cut rough',
    'coffin nail through lapel abstract',
    'bat wing collar points',
    'pumpkin orange under-eye makeup',
    'chain rattle ghost shackles at wrist',
    'widow peak hair sharp vampire',
    'fangs subtle not gory two canines',
    'grave dirt smear on cheek',
    'lantern jaw prop iron',
    'spider on shoulder hairy cartoon',
    'skull face paint half and half',
    'wraith smoke tendril from shoulder',
    'cobweb in hair corner',
    'tombstone shape brooch grey',
    'ouija planchette necklace abstract no letters',
    'black candles wax drip on collar',
    'zombie skin grey-green patch one cheek',
    'witch hat brim cut by frame',
    'possessed eye glow one iris pale',
    'mummy bandage wrap at jaw',
    'spectral transparency hint at ear edge cel style',
    'raven feather in lapel',
    'jack-o-lantern grin makeup orange',
  ],
  Cowboys: [
    'cowboy hat sweat ring inside brim',
    'bandana red over nose half-down',
    'spurs on collar hint metal stars',
    'lasso coil at shoulder rope',
    'wanted poster corner in pocket no text',
    'cactus needle in hatband green',
    'whiskey flask silver at hip',
    'horse brush bristles in vest pocket',
    'sheriff star six-point blank',
    'duster coat sand on shoulders',
    'tobacco chew bulge cheek subtle',
    'boot spur row at frame bottom edge only',
    'harmonica at chest on chain',
    'rattlesnake belt buckle abstract',
    'sunburn nose peeling',
    'braided horsehair hatband',
    'tin cup coffee at bust',
    'lariat burn on palm implied cropped',
    'cattle brand iron scar on neck abstract shape no letters',
    'saloon piano key tie pin',
    'dust storm grit on lashes',
    'poncho stripe blanket shoulder',
    'bison fur collar shaggy',
    'six-shooter holster flap open empty',
    'cactus flower tucked behind ear yellow',
  ],
  Wrestlers: [
    'face paint stripe across eyes red',
    'championship belt buckle gold abstract no text',
    'sweat band neon on forehead',
    'microphone cord at neck',
    'knee brace visible at frame bottom edge',
    'mask luchador half-up on head',
    'spandex singlet strap one side',
    'bleach blonde flat-top wide',
    'muscle oil sheen on shoulders',
    'taped wrist wraps thick',
    'sequin cape collar sparkle',
    'broken folding chair splinter prop at shoulder joke',
    'referee striped shirt collar',
    'heel turn smirk scar through brow',
    'babyface sparkle in teeth grin',
    'tattoo tribal arm creeping to neck abstract',
    'knee pad foam one side',
    'elbow pad red',
    'mouth guard neon between teeth',
    'sweat spray droplets cel style',
    'ring rope burn on back of neck',
    'manager dollar bills in fist no numbers',
    'tag-team armband blank',
    'chain mail shoulder pad costume',
    'pyro smoke puff behind head abstract orange',
  ],
};

function facialHairForBucket(bucket, id) {
  if (bucket === 'female') return pickForPersona(LOOK_POOLS.FEMME_FACIAL_HAIR, id, 11);
  if (bucket === 'male') return pickForPersona(LOOK_POOLS.MASC_FACIAL_HAIR, id, 12);
  if (bucket === 'non-binary') return pickForPersona(LOOK_POOLS.AMBIG_FACIAL_HAIR, id, 13);
  return pickForPersona(LOOK_POOLS.AMBIG_FACIAL_HAIR, id, 14);
}

function genderNoun(bucket) {
  if (bucket === 'female') return 'woman';
  if (bucket === 'male') return 'man';
  if (bucket === 'non-binary') return 'non-binary-presenting person';
  return 'person';
}

function signatureKey(look) {
  return String(look || '')
    .toLowerCase()
    .replace(/gender lock[^.]*\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .slice(0, 14)
    .join('|');
}

function buildLook(persona, themeName, index) {
  const { id, name, bio } = persona;
  const genderBucket = inferGenderBucket(name, bio);
  const genderLock = genderLockPrefix(genderBucket);
  const noun = genderNoun(genderBucket);

  const age = pickForPersona(LOOK_POOLS.AGES, id, 1);
  const eth = pickForPersona(LOOK_POOLS.ETHNICITIES, id, 2);
  const social = pickForPersona(LOOK_POOLS.SOCIAL_CUES, id, 3);
  const build = pickForPersona(LOOK_POOLS.BUILDS, id, 4);
  const face = pickForPersona(LOOK_POOLS.FACE_SHAPES, id, 5);
  const nose = pickForPersona(LOOK_POOLS.NOSES, id, 6);
  const mouth = pickForPersona(LOOK_POOLS.MOUTHS, id, 7);
  const browList =
    genderBucket === 'female'
      ? LOOK_POOLS.BROWS.filter((b) => !b.includes('unibrow'))
      : LOOK_POOLS.BROWS;
  const brow = pickForPersona(browList, id, 8);
  const eye = pickForPersona(LOOK_POOLS.EYES, id, 9);
  const nameSteer = extractDisplayNameVisualSteer(name);
  const hair = nameSteer.hair || pickForPersona(LOOK_POOLS.HAIRS, id, 10);
  const top = nameSteer.top || pickForPersona(LOOK_POOLS.TOPS, id, 15);
  const glassesRaw = pickForPersona(LOOK_POOLS.GLASSES, id, 16);
  const fh = facialHairForBucket(genderBucket, id);
  const makeup = pickForPersona(LOOK_POOLS.MAKEUP, id, 17);
  const scar = pickForPersona(LOOK_POOLS.SCARS_MARKS, id, 18);
  const pierce = pickForPersona(LOOK_POOLS.PIERCINGS, id, 19);
  const teeth = pickForPersona(LOOK_POOLS.TEETH, id, 20);
  const skin = pickForPersona(LOOK_POOLS.SKIN, id, 21);
  const sweat = pickForPersona(LOOK_POOLS.SWEAT, id, 22);
  const jewelry = pickForPersona(LOOK_POOLS.EXTRA_JEWELRY, id, 23);
  const sil = pickForPersona(LOOK_POOLS.SILHOUETTE, id, 24);

  const hooks = THEME_SIGNATURE_HOOKS[themeName] || THEME_SIGNATURE_HOOKS.Default;
  const signatureHook = hooks[index % hooks.length];

  const costume = THEME_BUST_COSTUME_CUE[themeName] || THEME_BUST_COSTUME_CUE.Default;
  const mandate = formatNameVisualMandateBlock(name);
  const vibe = bio
    ? `Acting vibe from bio (never render text): ${String(bio).replace(/"/g, "'").slice(0, 140)}.`
    : 'Party-game liar energy: shifty confidence.';

  let glassesPhrase = nameSteer.glassesOverride
    ? nameSteer.glassesOverride
    : glassesRaw === 'no glasses'
      ? 'No glasses.'
      : `Eyewear: ${glassesRaw}.`;
  if (nameSteer.neckAccessory) {
    glassesPhrase = `${glassesPhrase} Neck/head gear: ${nameSteer.neckAccessory}.`;
  }

  const expressionSteer = nameSteer.expression ? `Expression: ${nameSteer.expression}. ` : '';
  const mandateBlock = mandate ? `${mandate} ` : '';

  return [
    `${genderLock}${mandateBlock}${expressionSteer}${age} ${eth} adult human ${noun}, ${build}; social read: ${social}.`,
    `Face: ${face}; nose: ${nose}; mouth: ${mouth}; brows: ${brow}; eyes: ${eye}. ${glassesPhrase}`,
    `Facial hair: ${fh}. Makeup: ${makeup}. Marks: ${scar}. Piercings: ${pierce}. Teeth: ${teeth}.`,
    `Hair: ${hair}. Skin texture: ${skin}; ${sweat}. Torso clothing: ${top}; other jewelry: ${jewelry}.`,
    `Roster-unique signature (must be visible): ${signatureHook}.`,
    `Theme bust costume steer: ${costume}.`,
    `Silhouette quirk: ${sil} — must look like a totally different person from every other portrait in this theme (unique nose/eyes/jaw/age/weight).`,
    vibe,
  ].join(' ');
}

function escapeForModuleString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function main() {
  const personasMod = await import(
    pathToFileURL(path.join(repoRoot, 'src', 'data', 'themePersonas.js')).href
  );
  const { getThemePersonas } = personasMod;

  const overrides = {};
  const usedSigsByTheme = {};

  for (const themeName of LAUNCH_THEMES) {
    const personas = [...(getThemePersonas(themeName) || [])].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    );
    usedSigsByTheme[themeName] = new Set();

    personas.forEach((persona, index) => {
      const id = String(persona.id || '').trim();
      if (!id || SKIP_IDS.has(id)) return;

      let look = buildLook(persona, themeName, index);
      let sig = signatureKey(look);
      let bump = 0;
      while (usedSigsByTheme[themeName].has(sig) && bump < 12) {
        bump += 1;
        look = `${look} Distinctive variation ${bump}: ${pickForPersona(LOOK_POOLS.EYES, id, 40 + bump)}.`;
        sig = signatureKey(look);
      }
      usedSigsByTheme[themeName].add(sig);
      overrides[id] = look;
    });
  }

  const lines = [
    '/**',
    ' * Auto-generated unique hyperspecific bust looks for beta-launch themes.',
    ' * Regenerate: node scripts/generateLaunchThemeLookOverrides.mjs',
    ' * Gangsters: hand-authored in gangstersLookOverrides.mjs',
    ' * Barry: hand override in personaHyperspecificLook.mjs',
    ' */',
    '',
    `export const LAUNCH_THEME_LOOK_OVERRIDES_BY_ID = {`,
  ];

  for (const [id, look] of Object.entries(overrides).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  '${escapeForModuleString(id)}':`);
    lines.push(`    '${escapeForModuleString(look)}',`);
  }
  lines.push('};');
  lines.push('');

  const outPath = path.join(repoRoot, 'scripts', 'data', 'launchThemeLookOverrides.mjs');
  fs.writeFileSync(outPath, `${lines.join('\n')}`, 'utf8');

  const counts = LAUNCH_THEMES.map((t) => {
    const n = (getThemePersonas(t) || []).filter((p) => overrides[p.id]).length;
    return `${t}: ${n}`;
  });
  console.log(`[generateLaunchThemeLookOverrides] Wrote ${Object.keys(overrides).length} overrides → ${outPath}`);
  console.log(counts.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
