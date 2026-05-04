#!/usr/bin/env node
/**
 * Batch-generate Pants on Fire themed host stills via OpenAI Images Edit (gpt-image-*).
 *
 * Uses two local reference images on every request:
 *   1) Your face/likeness (--face) — identity anchor
 *   2) Art style + composition reference (--style) — e.g. 90s MTV adult animation look, full-body centered
 *
 * Docs: https://platform.openai.com/docs/guides/image-generation
 * Cookbook (multi-image edit): https://cookbook.openai.com/examples/generate_images_with_gpt_image
 *
 * Usage:
 *   export OPENAI_API_KEY=sk-...
 *   node scripts/generateOpenAiThemeHostImages.cjs \
 *     --face ./refs/me.jpg \
 *     --style ./refs/style-reference.png \
 *     --out-dir ./exports/generated-host-stills
 *
 * Options: --model, --size, --quality, --input-fidelity, --only-theme, --delay-ms, --dry-run, --overwrite, --api-key
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const localKeysPath = path.join(__dirname, 'royaltyFreeApiKeys.local.json');

/** Must match keys in src/data/themeHosts.js THEME_HOST_PERSONAS (plus GrillEm for assets). */
const THEME_SPECS = [
  {
    id: 'Default',
    costume: 'Flashy game-show host: purple sequined blazer with black lapels over a black t-shirt, black trousers; rock-and-roll showmanship.',
    environment:
      'Behind the host: a high-energy TV game studio with neon pink and cyan stage lighting, glowing floor rings, bokeh lights, monitors, and a large readable "PANTS ON FIRE!" logo treatment with a subtitle ribbon "FIND THE LIAR" and a magnifying-glass motif (original game branding, not a real network logo).',
    prop: 'Classic handheld stage microphone (black and gold), held near chest, ready to speak.',
  },
  {
    id: 'Pirates',
    costume: 'Captain-style pirate coat, tricorn or bandana, sash, boots, subtle treasure-map flair; still reads as a costume, not historical documentary.',
    environment: 'Wooden pirate ship deck at sea: rigging, ropes, horizon, cannon crates, Jolly Roger hint in distance.',
    prop: 'Brass handheld telescope, held confidently.',
  },
  {
    id: 'Murder Mystery',
    costume: 'Victorian or 1920s detective dinner-party host: dinner jacket or tweed, pocket watch chain optional.',
    environment: 'Dim candlelit manor drawing room or library: velvet drapes, grandfather clock, clues on side table, foggy window.',
    prop: 'Magnifying glass or slim evidence envelope, held toward camera.',
  },
  {
    id: 'Cops and Robbers',
    costume: 'Noir police detective or slick undercover look: trench coat or police blues stylized for TV.',
    environment: 'City street at night with police tape, wet asphalt reflections, distant sirens feel.',
    prop: 'Police notepad and pencil, or a detective badge wallet opened toward camera.',
  },
  {
    id: 'Spies',
    costume: 'Sharp black tactical suit or tux-with-earpiece spy-fi cliché played for laughs.',
    environment: 'High-tech briefing room with wall-sized maps, redacted documents, cool blue uplighting.',
    prop: 'Slim black fountain pen "gadget" or mini binoculars.',
  },
  {
    id: 'Cowboys',
    costume: 'Classic western: cowboy hat, vest, neckerchief, boots, sheriff or rancher vibe.',
    environment: 'Old western saloon interior: wooden bar, swinging doors silhouette, wanted posters, warm lantern light.',
    prop: 'Vintage six-shooter revolver, held down at side barrel pointed safely away (prop styling, not graphic violence).',
  },
  {
    id: 'Gangsters',
    costume: '1920s–30s mob boss: pinstripe suit, fedora, pocket square.',
    environment: 'Speakeasy back room: velvet booth, low ceiling, jazz-club haze, bottles on shelf.',
    prop: 'Cigar in one hand (unlit, cartoon exaggeration) or a violin case hinted as "business".',
  },
  {
    id: 'Ghosts and Ghouls',
    costume: 'Spooky host: torn Victorian coat edges, subtle cobwebs on shoulders, slightly desaturated makeup.',
    environment: 'Foggy graveyard at night: crooked tombstones, iron gates, twisted trees, pale moon.',
    prop: 'A single large cartoon bone held like a microphone substitute.',
  },
  {
    id: 'Monsters',
    costume: 'Mad-scientist lab assistant or classic horror host cape with high collar.',
    environment: 'Frankenstein-style laboratory: lightning through skylight, bubbling flasks, heavy shadows.',
    prop: 'A chunky glass beaker with glowing green liquid.',
  },
  {
    id: 'Rock Stars',
    costume: 'Arena rock frontman: leather, studs, band tee, aviators optional over glasses.',
    environment: 'Concert stage wings: stacked amps, truss lights, crowd silhouettes as colored bokeh.',
    prop: 'Mic stand top or wireless mic held high in showy pose.',
  },
  {
    id: 'Flying Squad',
    costume: 'RAF-inspired flight suit or bomber jacket with patches, flight gloves tucked in belt.',
    environment: 'Hangar or runway at dusk: fighter jet silhouette, runway lights, mission-board blur behind.',
    prop: 'Flight helmet tucked under arm OR aviation clipboard with checklist.',
  },
  {
    id: 'Drag Queens',
    costume: 'Runway-level glam: sequins, big hair integration with mullet fade, dramatic lashes behind glasses for comedy.',
    environment: 'Drag stage with velvet curtain, follow-spots, glitter haze.',
    prop: 'Long feather boa draped over arm plus a rhinestone handheld mic.',
  },
  {
    id: 'Superheroes',
    costume: 'Caped hero parody: bright emblem chest shape (generic lightning bolt, not a real franchise logo), boots, gauntlets.',
    environment: 'Rooftop skyline sunset with searchlight beams.',
    prop: 'Glowing "power orb" prop in palm (generic sci-fi toy look).',
  },
  {
    id: 'Aliens',
    costume: 'Silver jumpsuit with hose details, glowing trim, slightly oversized collar.',
    environment: 'UFO interior: circular windows to starfield, holographic console glow on face.',
    prop: 'Alien ray gun toy with oversized retro fins.',
  },
  {
    id: 'Medical',
    costume: 'Scrubs with stethoscope, OR cap, ID badge blur.',
    environment: 'Clean hospital corridor with soft greenish fluorescent light, gurney silhouette.',
    prop: 'Stethoscope held toward camera like a host prop.',
  },
  {
    id: 'Royalty',
    costume: 'Regal cape and crown-adjacent circlet, medals, epaulettes; slightly pompous.',
    environment: 'Palace throne room: red carpet, pillars, banners, chandelier.',
    prop: 'Ceremonial scepter or rolled parchment decree.',
  },
  {
    id: 'Wrestlers',
    costume: 'Over-the-top wrestling gear: championship belt across chest, knee pads, face paint smear optional.',
    environment: 'Arena tunnel with LED boards and cheering crowd bokeh.',
    prop: 'Chunky wrestling microphone with tassel windscreen.',
  },
  {
    id: 'Cyberpunk',
    costume: 'Neon street jacket, tech goggles pushed up on forehead over normal glasses, glowing seams.',
    environment: 'Rainy cyberpunk alley: holographic ads, steam vents, motorcycle silhouette.',
    prop: 'Cyberdeck handheld gadget with chunky antenna.',
  },
  {
    id: 'Vikings',
    costume: 'Fur-trimmed leather, braided accents in beard area, round shield on back strap.',
    environment: 'Longship deck: dragon prow, misty fjord, oars stacked.',
    prop: 'Drinking horn or hand axe held flat toward camera (stylized prop).',
  },
  {
    id: 'Ninjas',
    costume: 'Black shinobi wraps with subtle armor plates, mask hanging loose around neck to keep face visible.',
    environment: 'Moonlit dojo courtyard: paper lanterns, bamboo, koi pond edge.',
    prop: 'Shuriken held between fingers in playful "host" pose (obviously blunt toy styling).',
  },
  {
    id: 'Detectives Noir',
    costume: 'Fedora, trench coat, loosened tie, five-o-clock shadow under beard.',
    environment: 'Rain-soaked noir alley: brick wall, flickering neon, venetian blind shadows.',
    prop: 'Vintage flash camera or voice recorder.',
  },
  {
    id: 'Mythology (Gods & Legends)',
    costume: 'Greek-inspired draped chiton with gold leaf accessories, laurel hints.',
    environment: 'Temple ruins at sunset: marble columns, olive trees, distant mountains.',
    prop: 'Lightning-bolt scepter prop or golden scroll.',
  },
  {
    id: 'Post-Apocalypse',
    costume: 'Scrap armor: goggles on neck, patched leather, dust scarves.',
    environment: 'Wasteland camp: rusted vehicles, sandstorm sky, warning signs.',
    prop: 'Retro-futuristic scanner wand or canteen.',
  },
  {
    id: 'Carnival',
    costume: 'Ringmaster tailcoat, top hat, stripes, exaggerated bow tie.',
    environment: 'Big top interior: red and white tent peaks, pennants, popcorn machine glow.',
    prop: 'Candy-striped cane.',
  },
  {
    id: 'Wizards & Witches',
    costume: 'Robes with star patterns, pointed hat tipped back so hair still reads.',
    environment: 'Arcane library tower: floating candles, glowing sigils on floor, stacks of books.',
    prop: 'Carved wooden wand with obvious "stage magic" star tip.',
  },
  {
    id: 'Time Travelers',
    costume: 'Anachronism mashup: Victorian coat over sci-fi harness, pocket watch glowing.',
    environment: 'Chrono portal chamber: swirling clock faces, gear motifs, blue energy ring.',
    prop: 'Glowing pocket watch on chain, held forward.',
  },
  {
    id: 'Gladiators',
    costume: 'Leather pteruges, pauldron one-shoulder, laurel or helm under arm.',
    environment: 'Colosseum sand floor with crowd blur, sun shafts, gate shadows.',
    prop: 'Wooden training sword gladius prop, held vertically.',
  },
  {
    id: 'GrillEm',
    costume: 'BBQ pitmaster: apron with flame patches, bandana, tongs on belt.',
    environment: 'Backyard competition cook-off: smokers, picnic tables, string lights.',
    prop: 'Big metal grilling tongs raised like a host baton.',
  },
];

