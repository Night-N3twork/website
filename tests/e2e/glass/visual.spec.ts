import { expect, type Page, test } from '@playwright/test';

const PAGES = [
  ['home', '/'],
  ['projects', '/projects'],
  ['project', '/projects/link-archive'],
  ['community', '/community'],
  ['contributors', '/contributors'],
  ['supporters', '/supporters'],
  ['lost', '/nope'],
] as const;
const WIDTHS = [320, 768, 1024, 1440];
const HEIGHT = 900;

async function settle(page: Page): Promise<void> {
  await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    for (const img of images) img.loading = 'eager';
    await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
  });
}

for (const [name, path] of PAGES) {
  for (const width of WIDTHS) {
    test(`${name} at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(path);
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        timeout: 30_000,
        mask: [page.locator('.status-checked')],
      });
    });
  }
}
