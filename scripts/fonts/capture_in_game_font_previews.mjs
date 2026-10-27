#!/usr/bin/env node
/**
 * Capture real in-game screens at 390×844 with font preview CSS injected (not in app bundle).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(
  ROOT,
  'public/assets/fonts/pants-on-fire/derived/in-game-previews',
);
const VIEWPORT = { width: 390, height: 844 };
const BASE_URL = process.env.POF_FONT_PREVIEW_URL || 'http://127.0.0.1:4176';

/** Reference + plain middle, then neon outline pairings (PoF Display middle). */
const OUTLINE_PAIRINGS = [
  {
    id: 'outline-yellow-black',
    label: 'Yellow + black',
    fill: '#fde047',
    stroke: '#000000',
    glow: '255, 120, 0',
  },
  {
    id: 'outline-yellow-white',
    label: 'Yellow + white',
    fill: '#fde047',
    stroke: '#ffffff',
    glow: '255, 200, 80',
  },
  {
    id: 'outline-pink-purple',
    label: 'Pink + purple',
    fill: '#ff2bd6',
    stroke: '#6b21a8',
    glow: '255, 43, 214',
  },
  {
    id: 'outline-cyan-blue',
    label: 'Cyan + deep blue',
    fill: '#67e8f9',
    stroke: '#1e3a8a',
    glow: '34, 211, 238',
  },
  {
    id: 'outline-orange-red',
    label: 'Orange + dark red',
    fill: '#fb923c',
    stroke: '#7f1d1d',
    glow: '255, 90, 0',
  },
];

const CAPTURE_MODES = [
  { id: 'current', label: 'Current', kind: 'current' },
  { id: 'middle', label: 'PoF Display (middle)', kind: 'middle' },
  ...OUTLINE_PAIRINGS.map((p) => ({
    id: p.id,
    label: `Middle + ${p.label}`,
    kind: 'outline',
    pairing: p,
  })),
];

const DISPLAY_TARGETS = `
  .pof-root h1,
  .pof-root h2,
  .pof-root h3,
  .pof-root .font-black,
  .pof-btn,
  .pof-title,
  .pof-heading,
  .pof-label,
  .pof-chip,
  .pof-field
`;

const DISPLAY_FONT_CSS = `
  .pof-root,
  ${DISPLAY_TARGETS} {
    font-family: var(--pof-font-preview-family, 'Pants on Fire Narrow'), Inter, system-ui, sans-serif !important;
  }
`;

function outlineBlock(pairing) {
  const { fill, stroke, glow } = pairing;
  return `
  ${DISPLAY_TARGETS} {
    color: ${fill} !important;
    -webkit-text-stroke: 3px ${stroke} !important;
    paint-order: stroke fill !important;
    text-shadow:
      0 0 18px rgba(${glow}, 0.95),
      0 0 8px rgba(${glow}, 0.65),
      0 3px 0 rgba(0, 0, 0, 0.85),
      0 5px 16px rgba(0, 0, 0, 0.75) !important;
  }
  .pof-btn {
    color: ${fill} !important;
  }`;
}

function fontPreviewCss(modeConfig) {
  if (modeConfig.kind === 'current') {
    return `#pof-font-preview-style{display:none}`;
  }
  let css = `@font-face {
    font-family: 'PoF Display';
    src: url('/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.woff2') format('woff2');
    font-display: block;
  }
  :root { --pof-font-preview-family: 'PoF Display'; }
  ${DISPLAY_FONT_CSS}`;
  if (modeConfig.kind === 'outline' && modeConfig.pairing) {
    css += outlineBlock(modeConfig.pairing);
  }
  return css;
}

async function applyFontMode(page, modeConfig) {
  const css = fontPreviewCss(modeConfig);
  await page.evaluate((text) => {
    let el = document.getElementById('pof-font-preview-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'pof-font-preview-style';
      document.head.appendChild(el);
    }
    el.textContent = text;
  }, css);
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(200);
}

