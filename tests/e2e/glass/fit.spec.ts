import { expect, type Page, test } from '@playwright/test';
import { padText } from './pseudo';

const PAGES = ['/', '/projects', '/projects/link-archive', '/community', '/contributors', '/supporters', '/privacy', '/terms', '/requests', '/nope'];
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];
const FOOT_WIDTHS = [761, 800, 900, 901, 1000, 1023, 1024];
const FOOT_LOCALES = ['', '/es', '/fr', '/ja'];
const GA_ORIGIN = 'http://localhost:3002';
const BLURB_MIN = 120;
const HEIGHT = 900;
const SLACK = 1;

type Foot = { viewport: number; pageWidth: number; blurb: number; rights: number[]; crowded: boolean; spill: number };

type Fit = { pageWidth: number; viewport: number; spills: string[] };

function measure(page: Page): Promise<Fit> {
  return page.evaluate((slack) => {
    const scrolls = (el: HTMLElement): boolean => {
      for (let up = el.parentElement; up && up !== document.body; up = up.parentElement) {
        if (['auto', 'scroll'].includes(getComputedStyle(up).overflowX)) return true;
      }
      return false;
    };
    const spills = Array.from(document.querySelectorAll<HTMLElement>('h1, button, .btn'))
      .filter((el) => el.checkVisibility())
      .filter((el) => el.scrollWidth > el.clientWidth + slack || (!scrolls(el) && el.getBoundingClientRect().right > window.innerWidth + slack))
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}: ${el.textContent?.trim().slice(0, 40)} (${el.scrollWidth}/${el.clientWidth})`);
    return { pageWidth: document.documentElement.scrollWidth, viewport: window.innerWidth, spills };
  }, SLACK);
}

function expectFit(fit: Fit, label: string): void {
  expect(fit.pageWidth, `${label} page width`).toBeLessThanOrEqual(fit.viewport);
  expect(fit.spills, label).toEqual([]);
}

function footGeometry(page: Page): Promise<Foot> {
  return page.evaluate(() => {
    const columns = Array.from(document.querySelectorAll<HTMLElement>('.foot-col')).map((el) => el.getBoundingClientRect());
    const row = document.querySelector<HTMLElement>('.foot-cols');
    return {
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      blurb: document.querySelector('.foot-blurb')?.getBoundingClientRect().width ?? 0,
      rights: columns.map((box) => box.right),
      crowded: columns.some((box, i) => i > 0 && box.top < columns[i - 1].bottom && box.left < columns[i - 1].right),
      spill: row ? row.scrollWidth - row.clientWidth : 0,
    };
  });
}

function expectFootFits(foot: Foot, label: string): void {
  expect(foot.pageWidth, `${label} page width`).toBeLessThanOrEqual(foot.viewport);
  expect(Math.max(...foot.rights), `${label} widest column edge`).toBeLessThanOrEqual(foot.viewport);
  expect(foot.crowded, `${label} columns overlap`).toBe(false);
  expect(foot.spill, `${label} column row spill`).toBeLessThanOrEqual(SLACK);
}

for (const prefix of FOOT_LOCALES) {
  for (const width of FOOT_WIDTHS) {
    test(`the footer with its Legal column fits at ${width} in ${prefix || '/en'}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(`${GA_ORIGIN}${prefix}/projects`);
      await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('footer.foot .foot-link')).toBeVisible();
      const written = await footGeometry(page);
      expectFootFits(written, 'as written');
      expect(written.blurb, 'the blurb keeps a readable measure').toBeGreaterThanOrEqual(BLURB_MIN);
      await padText(page);
      expectFootFits(await footGeometry(page), 'padded');
    });
  }
}

for (const width of WIDTHS) {
  test(`the consent bar fits at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.goto(`${GA_ORIGIN}/privacy`);
    await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
    const bar = page.getByRole('region', { name: 'Privacy choices' });
    await expect(bar).toBeVisible();
    const box = await bar.boundingBox();
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? width + 1)).toBeLessThanOrEqual(width);
    expect((box?.y ?? -1) + (box?.height ?? 0)).toBeLessThanOrEqual(HEIGHT);
    expect(box?.height ?? HEIGHT).toBeLessThan(HEIGHT / 2);
    expectFit(await measure(page), 'as written');
  });
}

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} fits at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(path);
      await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
      await page.evaluate(() => document.fonts.ready);
      expectFit(await measure(page), 'as written');
      await padText(page);
      expectFit(await measure(page), 'padded');
    });
  }
}