const STYLE_AND_LAYOUT_BLOCK = `
IMAGE INPUTS (in multipart order):
- First uploaded image: face/likeness reference — preserve recognizable facial identity.
- Second uploaded image: style and composition reference — match its line quality, caricature proportions, background density, and full-body centered staging.

ART STYLE (match the style reference image closely):
- 1990s MTV adult-animation / Beavis-and-Butt-Head parody energy: hand-drawn 2D cartoon, bold black outlines (slightly jittery), cel-shading with flat colors and hard-edge shadows, gritty-but-funny "ugly-cool" caricature proportions (slightly lanky limbs, expressive head), NOT photorealistic, NOT anime, NOT 3D render.

LAYOUT (match the layout reference / game key art composition):
- Full-body host centered in frame, straight-on eye-level camera, symmetrical staging.
- Character occupies lower-middle foreground with readable silhouette head-to-toe.
- Background is a detailed thematic environment (clutter, props, perspective) appropriate to the theme — same visual density and storytelling as a good TV promo still.

FRAMING FOR GAME ANIMATION:
- Host faces the camera directly, eyes toward viewer, friendly slight closed-mouth smile (neutral mouth for lip-sync base), relaxed eyebrows.
- Hands and prop clearly visible; no extreme foreshortening of face.
- Single clear key light + simple rim; high readability at small UI sizes.
`.trim();

