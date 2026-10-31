import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { backdropContrast } from './backdrop-contrast';

const PAGES = ['/', '/projects', '/projects/link-archive', '/community', '/contributors', '/supporters', '/nope'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PHONE = { width: 390, height: 844 };
const CONTRAST_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const MIN_CONTRAST = 4.5;
const TAB_STOPS = 20;
const DECORATION = '.marquee[aria-hidden="true"]';

async function audit(page: Page): Promise<void> {
  await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude(DECORATION).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

for (const path of PAGES) {
  test(`axe finds nothing on ${path}`, async ({ page }) => {
    await page.goto(path);
    await audit(page);
  });
}

for (const path of PAGES) {
  for (const viewport of CONTRAST_VIEWPORTS) {
    test(`ledes and buttons on ${path} hold 4.5:1 over the backdrop at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
      const readings = await backdropContrast(page, '.lede, .btn');
      expect(readings.length).toBeGreaterThan(0);
      expect(readings.filter((r) => r.ratio < MIN_CONTRAST), JSON.stringify(readings)).toEqual([]);
    });
  }
}

test('the page names the backdrop it was built with', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-backdrop', process.env.GLASS_BACKDROP ?? 'range');
});

test('axe finds nothing in the open menu', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page);
});

test('tabbing from the top reaches the skip link, the nav and the first call to action with visible focus', async ({ page }) => {
  await page.goto('/');
  const stops: { where: string; outline: string }[] = [];
  for (let i = 0; i < TAB_STOPS; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return { where: 'body', outline: 'none' };
      const where = el.matches('.skip') ? 'skip' : el.closest('header.nav') ? 'nav' : el.closest('main') && el.matches('.btn') ? 'cta' : 'other';
      return { where, outline: getComputedStyle(el).outlineStyle };
    });
    stops.push(stop);
    if (stop.where === 'cta') break;
  }
  const order = stops.map((s) => s.where);
  expect(order[0]).toBe('skip');
  expect(order).toContain('nav');
  expect(order.at(-1)).toBe('cta');
  expect(order.indexOf('nav')).toBeLessThan(order.indexOf('cta'));
  for (const stop of stops) expect(stop.outline, JSON.stringify(stops)).not.toBe('none');
});
