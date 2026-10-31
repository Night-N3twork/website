import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const reach = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
const LOST_TITLE = 'Ventured too far into the Night.';

test('community shows partners and notes', async ({ page }) => {
  await page.goto('/community');
  await ready(page);
  await expect(page.locator('h1#page-heading')).toHaveText('Where to find Night');
  await expect(page.locator('.sec-page .actions .btn')).toHaveCount(3);
  await expect(page.locator('.sec-page .actions .btn').first()).toHaveClass(/btn-primary/);
  await expect(page.locator('.notes .note')).toHaveCount(2);
  await expect(page.locator('.notes .note.is-pending .note-caret')).toHaveCount(1);
  await reach(page, '.partners');
  await expect(page.locator('.partners a.partner')).toHaveCount(5);
  await expect(page.locator('.partners a.partner').first()).toHaveAttribute('target', '_blank');
});

test('community frames', async ({ page }) => {
  await page.goto('/community');
  await ready(page);
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'page', { timeout: 5_000 });
});

test('unknown slug is a shelled 404', async ({ page, request }) => {
  for (const path of ['/projects/nope', '/xx/projects/dusk', '/nope']) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).toContain(LOST_TITLE);
    expect(body).toContain('<meta name="robots" content="noindex"');
  }
  await page.goto('/projects');
  await ready(page);
  await page.locator('canvas#gl').evaluate((el) => (el.dataset.probe = '1'));
  await page.evaluate(() => (window as unknown as { __reactRouterDataRouter: { navigate: (to: string) => Promise<void> } }).__reactRouterDataRouter.navigate('/projects/nope'));
  await expect(page.locator('h1#page-heading')).toHaveText(LOST_TITLE);
  await expect(page.locator('.lost-code')).toContainText('404');
  await expect(page.locator('canvas#gl[data-probe="1"]')).toBeAttached();
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'lost', { timeout: 5_000 });
});

test('404 button reaches the projects', async ({ page }) => {
  await page.goto('/nope');
  await ready(page);
  await page.locator('.sec-lost .actions .btn-primary').click();
  await expect(page).toHaveURL('/projects');
  await expect(page.locator('h1#page-heading')).toBeFocused();
});

for (const path of ['/nope', '/xx']) {
  test(`a one segment 404 at ${path} is the lost page, not home`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    await expect(page.locator('body')).toHaveAttribute('data-route', 'lost');
    await expect(page.locator('.rail')).toHaveCount(0);
    await expect(page.locator('.lost-reel [data-cycle="1"]').first()).toBeAttached();
    await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'lost', { timeout: 5_000 });
  });
}

test('a client navigation to a one segment 404 spins the reel and focuses the heading', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await page.evaluate(() => (window as unknown as { __reactRouterDataRouter: { navigate: (to: string) => Promise<void> } }).__reactRouterDataRouter.navigate('/nope'));
  await expect(page.locator('h1#page-heading')).toHaveText(LOST_TITLE);
  await expect(page.locator('body')).toHaveAttribute('data-route', 'lost');
  await expect(page.locator('.rail')).toHaveCount(0);
  await expect(page.locator('.lost-reel [data-cycle="1"]').first()).toBeAttached();
  await expect(page.locator('h1#page-heading')).toBeFocused();
});