const HOST_IDENTITY_BLOCK = `
CHARACTER (use the face reference image for LIKENESS — same person, recognizable facial structure):
- Adult male host; dark spiky messy mullet-fade haircut; full dark beard; black-rim glasses; bright blue eyes; fair skin.
- Rock-band style tattoos on forearms (guitars, mics, vinyl, stars) — sleeves optional if costume covers arms, but prefer visible tattoo hints on hands/wrists if possible.
- Keep the same person across all themes; only costume, environment, and hand prop change.
`.trim();

function parseArgs(argv) {
  const options = {
    face: '',
    style: '',
    outDir: path.join(repoRoot, 'exports', 'generated-host-stills'),
    model: 'gpt-image-1',
    size: '1536x1024',
    quality: 'high',
    inputFidelity: 'high',
    onlyTheme: '',
    delayMs: 1200,
    dryRun: false,
    overwrite: false,
    writePromptManifest: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--face') {
      options.face = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--style') {
      options.style = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--out-dir') {
      options.outDir = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--model') {
      options.model = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--size') {
      options.size = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--quality') {
      options.quality = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--input-fidelity') {
      options.inputFidelity = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--only-theme') {
      options.onlyTheme = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--delay-ms') {
      options.delayMs = Math.max(0, Number(argv[i + 1]) || 0);
      i += 1;
    } else if (arg === '--api-key') {
      options.apiKey = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--write-prompt-manifest') {
      options.writePromptManifest = String(argv[i + 1] || '').trim();
      i += 1;
    } else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--overwrite') options.overwrite = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  console.log(`Usage: node scripts/generateOpenAiThemeHostImages.cjs --face <path> --style <path> [options]

Required:
  --face <path>     Reference photo of you (jpeg/png/webp)
  --style <path>    Reference image for art style + layout (jpeg/png/webp)

Optional:
  --out-dir <path>  Output directory (default: exports/generated-host-stills)
  --model <id>      default: gpt-image-1
  --size <WxH>      default: 1536x1024  (also: 1024x1024, 1024x1536)
  --quality <low|medium|high|auto>
  --input-fidelity <low|high>  default: high
  --only-theme <id>          e.g. "Pirates" or "Ghosts and Ghouls"
  --delay-ms <n>             throttle between API calls (default: 1200)
  --write-prompt-manifest <path>  write JSON of prompts and exit (no API calls)
  --overwrite
  --dry-run
  --api-key <key>   or set OPENAI_API_KEY / scripts/royaltyFreeApiKeys.local.json`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonSafe(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function resolveApiKey(cliKey) {
  if (cliKey) return cliKey;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const local = readJsonSafe(localKeysPath, {});
  return String(local.openaiApiKey || '').trim();
}

function themeSlug(themeId) {
  return String(themeId || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildPrompt(spec) {
  return `
${STYLE_AND_LAYOUT_BLOCK}

${HOST_IDENTITY_BLOCK}

THEME: ${spec.id}

WARDROBE: ${spec.costume}

ENVIRONMENT: ${spec.environment}

HAND PROP: ${spec.prop}

OUTPUT:
- One illustration combining likeness from the face reference with line weight, color handling, and caricature rules from the style reference.
- No text in the image except the explicit "PANTS ON FIRE" / "FIND THE LIAR" branding described for the Default theme only; other themes must have NO readable captions or logos unless part of generic set dressing (e.g. illegible wanted poster blur).
- No watermarks, no UI frames, no photographer credit.
`.trim();
}

function guessMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildMultipartBody({ fields, files }) {
  const boundary = `----OpenAiHostGen${crypto.randomBytes(12).toString('hex')}`;
  const crlf = '\r\n';
  const parts = [];

  function appendField(name, value) {
    parts.push(
      Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"${crlf}${crlf}${value}${crlf}`,
        'utf8',
      ),
    );
  }

  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    appendField(k, String(v));
  });

  files.forEach(({ name, filename, contentType, buffer }) => {
    const head = Buffer.from(
      `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"; filename="${filename.replace(
        /"/g,
        '',
      )}"${crlf}Content-Type: ${contentType}${crlf}${crlf}`,
      'utf8',
    );
    parts.push(head, buffer, Buffer.from(crlf));
  });

  parts.push(Buffer.from(`--${boundary}--${crlf}`, 'utf8'));
  return { contentType: `multipart/form-data; boundary=${boundary}`, body: Buffer.concat(parts) };
}

