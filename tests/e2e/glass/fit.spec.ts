import { expect, type Page, test } from '@playwright/test';
import { padText } from './pseudo';

const PAGES = ['/', '/projects', '/projects/link-archive', '/community', '/contributors', '/supporters', '/nope'];
const WIDTHS = [320, 375, 768, 1024, 1440, 1920];
const HEIGHT = 900;
const SLACK = 1;

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
