/**
 * Maps roster display names to mandatory bust-visible visual cues.
 * Shared by personaHyperspecificLook.mjs (tailored JSON) and exportPersonaAvatarPrompts.cjs (exports).
 */

/** @typedef {{ re: RegExp, mandate: string, hair?: string, top?: string, neckAccessory?: string, expression?: string }} VisualRule */

/** Order: more specific phrases before loose substrings where it matters. */
const VISUAL_RULES = /** @type {VisualRule[]} */ ([
  { re: /pink[-\s]?fur|fur[-\s]?pink/i, mandate: 'Loud pink faux-fur or pink fur trim must read clearly on the bust (collar, jacket edge, or vest).', top: 'unmistakable pink faux-fur collar or pink fur trim across chest/shoulders' },
  { re: /headphones/i, mandate: 'Large over-ear headphones must be visible on the head or chunky around the neck (not tiny in-ear buds only).', neckAccessory: 'big padded headphones on ears or clearly looped around neck' },
  { re: /leopard|leopardprint|leopard-print/i, mandate: 'Leopard or big-cat spot print must show on an upper-body garment (shirt, jacket, or collar).', top: 'leopard-print fabric on torso—rosettes/spots clearly readable' },
  { re: /mullet/i, mandate: 'A mullet haircut must be obvious (shorter on top/sides, longer party length in back).', hair: 'clear mullet silhouette—business in front, length visible down the nape' },
  { re: /two[-\s]?buns|twobuns/i, mandate: 'Two distinct hair buns (space buns or messy twin buns) visible on the crown.', hair: 'two obvious hair buns stacked or symmetrical on top of head' },
  { re: /green[-\s]?hair|greenhair/i, mandate: 'Hair must be dyed or styled bright green, visible at the hairline or full head.', hair: 'bright cartoon-green hair color clearly visible' },
  { re: /backwards[-\s]?cap/i, mandate: 'A baseball cap worn backwards, brim to the back, visible on head.', hair: 'backwards baseball cap on head with brim pointing backward' },
  { re: /\bred[-\s]?blazer/i, mandate: 'A red blazer or suit jacket must show at the bust.', top: 'bright red blazer lapels or red suit jacket clearly on torso' },
  { re: /stoneface/i, mandate: 'Face reads stony, flat, unreadable—heavy lid, rigid jaw.', expression: 'blank stone-cold expression, minimal mouth movement' },
  { re: /nightshift/i, mandate: 'Tired night-shift energy: eye bags, maybe a disposable cup at chest height.', expression: 'heavy under-eye bags, exhausted stare', top: 'optional battered paper coffee cup tucked at chest inside bust crop' },
  { re: /double[-\s]?check/i, mandate: 'Tiny checklist tick marks suggested on skin or wrist band (abstract, no readable text).', top: 'two small tick-mark shapes tattooed or drawn on one wrist' },
  { re: /not\s+impressed|not-impressed/i, mandate: 'Visibly unimpressed face: downturned mouth, skeptical eyes.', expression: 'deep frown, unimpressed narrowed eyes' },
  { re: /overthink/i, mandate: 'Anxious overthinker brow: tense forehead, maybe bitten nails at chest.', expression: 'tense forehead wrinkles, worried eyes', top: 'fingers with bitten nails visible at lower edge of bust if natural' },
  { re: /low[-\s]?battery/i, mandate: 'Droopy tired eyelids; optional tiny generic battery-shaped pin (no text).', expression: 'exhausted drooping eyelids' },
  { re: /glance[-\s]?back/i, mandate: 'Head slightly turned as if glancing back while eyes still engage camera.', expression: 'head slightly angled, eyes still toward viewer' },
  { re: /probably\s+fine|probably-fine/i, mandate: 'Forced smile with nervous tell (e.g. small plaster, tight eyes).', expression: 'forced grin, anxious tight eyes' },
  { re: /\bspecs\b|penny\s+specs/i, mandate: 'Noticeable eyeglasses with visible frames (not contacts).', },
  { re: /side[-\s]?eye/i, mandate: 'Side-eye body language: eyes cutting sideways, one brow cocked.', expression: 'sideways-cut eyes, one eyebrow raised suspiciously' },
  { re: /seen\s+it\s+all|seen-it-all/i, mandate: 'World-weary eyes and knowing, flat stare.', expression: 'heavy tired lids, knowing flat stare' },
  { re: /grumble/i, mandate: 'Grumbling mouth shape, heavy brow.', expression: 'muttering downturned mouth, heavy brow' },
  { re: /watchful/i, mandate: 'Wide alert eyes with small crow’s-feet.', expression: 'wide watchful eyes, tense alert stare' },
  { re: /precision/i, mandate: 'Neat razor-sharp haircut and tidy collar.', hair: 'neat precise haircut with clean geometric line', top: 'crisp tidy collar, controlled neckline' },
  { re: /just\s+curious|just-curious/i, mandate: 'Inquisitive leaning-in eyes and raised brow.', expression: 'leaning-in curious eyes, one brow lifted' },
  { re: /side[-\s]?whisper/i, mandate: 'One finger near lips in a shush pose inside the bust crop.', expression: 'secretive finger-near-lips gesture inside frame' },
  { re: /old\s+tricks|old-tricks/i, mandate: 'Older sly face with vintage waistcoat or old-fashioned collar.', expression: 'older sly wrinkles, knowing smirk', top: 'vintage waistcoat or retro high collar suggestion' },
  { re: /highlighter/i, mandate: 'Neon highlighter marker clipped to pocket or visible in hand at chest.', top: 'chunky neon highlighter pen clipped to jacket pocket' },
  { re: /last[-\s]?minute/i, mandate: 'Rushed look: messy hair, crooked collar.', hair: 'messy rushed hair', top: 'crooked half-fixed collar' },
  { re: /sticker/i, mandate: 'Small abstract sticker patches on jacket (no readable words).', top: 'a few small colorful sticker shapes on jacket fabric' },
  { re: /soft\s+launch|soft-launch/i, mandate: 'Phone-shaped lapel object and secretive smirk (screen blank, no UI text).', top: 'blank phone-shaped prop pinned at lapel', expression: 'secretive smirk' },
  { re: /checkmate/i, mandate: 'Chess-piece lapel pin (generic piece shape, no board text).', top: 'chess-piece shaped lapel pin' },
  { re: /half\s+truths|half-truths/i, mandate: 'Asymmetric smile: one side of mouth lifted, one eye squinting.', expression: 'lopsided smile, one squinting eye' },
  { re: /late\s+reply|late-reply/i, mandate: 'Tired eyes; optional blank notification-dot badge on jacket.', expression: 'tired irritated eyes' },
  { re: /overfriendly/i, mandate: 'Too-wide grin with intense eye contact.', expression: 'overwide grin, uncomfortably intense eye contact' },
  { re: /plot\s+twist|plot-twist/i, mandate: 'Theatrical raised brow and dramatic collar or scarf.', expression: 'dramatic raised eyebrow', top: 'theatrical wide collar or scarf knot' },
  { re: /pocket\s+alibi|pocket-alibi/i, mandate: 'Folded paper corner peeking from jacket pocket (no writing).', top: 'corner of folded paper peeking from pocket' },
  { re: /crossed\s+wires|crossed-wires/i, mandate: 'Tangled earbud or cable mess at neck or one visible knot of wires.', neckAccessory: 'tangled headphone wires or messy cable loop at neck' },
  { re: /fast\s+talk|fast-talk/i, mandate: 'Mouth mid-rapid-talk shape, animated jaw.', expression: 'rapid-talking animated mouth shape' },
  { re: /cold\s+read|cold-read/i, mandate: 'Poker-face micro-smirk, dead calm eyes.', expression: 'poker face, unnerving calm eyes' },
  { re: /too\s+specific|too-specific/i, mandate: 'Over-explaining hand gesture at chest, intense detail-oriented stare.', expression: 'intense pedantic stare' },
  { re: /soft\s+smirk|soft-smirk/i, mandate: 'Small controlled smirk, guarded eyes.', expression: 'subtle smirk, guarded eyes' },
]);