async function openAiImageEdit({
  apiKey,
  model,
  prompt,
  size,
  quality,
  inputFidelity,
  facePath,
  stylePath,
}) {
  const faceBuf = fs.readFileSync(facePath);
  const styleBuf = fs.readFileSync(stylePath);
  const faceName = path.basename(facePath);
  const styleName = path.basename(stylePath);

  const fields = {
    model,
    prompt,
    size,
    n: '1',
    output_format: 'png',
  };
  if (quality) fields.quality = quality;
  if (inputFidelity) fields.input_fidelity = inputFidelity;

  const { contentType, body } = buildMultipartBody({
    fields,
    files: [
      { name: 'image', filename: faceName, contentType: guessMime(facePath), buffer: faceBuf },
      { name: 'image', filename: styleName, contentType: guessMime(stylePath), buffer: styleBuf },
    ],
  });

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': contentType,
      'Content-Length': String(body.length),
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`OpenAI image edit failed: HTTP ${response.status} ${message}`);
  }
  const payload = await response.json();
  const imageBase64 = payload?.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('OpenAI response did not include image data (b64_json).');
  }
  return Buffer.from(imageBase64, 'base64');
}

async function withRetries(fn, { retries = 4, delays = [4000, 8000, 16000, 32000] } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = String(e.message || e);
      const retryable = /HTTP 429|HTTP 5\d\d/.test(msg) || /rate|timeout/i.test(msg);
      if (!retryable || attempt === retries) throw e;
      const wait = delays[Math.min(attempt, delays.length - 1)];
      console.warn(`[retry] ${msg.slice(0, 200)} — waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const facePath = options.face ? path.resolve(repoRoot, options.face) : '';
  const stylePath = options.style ? path.resolve(repoRoot, options.style) : '';
  if (!facePath || !fs.existsSync(facePath)) {
    throw new Error('Missing or invalid --face path.');
  }
  if (!stylePath || !fs.existsSync(stylePath)) {
    throw new Error('Missing or invalid --style path.');
  }

  const specs = THEME_SPECS.filter((s) => {
    if (!options.onlyTheme) return true;
    return s.id.toLowerCase() === options.onlyTheme.trim().toLowerCase();
  });
  if (!specs.length) {
    throw new Error(`No themes matched --only-theme "${options.onlyTheme}".`);
  }

  const manifest = specs.map((s) => ({
    themeId: s.id,
    slug: themeSlug(s.id),
    outputRelative: `openai-host-stills/${themeSlug(s.id)}/host-idle.png`,
    prompt: buildPrompt(s),
  }));

  if (options.writePromptManifest) {
    const manifestPath = path.resolve(repoRoot, options.writePromptManifest);
    ensureDir(path.dirname(manifestPath));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Wrote prompt manifest: ${path.relative(repoRoot, manifestPath)}`);
    return;
  }

  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey && !options.dryRun) {
    throw new Error('Missing API key: use --api-key, OPENAI_API_KEY, or scripts/royaltyFreeApiKeys.local.json (openaiApiKey).');
  }

  const outRoot = path.resolve(repoRoot, options.outDir);
  console.log(`[generateOpenAiThemeHostImages] Themes: ${specs.length}`);
  console.log(`[generateOpenAiThemeHostImages] Out: ${path.relative(repoRoot, outRoot)}`);
  console.log(`[generateOpenAiThemeHostImages] Model: ${options.model} size=${options.size}`);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i];
    const dir = path.join(outRoot, themeSlug(spec.id));
    const dest = path.join(dir, 'host-idle.png');
    const rel = path.relative(repoRoot, dest);
    const prompt = buildPrompt(spec);

    if (fs.existsSync(dest) && !options.overwrite) {
      skipped += 1;
      console.log(`- [${i + 1}/${specs.length}] SKIP ${spec.id} (${rel})`);
    } else if (options.dryRun) {
      console.log(`- [${i + 1}/${specs.length}] PLAN ${spec.id} -> ${rel}`);
    } else {
      ensureDir(dir);
      const buf = await withRetries(() =>
        openAiImageEdit({
          apiKey,
          model: options.model,
          prompt,
          size: options.size,
          quality: options.quality,
          inputFidelity: options.inputFidelity,
          facePath,
          stylePath,
        }),
      );
      fs.writeFileSync(dest, buf);
      created += 1;
      console.log(`- [${i + 1}/${specs.length}] WROTE ${spec.id} (${rel})`);
    }

    if (options.delayMs && i < specs.length - 1 && !options.dryRun) {
      await sleep(options.delayMs);
    }
  }

  console.log(`[generateOpenAiThemeHostImages] Done. Created: ${created}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error(`[generateOpenAiThemeHostImages] ${err.message}`);
  process.exit(1);
});
