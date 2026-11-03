#!/usr/bin/env node
/**
 * Audits referenced game graphics vs files on disk (public/ + mobile slim rules).
 * Output: docs/missing-graphics.md
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const outPath = path.join(root, 'docs', 'missing-graphics.md');

const MOBILE_DROP_TOP = [
  'assets/graphic-packs',
  'assets/host-generation',
  'assets/audio/host',
  'assets/new-ui',
];
const CORE_MOBILE_THEME = 'default';

/** @type {Map<string, { w: number, h: number, format: string }>} */
const dimCache = new Map();

async function dims(rel) {
  const abs = absFromRel(rel);
  if (!abs || !fs.existsSync(abs)) return null;
  if (dimCache.has(abs)) return dimCache.get(abs);
  try {
    const meta = await sharp(abs).metadata();
    const row = {
      w: meta.width || 0,
      h: meta.height || 0,
      format: meta.format || path.extname(abs).slice(1),
    };
    dimCache.set(abs, row);
    return row;
  } catch {
    return null;
  }
}

function absFromRel(rel) {
  if (!rel) return '';
  return path.join(publicRoot, rel.split('/').join(path.sep));
}

function toRel(assetUrl = '') {
  const s = String(assetUrl || '').trim();
  const m = s.match(/^\/?assets\/(.+)$/);
  if (m) return `assets/${m[1]}`;
  const m2 = s.match(/^\.\/assets\/(.+)$/);
  if (m2) return `assets/${m2[1]}`;
  return '';
}

function mobileBundled(rel) {
  if (!rel) return { full: false, mobile: false, note: 'no path' };
  const full = fs.existsSync(absFromRel(rel));
  if (!full) return { full: false, mobile: false, note: '' };
  if (MOBILE_DROP_TOP.some((p) => rel === p || rel.startsWith(`${p}/`))) {
    return { full: true, mobile: false, note: 'stripped by slim-dist (top-level drop)' };
  }
  if (rel.startsWith('assets/themes/')) {
    const theme = rel.split('/')[2];
    if (theme !== CORE_MOBILE_THEME) {
      return { full: true, mobile: false, note: 'non-default theme dir removed from APK' };
    }
  }
  const base = path.basename(rel).toLowerCase();
  if (
    base.includes('persona-host-talk-') &&
    base.endsWith('.png') &&
    !rel.includes('/assets/themes/default/hosts/')
  ) {
    return { full: true, mobile: false, note: 'persona-host-talk PNG dropped outside default/hosts' };
  }
  if ((base.endsWith('.mp4') || base.endsWith('.webm')) && !rel.includes('/assets/themes/default/hosts/')) {
    return { full: true, mobile: false, note: 'host video dropped outside default/hosts in APK' };
  }
  return { full: true, mobile: true, note: '' };
}

function formatSpec(dimRow, fallback = 'Match sibling assets in same folder') {
  if (!dimRow) return fallback;
  return `${dimRow.w}×${dimRow.h} ${String(dimRow.format).toUpperCase()}`;
}

/** @type {Array<{type:string,name:string,issue:string,expected:string,format:string,notes:string}>} */
const rows = [];

function push(type, name, issue, expected, format, notes = '') {
  if (!issue) return;
  rows.push({ type, name, issue, expected, format, notes });
}

