import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { rgbContrast } from '../../../src/lib/color/contrast';
import { backdropContrast, type Reading } from './backdrop-contrast';

const LEGAL = ['/privacy', '/terms', '/requests'];
const DOCS = ['/docs', '/docs/services/daydream/configuration', '/ja/docs/dusk'];
const PAGES = ['/', '/projects', '/projects/link-archive', '/projects/space', '/community', '/contributors', '/supporters', ...LEGAL, ...DOCS, '/nope'];
const GA_ORIGIN = 'http://localhost:3002';
const GRAPH = 'svg.legal-graph';
const LEGAL_INK = [
  '.eyebrow',
  '.lede',
  '.legal-updated',
  '.legal-notice',
  '.legal-map-title',
  '.legal-graph-key span',
  '.legal-graph-list-title',
  '.legal-graph-item',
  '.legal-graph-line dt',
  '.legal-graph-line dd',
  '.legal-index-link',
  '.legal-clause-title',
  '.legal-clause p',
].join(', ');
const FOOT_INK = '.foot-title, .foot-col a, .foot-col .foot-link, .foot-blurb, .foot-base';
const BAR_INK = '.consent-text, .consent-link, .consent-choice';
const LEGAL_STOPS = ['main h1', '.legal-graph-list', '.legal-clause', '.legal-clause:last-of-type', '.foot-cols'];
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
  if (new URL(page.url()).pathname.endsWith('/privacy')) await page.locator(GRAPH).waitFor({ timeout: 20_000 });
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

async function reachStop(page: Page, selector: string): Promise<boolean> {
  const target = page.locator(selector).first();
  if ((await target.count()) === 0) return false;
  await target.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return true;
}

async function inkAtStops(page: Page, ink: string): Promise<Reading[]> {
  const readings: Reading[] = [];
  for (const stop of LEGAL_STOPS) {
    if (await reachStop(page, stop)) readings.push(...(await backdropContrast(page, ink)));
  }
  return readings;
}

for (const path of LEGAL) {
  for (const viewport of CONTRAST_VIEWPORTS) {
    test(`axe finds nothing on ${path} at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await audit(page);
    });

    test(`axe finds nothing on ${path} at ${viewport.width} with the consent bar showing`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${GA_ORIGIN}${path}`);
      await expect(page.getByRole('region', { name: 'Privacy choices' })).toBeVisible();
      await audit(page);
    });

    test(`the legal text on ${path} holds 4.5:1 over the backdrop at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
      if (path === '/privacy') await page.locator(GRAPH).waitFor({ timeout: 20_000 });
      const readings = await inkAtStops(page, LEGAL_INK);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings.filter((r) => r.ratio < MIN_CONTRAST), JSON.stringify(readings)).toEqual([]);
    });

    test(`the consent bar on ${path} holds 4.5:1 at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${GA_ORIGIN}${path}`);
      await expect(page.getByRole('region', { name: 'Privacy choices' })).toBeVisible();
      const readings = await backdropContrast(page, BAR_INK);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings.filter((r) => r.ratio < MIN_CONTRAST), JSON.stringify(readings)).toEqual([]);
    });

    test(`the footer Legal column on ${path} holds 4.5:1 at ${viewport.width}`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('night-consent', 'denied'));
      await page.setViewportSize(viewport);
      await page.goto(`${GA_ORIGIN}${path}`);
      await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
      await expect(page.locator('footer.foot').getByRole('button', { name: 'Cookie settings' })).toBeVisible();
      await reachStop(page, '.foot-cols');
      const readings = await backdropContrast(page, FOOT_INK);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings.filter((r) => r.ratio < MIN_CONTRAST), JSON.stringify(readings)).toEqual([]);
    });
  }
}

for (const viewport of CONTRAST_VIEWPORTS) {
  test(`the English-governs notice on /es/terms holds 4.5:1 over the backdrop at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/es/terms');
    await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
    await expect(page.locator('.legal-notice')).toBeVisible();
    const readings = await inkAtStops(page, '.legal-notice, .legal-updated, .lede, .eyebrow');
    expect(readings.filter((r) => r.label.startsWith('legal-notice')).length).toBeGreaterThan(0);
    expect(readings.filter((r) => r.ratio < MIN_CONTRAST), JSON.stringify(readings)).toEqual([]);
  });
}

test('the map labels hold 4.5:1 even over a white backdrop behind their halo', async ({ page }) => {
  await page.goto('/privacy');
  await page.locator(GRAPH).waitFor({ timeout: 20_000 });
  const inks = await page.locator('.legal-graph-label').evaluateAll((els) => {
    const parse = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
    return els.map((el) => {
      const style = getComputedStyle(el);
      return { fill: parse(style.fill), stroke: parse(style.stroke), strokeOpacity: Number.parseFloat(style.strokeOpacity) };
    });
  });
  expect(inks.length).toBeGreaterThan(0);
  const white = 255;
  for (const { fill, stroke, strokeOpacity } of inks) {
    const [r, g, b] = stroke.map((c) => c * strokeOpacity + white * (1 - strokeOpacity));
    const halo = { r, g, b };
    const alpha = fill[3] ?? 1;
    const ink = { r: fill[0] * alpha + halo.r * (1 - alpha), g: fill[1] * alpha + halo.g * (1 - alpha), b: fill[2] * alpha + halo.b * (1 - alpha) };
    expect(rgbContrast(ink, halo)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  }
});

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
