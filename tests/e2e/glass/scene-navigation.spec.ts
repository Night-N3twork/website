import { expect, type Page, test } from '@playwright/test';

const introDone = (page: Page) => expect(page.locator('html.intro-done')).toBeAttached({ timeout: 20_000 });

test('canvas survives navigation', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.locator('canvas#gl').evaluate((el) => {
    el.dataset.probe = '1';
  });
  await page.locator('.nav-links a', { hasText: 'Projects' }).click();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  await expect(page.locator('canvas[data-probe="1"]')).toBeAttached();
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'page', { timeout: 5_000 });
});

test('intro plays on a first load of an inner page', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('#loader')).toBeAttached();
  await introDone(page);
  await expect(page.locator('#loader')).not.toBeAttached();
  await expect(page.locator('h1#page-heading')).toBeVisible();
});

test('client navigation never replays the intro', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  const nav = page.locator('.nav-links a', { hasText: 'Projects' });
  await nav.click();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  await page.locator('.nav .brand').click();
  await expect(page.locator('body[data-route="home"]')).toBeAttached();
  await nav.click();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  await expect(page.locator('#loader')).not.toBeAttached();
  await expect(page.locator('#veil')).not.toBeAttached();
});

test('back mid-transition lands home with the page visible', async ({ page }) => {
  await page.goto('/');
  await introDone(page);
  await page.locator('.nav-links a', { hasText: 'Projects' }).click();
  await page.waitForURL('**/projects');
  await page.goBack();
  await expect(page.locator('body[data-route="home"]')).toBeAttached({ timeout: 3_000 });
  await expect(page.locator('main')).toHaveCSS('opacity', '1', { timeout: 3_000 });
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'hero', { timeout: 3_000 });
});

test('pages work without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return original.call(this, type as '2d', ...(rest as []));
    } as typeof original;
  });
  await page.goto('/');
  await introDone(page);
  await expect(page.locator('h1#page-heading')).toBeVisible();
  await page.locator('.nav-links a', { hasText: 'Projects' }).click();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  await expect(page.locator('h1#page-heading')).toBeVisible();
});

test('a client navigation to a project page finishes its transition', async ({ page }) => {
  await page.goto('/projects');
  await introDone(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.locator('canvas#gl').evaluate((el) => {
    el.dataset.probe = '1';
  });
  await page.locator('a.index-row').first().click();
  await expect(page.locator('body[data-route="project"]')).toBeAttached();
  await expect(page.locator('canvas[data-probe="1"]')).toBeAttached();
  await expect(page.locator('main')).toHaveCSS('opacity', '1', { timeout: 2_000 });
  await expect(page.locator('.route-bar')).toHaveCSS('transform', /matrix\(0, 0, 0, 1|none/, { timeout: 2_000 });
  await expect(page.locator('#page-heading')).toBeFocused({ timeout: 2_000 });
  expect(errors).toEqual([]);
});

test('links keep the visitor in their language', async ({ page }) => {
  await page.goto('/es');
  await introDone(page);
  await page.locator('.nav-links a').first().click();
  await expect(page).toHaveURL(/\/es\/projects$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('.nav-links a').first()).toHaveAttribute('aria-current', 'page');
});

test('back during the leave lands on the history entry, not the clicked link', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await introDone(page);
  await page.locator('.nav-links a', { hasText: 'Projects' }).click();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  await page.locator('a.index-row').first().click();
  await expect(page.locator('body[data-route="project"]')).toBeAttached();
  await expect(page.locator('main')).toHaveCSS('opacity', '1');
  await page.locator('.nav .brand').click();
  await page.waitForTimeout(150);
  await page.goBack();
  await expect(page.locator('body[data-route="projects"]')).toBeAttached({ timeout: 3_000 });
  await expect(page.locator('main')).toHaveCSS('opacity', '1', { timeout: 3_000 });
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'page', { timeout: 3_000 });
  await page.waitForTimeout(800);
  await expect(page.locator('body[data-route="projects"]')).toBeAttached();
  expect(errors).toEqual([]);
});