function readText(relPath) {
  const p = path.join(root, relPath);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function extractAssetStrings(text) {
  const out = new Set();
  const re = /['"`](\/?assets\/[^'"`]+)['"`]/g;
  // skip template placeholders
  let m;
  while ((m = re.exec(text))) {
    const rel = m[1].replace(/^\//, '');
    if (rel.includes('...')) continue;
    out.add(rel);
  }
  return [...out];
}

function themeNameToSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function checkFile(type, name, rel, extraNotes = '') {
  if (!rel) {
    push(type, name, 'no asset path in data', '—', '—', extraNotes);
    return;
  }
  const bundle = mobileBundled(rel);
  const d = await dims(rel);
  const spec = formatSpec(d);
  if (!bundle.full) {
    push(type, name, 'missing in public/', rel, spec, extraNotes);
    return;
  }
  if (!bundle.mobile) {
    push(
      type,
      name,
      `present in repo; not in offline APK (${bundle.note})`,
      rel,
      spec,
      extraNotes,
    );
  }
}

async function main() {
  const uiAssets = readText('src/data/uiAssets.js');
  const roundTypes = readText('src/data/roundTypes.js');
  const themePersonas = readText('src/data/themePersonas.js');
  const themeAssets = readText('src/data/themeAssets.js');
  const themeCatalog = readText('src/data/themeCatalog.js');
  const picManifests = readText('src/data/generatedPictureDlcManifests.js');
  const uiNeon = readText('src/data/uiNeonAssets.js');
  const appJsx = readText('src/App.jsx');

  // --- Round types (exclude prompt/grill) ---
  const modeIds = ['opinion', 'picture', 'nameblame', 'noise', 'offtopic', 'chain', 'sound', 'video', 'meme'];
  for (const id of modeIds) {
    if (id === 'nameblame') {
      await checkFile('Round type / game mode', 'Name and Blame', 'assets/images/round-types/name-and-shame.png');
      continue;
    }
    const uiRel = `assets/ui/game-modes/${id}.png`;
    if (id === 'offtopic') {
      const svg = 'assets/images/round-types/offtopic-logo.svg';
      if (!fs.existsSync(absFromRel(uiRel))) {
        push(
          'Round type / game mode',
          'Off Topic Defense',
          'no assets/ui/game-modes/offtopic.png (legacy SVG only in roundTypes)',
          uiRel,
          formatSpec(await dims(`assets/ui/game-modes/opinion.png`)),
          `Legacy: \`${svg}\` (${fs.existsSync(absFromRel(svg)) ? 'exists' : 'MISSING'})`,
        );
      }
      await checkFile('Round type / game mode', 'Off Topic Defense (legacy SVG)', svg);
      continue;
    }
    await checkFile('Round type / game mode', id, uiRel);
  }
  // chain has no logoSrc in roundTypes — UI icon is canonical

  // meme file exists but not a pass-the-phone round type — informational
  if (fs.existsSync(absFromRel('assets/ui/game-modes/meme.png'))) {
    push(
      'Round type / game mode',
      'meme (orphan icon)',
      'icon on disk but no active round type id `meme` in roundTypes.js',
      'assets/ui/game-modes/meme.png',
      formatSpec(await dims('assets/ui/game-modes/meme.png')),
      'Use or remove',
    );
  }

  // --- Category icons: expected from uiAssets DEFAULT_CATEGORIES pattern ---
  const catIds = new Set();
  const packsRoot = path.join(root, 'src/data/packs');
  function walkPacks(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkPacks(p);
      else if (ent.name.endsWith('promptRoundData.js') || ent.name === 'categoryPromptPacks.js') {
        const t = fs.readFileSync(p, 'utf8');
        const idPatterns = [
          /"id":\s*"([a-z0-9-]+)"/g,
          /\bid:\s*'([a-z0-9-]+)'/g,
        ];
        for (const idRe of idPatterns) {
          let cm;
          while ((cm = idRe.exec(t))) catIds.add(cm[1]);
        }
      }
    }
  }
  if (fs.existsSync(packsRoot)) walkPacks(packsRoot);
  const customBlock = uiAssets.split('UI_CUSTOM_CATEGORY_META')[1] || '';
  const customRe = /id:\s*'([^']+)'/g;
  let cm;
  while ((cm = customRe.exec(customBlock))) catIds.add(cm[1]);

  const catDir = path.join(publicRoot, 'assets/ui/categories');
  const onDiskCats = fs.existsSync(catDir)
    ? fs.readdirSync(catDir).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''))
    : [];
  for (const id of [...catIds].sort()) {
    await checkFile('Category icon', id, `assets/ui/categories/${id}.png`);
  }
  for (const id of onDiskCats) {
    if (!catIds.has(id) && id !== 'memes-viral-alt') {
      push(
        'Category icon',
        `${id} (orphan file)`,
        'PNG on disk but not referenced in category packs / uiAssets',
        `assets/ui/categories/${id}.png`,
        formatSpec(await dims(`assets/ui/categories/${id}.png`)),
        '',
      );
    }
  }
  if (onDiskCats.includes('memes-viral-alt')) {
    push(
      'Category icon',
      'memes-viral-alt',
      'duplicate/unused variant (code uses memes-viral.png)',
      'assets/ui/categories/memes-viral.png',
      formatSpec(await dims('assets/ui/categories/memes-viral.png')),
      '',
    );
  }

  // --- UI backgrounds, cards, badges ---
  const uiChecks = [
    ['Screen background', 'Home wallpaper', 'assets/ui/wallpapers/home-page.png'],
    ['Screen background', 'In-game wallpaper', 'assets/ui/wallpapers/in-game.png'],
    ['UI frame / logo', 'Main logo', 'assets/ui/logos/main-logo.png'],
    ['UI frame / logo', '18+ logo', 'assets/ui/logos/logo-18plus.png'],
    ['UI frame / card', 'Default card front', 'assets/ui/cards/default-front.png'],
    ['UI frame / card', 'Default card back', 'assets/ui/cards/default-back.png'],
    ['UI frame / card', 'Liar card front', 'assets/ui/cards/liar-front.png'],
    ['Badge / achievement', '18+ badge', 'assets/images/ui-icons/badge-18-plus.png'],
    ['Badge / achievement', 'Liar badge', 'assets/images/ui-icons/badge-liar.png'],
  ];
  for (const [t, n, r] of uiChecks) await checkFile(t, n, r);

  for (const slug of ['murder-mystery', 'pirates', 'cops-and-robbers', 'ghosts-and-ghouls']) {
    await checkFile('UI frame / card', `${slug} front`, `assets/ui/cards/${slug}-front.png`);
    await checkFile('UI frame / card', `${slug} back`, `assets/ui/cards/${slug}-back.png`);
  }

  // Neon chrome from uiNeonAssets
  for (const rel of extractAssetStrings(uiNeon)) {
    const short = rel.split('/').pop();
    await checkFile('UI frame / neon chrome', short, rel);
  }
  for (let i = 1; i <= 6; i += 1) {
    await checkFile('Badge / achievement', `Neon badge ${i}`, `assets/ui/neon/badge-${i}.png`);
  }

  // --- Host (default + themeAssets refs) ---
  const hostRefs = new Set(extractAssetStrings(themeAssets));
  for (const rel of hostRefs) {
    if (!/hosts|host-/i.test(rel)) continue;
    const name = rel.replace('assets/themes/', '');
    const themeSlug = rel.split('/')[2];
    const hostDir = path.join(publicRoot, 'assets/themes', themeSlug, 'hosts');
    const hasVideo =
      fs.existsSync(path.join(hostDir, 'persona-host-talking.webm')) ||
      fs.existsSync(path.join(hostDir, 'persona-host-talking.mp4'));
    if (hasVideo && /persona-host-talk-[123]\.png/.test(rel)) {
      push(
        'Host',
        name,
        'legacy still-frame path in themeAssets (theme uses persona-host-talking video instead)',
        rel,
        '900×900 PNG or retire ref',
        'Video present in hosts/',
      );
      continue;
    }
    await checkFile('Host', name, rel);
  }

  // --- Personas ---
  const personaPaths = new Map();
  const personaRe = /imageSrc:\s*['"`]([^'"`]+)['"`]/g;
  let pm;
  while ((pm = personaRe.exec(themePersonas))) {
    const rel = toRel(pm[1]);
    if (!rel) continue;
    const ctx = themePersonas.slice(Math.max(0, pm.index - 120), pm.index);
    const nameMatch = ctx.match(/name:\s*'([^']+)'/);
    const idMatch = ctx.match(/id:\s*'([^']+)'/);
    const label = nameMatch?.[1] || idMatch?.[1] || rel;
    if (personaPaths.has(rel)) {
      push(
        'Persona / avatar',
        label,
        `duplicate image path (shared with ${personaPaths.get(rel)})`,
        rel,
        formatSpec(await dims(rel)),
        '',
      );
    } else personaPaths.set(rel, label);
    await checkFile('Persona / avatar', label, rel);
  }

  // dlcPersonaRoster.json
  const roster = readText('src/data/dlcPersonaRoster.json');
  try {
    const parsed = JSON.parse(roster || '[]');
    for (const entry of parsed) {
      const rel = toRel(entry.imageSrc || entry.avatarSrc || '');
      if (rel) await checkFile('Persona / avatar', entry.name || entry.id || rel, rel);
    }
  } catch {
    /* optional */
  }

  // --- DLC theme packs ---
  const packRe = /export const (\w+)_THEME_PACK = \{[\s\S]*?themes:\s*\[([^\]]+)\]/g;
  let pk;
  while ((pk = packRe.exec(themeCatalog))) {
    const packConst = pk[1];
    const themesRaw = pk[2];
    const themes = themesRaw.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, '')) || [];
    for (const themeName of themes) {
      const slug = themeNameToSlug(themeName);
      const idle = `assets/themes/${slug}/hosts/persona-host-idle.png`;
      const banner = `assets/themes/${slug}/ui/banner.png`;
      const hasIdle = fs.existsSync(absFromRel(idle));
      const hasBanner = fs.existsSync(absFromRel(banner));
      if (!hasIdle && !hasBanner) {
        push(
          'Theme pack (DLC)',
          `${packConst} → ${themeName}`,
          'no persona host idle or ui banner under theme folder',
          idle,
          '1024×1024 PNG idle; 1200×400 banner WEBP/PNG',
          `Expected slug folder: assets/themes/${slug}/`,
        );
      } else {
        if (hasIdle) await checkFile('Theme pack (DLC)', `${themeName} host idle`, idle);
        if (hasBanner) await checkFile('Theme pack (DLC)', `${themeName} banner`, banner);
      }
    }
  }

  // --- Picture prompt cards ---
  const picturePacks = [];
  const picPackRe = /"id":\s*"([^"]+)"[\s\S]*?"basePath":\s*"(\/assets\/graphic-packs\/[^"]+)"/g;
  let pr;
  while ((pr = picPackRe.exec(picManifests))) {
    picturePacks.push({ id: pr[1], baseRel: pr[2].replace(/^\//, '') });
  }
  for (const { id: packId, baseRel } of picturePacks) {
    if (!fs.existsSync(absFromRel(baseRel))) {
      push(
        'Prompt card (picture pack)',
        packId,
        'manifest basePath directory missing',
        baseRel,
        'JPEG ~800×600',
        '',
      );
      continue;
    }
    push(
      'Prompt card (picture pack)',
      packId,
      'not bundled in offline APK (graphic-packs stripped)',
      baseRel,
      '—',
      'Full web build only unless CDN added',
    );
    const files = fs.readdirSync(absFromRel(baseRel)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    if (!files.length) {
      push(
        'Prompt card (picture pack)',
        packId,
        'image folder empty',
        `${baseRel}/*`,
        'JPEG ~800×600',
        '',
      );
    }
  }

  // --- Stray code references ---
  const srcFiles = [];
  function walkSrc(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory() && !['node_modules', 'dist'].includes(ent.name)) walkSrc(p);
      else if (/\.(js|jsx|json)$/.test(ent.name)) srcFiles.push(p);
    }
  }
  walkSrc(path.join(root, 'src'));
  const allRefs = new Set();
  for (const f of srcFiles) allRefs.add(...extractAssetStrings(fs.readFileSync(f, 'utf8')));
  for (const rel of allRefs) {
    if (!rel || rel.includes('...')) continue;
    if (/prompt-logo|game-modes\/prompt|game-modes\/grill|grill-logo/.test(rel)) continue;
    if (!fs.existsSync(absFromRel(rel))) {
      push('Code reference (misc)', rel, 'referenced in src but missing in public/', rel, '—', '');
    }
  }

  // Legacy round-type logos still in roundTypes (excluding prompt/grill)
  const logoRe = /id:\s*'([^']+)'[\s\S]*?logoSrc:\s*'([^']+)'/g;
  let lr;
  while ((lr = logoRe.exec(roundTypes))) {
    const [id, src] = [lr[1], lr[2]];
    if (id === 'prompt' || id === 'grill' || id === 'chain') continue;
    const rel = toRel(src);
    const uiRel = `assets/ui/game-modes/${id}.png`;
    if (rel && fs.existsSync(absFromRel(rel)) && fs.existsSync(absFromRel(uiRel))) {
      // both exist — note dual art paths
      push(
        'Round type / game mode',
        id,
        'dual art paths (legacy logo + ui/game-modes); ensure they match visually',
        uiRel,
        formatSpec(await dims(uiRel)),
        `Legacy: ${rel}`,
      );
    } else if (rel) {
      await checkFile('Round type / game mode', `${id} legacy logo`, rel);
    }
  }

  // Sort
  const typeOrder = [
    'Round type / game mode',
    'Category icon',
    'Host',
    'Persona / avatar',
    'Theme pack (DLC)',
    'UI frame / card',
    'UI frame / logo',
    'Screen background',
    'UI frame / neon chrome',
    'Badge / achievement',
    'Prompt card (picture pack)',
    'Code reference (misc)',
  ];
  rows.sort(
    (a, b) =>
      typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) ||
      a.name.localeCompare(b.name),
  );

  const generated = new Date().toISOString().slice(0, 10);
  let md = `# Missing & placeholder graphics audit\n\n`;
  md += `Generated: **${generated}** (run \`node scripts/audit-missing-graphics.cjs\` to refresh). Audience: **Martin** (art). **Hot Seat (\`prompt\`) and Grill 'Em (\`grill\`) excluded** from this list.\n\n`;
  md += `Checks **public/** (full game) and flags **offline APK** gaps per \`scripts/slim-dist-for-mobile.cjs\`.\n\n`;
  md += `### Priority for Martin\n\n`;
  md += `1. **Player-facing now:** \`assets/ui/game-modes/*.png\` (except removed Hot Seat/Grill), especially **offtopic** tile; category icons under \`assets/ui/categories/\`.\n`;
  md += `2. **Default host (APK):** \`assets/themes/default/hosts/persona-host-idle.png\` + \`persona-host-talking.webm/mp4\`.\n`;
  md += `3. **DLC / online themes:** full host sets under \`assets/themes/<slug>/hosts/\` (not shipped in offline APK today).\n`;
  md += `4. **Picture rounds:** \`assets/graphic-packs/picture/*\` (web only until CDN).\n\n`;

  const byType = new Map();
  for (const r of rows) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type).push(r);
  }

  for (const type of typeOrder) {
    const group = byType.get(type);
    if (!group?.length) continue;
    md += `## ${type}\n\n`;
    md += `| Item | What's missing / issue | Expected path | Format & size | Notes |\n`;
    md += `| --- | --- | --- | --- | --- |\n`;
    for (const r of group) {
      const esc = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      md += `| ${esc(r.name)} | ${esc(r.issue)} | \`${esc(r.expected)}\` | ${esc(r.format)} | ${esc(r.notes)} |\n`;
    }
    md += `\n`;
  }

  md += `## Reference dimensions (match these)\n\n`;
  for (const [label, rel] of [
    ['Game mode icon', 'assets/ui/game-modes/opinion.png'],
    ['Category icon', 'assets/ui/categories/movies.png'],
    ['Default host idle', 'assets/themes/default/hosts/persona-host-idle.png'],
    ['In-game wallpaper', 'assets/ui/wallpapers/in-game.png'],
    ['Card front', 'assets/ui/cards/default-front.png'],
  ]) {
    const d = await dims(rel);
    md += `- **${label}**: ${d ? `${d.w}×${d.h} ${d.format}` : 'missing'}\n`;
  }

  md += `\n## Summary counts\n\n`;
  md += `- **Total rows:** ${rows.length}\n`;
  for (const type of typeOrder) {
    const n = byType.get(type)?.length || 0;
    if (n) md += `- ${type}: ${n}\n`;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md);
  console.log(`Wrote ${rows.length} rows to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
