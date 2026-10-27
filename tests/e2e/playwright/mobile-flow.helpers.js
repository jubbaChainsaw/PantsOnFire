import { expect } from '@playwright/test';

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

export async function assertRoundTypeCardsVisible(page) {
  const cards = page.locator('[data-testid^="round-type-"]');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  const viewport = page.viewportSize();
  const maxBottom = (viewport?.height ?? 844) - 8;
  for (let i = 0; i < Math.min(count, 4); i += 1) {
    const box = await cards.nth(i).boundingBox();
    expect(box, `round-type card ${i} missing layout box`).not.toBeNull();
    expect(
      box.y + box.height,
      `round-type card ${i} clipped below viewport (${box.y + box.height} > ${maxBottom})`,
    ).toBeLessThanOrEqual(maxBottom);
  }
  await assertVisibleImagesLoaded(page, {
    root: page.locator('[data-testid^="round-type-"]'),
    minCount: 2,
  });
}

export async function assertCategoryCardsVisible(page) {
  const cards = page.locator('[data-testid^="category-"]');
  if (!(await cards.first().isVisible().catch(() => false))) return;
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  await assertVisibleImagesLoaded(page);
}