async function seedLocalAccount(page) {
  await page.goto(`${BASE_URL}/`);
  await page.evaluate(() => {
    localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
    localStorage.setItem(
      'imposter-account-session-v2',
      JSON.stringify({
        userId: 'font-preview-user',
        displayName: 'Font Preview',
        tierId: 'host_most',
        addonTwistTruth: false,
        unlockedThemePackIds: [],
        authProvider: 'local',
      }),
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  const later = page.getByRole('button', { name: 'Later' });
  if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await later.click();
  }
}

async function openSetup(page) {
  const play = page.getByRole('button', { name: 'Play', exact: true });
  if (await play.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await play.click();
    return;
  }
  await page.getByRole('button', { name: 'Setup Game' }).click();
}

async function skipIntroAndRules(page) {
  const skip = page.getByTestId('intro-skip');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
  await page.getByTestId('rules-continue').click();
}

async function navigateHome(page) {
  await seedLocalAccount(page);
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

async function navigateCategoryChoice(page) {
  await seedLocalAccount(page);
  await openSetup(page);
  await page.getByTestId('start-match').waitFor({ state: 'visible', timeout: 20_000 });
  const inputs = page.locator('input:not([type="hidden"])');
  for (let i = 0; i < 3; i += 1) {
    await inputs.nth(i).fill(`Player ${i + 1}`);
  }
  await page.getByTestId('start-match').click();
  await skipIntroAndRules(page);
  const chainBtn = page.getByTestId('round-type-chain');
  if (await chainBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await chainBtn.click();
  } else {
    await page.locator('[data-testid^="round-type-"]').first().click();
  }
  await page.getByTestId('category-choice-grid').waitFor({
    state: 'visible',
    timeout: 20_000,
  });
}

function categoryTiles(page) {
  return page.locator(
    '[data-testid="category-choice-grid"] button[data-testid^="category-"]',
  );
}

async function advancePastHostIntro(page) {
  const skip = page.getByTestId('host-intro-skip');
  const ready = page.getByTestId('reveal-ready');
  await Promise.race([
    skip.waitFor({ state: 'visible', timeout: 45_000 }),
    ready.waitFor({ state: 'visible', timeout: 45_000 }),
  ]);
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
  await ready.waitFor({ state: 'visible', timeout: 60_000 });
}

async function navigateResults(page) {
  await navigateCategoryChoice(page);
  await categoryTiles(page).first().click();
  await advancePastHostIntro(page);
  for (let i = 0; i < 3; i += 1) {
    const ready = page.getByTestId('reveal-ready');
    if (await ready.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await ready.click();
      await page.waitForTimeout(1200);
    }
    const next = page.getByTestId('reveal-next');
    await next.waitFor({ state: 'visible', timeout: 15_000 });
    await next.click();
  }
  await page.getByTestId('discussion-continue').click();
  for (let v = 0; v < 3; v += 1) {
    await page.locator('[data-testid^="vote-for-"]').first().click();
  }
  await page.getByTestId('submit-votes').click();
  await page.getByText(/WHO WAS THE LIAR/i).waitFor({ timeout: 60_000 });
}

async function captureScreen(page, screenId, navigateFn) {
  await navigateFn(page);
  const shots = [];
  for (const mode of CAPTURE_MODES) {
    await applyFontMode(page, mode);
    const file = path.join(
      OUT_DIR,
      `${screenId}-${mode.id}-${VIEWPORT.width}x${VIEWPORT.height}.png`,
    );
    await page.screenshot({ path: file, fullPage: false });
    shots.push({ file, label: mode.label });
    console.log('wrote', file);
  }
  return shots;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

async function stitchGrid(screenId, shots, columns) {
  const labelH = 32;
  const w = VIEWPORT.width;
  const panelH = VIEWPORT.height + labelH;
  const rows = Math.ceil(shots.length / columns);
  const composites = [];

  for (let i = 0; i < shots.length; i += 1) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const left = col * w;
    const top = row * panelH;
    const labelSvg = Buffer.from(
      `<svg width="${w}" height="${labelH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#05010f"/>
        <text x="8" y="21" fill="#94a3b8" font-family="sans-serif" font-size="10">${escapeXml(shots[i].label)}</text>
      </svg>`,
    );
    composites.push({ input: labelSvg, left, top });
    composites.push({ input: shots[i].file, left, top: top + labelH });
  }

  const out = path.join(
    OUT_DIR,
    `${screenId}-font-comparison-${VIEWPORT.width}x${VIEWPORT.height}.png`,
  );
  await sharp({
    create: {
      width: w * columns,
      height: panelH * rows,
      channels: 4,
      background: { r: 5, g: 1, b: 15, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(out);
  console.log('stitched', out);
  return out;
}

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'bash',
      [
        '-lc',
        'VITE_E2E_FAST_TIMERS=1 VITE_E2E_FORCE_ROUND_TYPE=chain npm run build:mobile && npm run preview -- --host 127.0.0.1 --port 4176',
      ],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let ready = false;
    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes('4176') || text.includes('Local:')) {
        if (!ready) {
          ready = true;
          resolve(child);
        }
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (!ready) reject(new Error(`preview exited ${code}`));
    });
    setTimeout(() => {
      if (!ready) {
        ready = true;
        resolve(child);
      }
    }, 180_000);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const onlyScreen = process.env.POF_FONT_PREVIEW_SCREEN || '';
  const reuse = process.env.POF_FONT_PREVIEW_URL;
  let server;
  if (!reuse) {
    server = await startPreviewServer();
    await new Promise((r) => setTimeout(r, 4000));
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    baseURL: BASE_URL,
  });
  const page = await context.newPage();

  const comparisons = [];
  const columns = 4;
  const screens = [
    ['home', navigateHome],
    ['category-choice', navigateCategoryChoice],
    ['results', navigateResults],
  ].filter(([id]) => !onlyScreen || id === onlyScreen);

  try {
    for (const [screenId, nav] of screens) {
      const shots = await captureScreen(page, screenId, nav);
      comparisons.push(await stitchGrid(screenId, shots, columns));
    }
  } finally {
    await browser.close();
    if (server) server.kill('SIGTERM');
  }

  const manifest = path.join(OUT_DIR, 'MANIFEST.txt');
  fs.writeFileSync(manifest, `${comparisons.join('\n')}\n`);
  console.log('\nComparison PNGs:');
  comparisons.forEach((p) => console.log(p));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