/**
 * @param {string} displayName
 * @returns {{ mandateLines: string[], hair: string | null, top: string | null, neckAccessory: string | null, expression: string | null, glassesOverride: string | null }}
 */
function extractDisplayNameVisualSteer(displayName) {
  const raw = String(displayName || '').trim();
  const mandateLines = [];
  let hair = null;
  let top = null;
  let neckAccessory = null;
  let expression = null;

  if (!raw) {
    return {
      mandateLines: [],
      hair: null,
      top: null,
      neckAccessory: null,
      expression: null,
      glassesOverride: null,
    };
  }

  for (const rule of VISUAL_RULES) {
    if (rule.re.test(raw)) {
      mandateLines.push(rule.mandate);
      if (rule.hair) hair = hair ? `${hair}; ${rule.hair}` : rule.hair;
      if (rule.top) top = top ? `${top}; ${rule.top}` : rule.top;
      if (rule.neckAccessory) neckAccessory = rule.neckAccessory;
      if (rule.expression) expression = expression ? `${expression}; ${rule.expression}` : rule.expression;
    }
  }

  let glassesOverride = null;
  if (/headphones/i.test(raw)) {
    glassesOverride = 'Eyewear: no bulky spectacles that cover the ear cups—prefer no glasses or very thin wire frames so the headphones stay obvious.';
  } else if (/\bspecs\b/i.test(raw) || /penny\s+specs/i.test(raw)) {
    glassesOverride = 'Eyewear: thick-framed spectacles required—large obvious lenses and frames (not contacts).';
  }

  return {
    mandateLines,
    hair,
    top,
    neckAccessory,
    expression,
    glassesOverride,
  };
}

/**
 * One block for avatar prompts (export + optional logging).
 * @param {string} displayName
 */
function formatNameVisualMandateBlock(displayName) {
  const steer = extractDisplayNameVisualSteer(displayName);
  if (!steer.mandateLines.length) return '';
  return (
    'TITLE COSTUME MANDATE (NON-NEGOTIABLE): The roster display name is a costume brief—'
    + 'the bust MUST visibly show every cue below; do not substitute unrelated hair, clothing, or props. '
    + steer.mandateLines.join(' ')
  );
}

module.exports = {
  VISUAL_RULES,
  extractDisplayNameVisualSteer,
  formatNameVisualMandateBlock,
};
