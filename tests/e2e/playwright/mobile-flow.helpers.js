import { expect } from '@playwright/test';

export const FORBIDDEN_ROUND_TYPE_IDS = ['prompt', 'grill'];

export function attachMobileAssetGuards(page) {
  const failedAssets = [];
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() === 404 && /\/assets\//.test(url)) {
      failedAssets.push(`${response.status()} ${url}`);
    }
  });
  return {
    assertNoFailedAssets: () => {
      expect(
        failedAssets,
        `asset 404s:\n${failedAssets.join('\n')}`,
      ).toEqual([]);
    },
  };
}

export async function assertNoVerticalScroll(page) {
  const metrics = await page.evaluate(() => {
    const el = document.documentElement;
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      windowInnerHeight: window.innerHeight,
    };
  });
  expect(
    metrics.scrollHeight,
    `document scrollHeight ${metrics.scrollHeight} > clientHeight ${metrics.clientHeight}`,
  ).toBeLessThanOrEqual(metrics.clientHeight + 2);
  expect(
    metrics.bodyScrollHeight,
    `body scrollHeight ${metrics.bodyScrollHeight} > window ${metrics.windowInnerHeight}`,
  ).toBeLessThanOrEqual(metrics.windowInnerHeight + 2);
}

export async function assertVisibleImagesLoaded(
  page,
  { root, minCount = 1 } = {},
) {
  const locator = root || page.locator('body');
  const images = locator.locator('img:visible');
  const count = await images.count();
  expect(
    count,
    `expected at least ${minCount} visible images under ${root ? 'root' : 'body'}`,
  ).toBeGreaterThanOrEqual(minCount);
  for (let i = 0; i < count; i += 1) {
    const img = images.nth(i);
    const src = await img.getAttribute('src');
    const ok = await img.evaluate((node) => {
      const el = node;
      return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0;
    });
    expect(ok, `image failed to load: ${src}`).toBe(true);
  }
}

function iconSrcMatchesRoundType(src = '', roundTypeId = '') {
  const id = String(roundTypeId || '').trim().toLowerCase();
  const normalizedSrc = String(src || '').toLowerCase();
  if (!id || !normalizedSrc) return false;
  if (FORBIDDEN_ROUND_TYPE_IDS.includes(id)) return false;
  if (id === 'nameblame') {
    return (
      normalizedSrc.includes('name-and-shame') ||
      normalizedSrc.includes('nameblame')
    );
  }
  if (id === 'offtopic') {
    return normalizedSrc.includes('offtopic');
  }
  return (
    normalizedSrc.includes(`/${id}.`) ||
    normalizedSrc.includes(`/${id}/`) ||
    normalizedSrc.includes(`${id}.webp`) ||
    normalizedSrc.includes(`${id}.png`)
  );
}

export async function assertViewportNotMostlyEmpty(
  page,
  { selector, maxEmptyFraction = 0.15 } = {},
) {
  const result = await page.evaluate(
    ({ sel, maxEmpty }) => {
      const vh = window.innerHeight;
      const nodes = sel
        ? Array.from(document.querySelectorAll(sel))
        : [document.body];
      let minY = vh;
      let maxY = 0;
      nodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) return;
        minY = Math.min(minY, rect.top);
        maxY = Math.max(maxY, rect.bottom);
      });
      if (maxY <= minY) {
        return { emptyFraction: 1, vh, minY, maxY };
      }
      const used = Math.max(0, maxY - Math.max(0, minY));
      const empty = Math.max(0, vh - used);
      return {
        emptyFraction: empty / vh,
        vh,
        minY,
        maxY,
        used,
        maxEmpty,
      };
    },
    { sel: selector, maxEmpty: maxEmptyFraction },
  );
  expect(
    result.emptyFraction,
    `viewport unused ${(result.emptyFraction * 100).toFixed(1)}% (allowed ${maxEmptyFraction * 100}%)`,
  ).toBeLessThanOrEqual(maxEmptyFraction + 0.02);
}

export async function assertRoundTypeCardsVisible(page) {
  const cards = page.locator('button[data-testid^="round-type-"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  const count = await cards.count();
  expect(count).toBe(2);
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const id = await card.getAttribute('data-round-type-id');
    const name = await card.getAttribute('data-round-type-name');
    expect(id, `round type card ${i} missing id`).toBeTruthy();
    expect(name, `round type card ${i} missing name`).toBeTruthy();
    expect(FORBIDDEN_ROUND_TYPE_IDS).not.toContain(id);
    ids.push(id);
    const icon = card.locator(`[data-testid="round-type-icon-${id}"]`);
    await expect(icon).toBeVisible();
    const src = await icon.getAttribute('src');
    expect(
      iconSrcMatchesRoundType(src, id),
      `icon src "${src}" does not match round type "${id}"`,
    ).toBe(true);
    const viewport = page.viewportSize();
    const maxBottom = (viewport?.height ?? 844) - 8;
    const box = await card.boundingBox();
    expect(box, `round-type card ${i} missing layout box`).not.toBeNull();
    expect(
      box.y + box.height,
      `round-type card ${i} clipped below viewport (${box.y + box.height} > ${maxBottom})`,
    ).toBeLessThanOrEqual(maxBottom);
  }
  expect(new Set(ids).size, `round types must be distinct: ${ids.join(', ')}`).toBe(2);
  await assertVisibleImagesLoaded(page, {
    root: page.locator('[data-testid="round-type-choice-grid"]'),
    minCount: 2,
  });
  await assertViewportNotMostlyEmpty(page, {
    selector:
      '[data-testid="round-type-choice-grid"], h2, [data-testid^="round-type-"]',
    maxEmptyFraction: 0.15,
  });
}

export async function assertHostIntroMedia(page) {
  const frame = page.getByTestId('host-intro-visual');
  await expect(frame).toBeVisible({ timeout: 20_000 });
  const ok = await frame.evaluate((el) => {
    const img = el.querySelector('[data-testid="host-idle-image"], img');
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      return true;
    }
    const video = el.querySelector('video');
    if (!video) return false;
    if (video.readyState >= 2) return true;
    if (video.poster && String(video.poster).length > 0) return true;
    return false;
  });
  expect(ok, 'host intro frame must show idle image or playable video/poster').toBe(
    true,
  );
  await assertViewportNotMostlyEmpty(page, {
    selector:
      '[data-testid="host-intro-visual"], [data-testid="host-intro-caption"], [data-testid="host-intro-skip"]',
    maxEmptyFraction: 0.15,
  });
}

export async function assertCategoryCardsVisible(page) {
  const cards = page.locator('[data-testid^="category-"]');
  if (!(await cards.first().isVisible().catch(() => false))) return;
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  await assertVisibleImagesLoaded(page);
}
