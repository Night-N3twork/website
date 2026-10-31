import { expect, test } from '@playwright/test';

test('reduced motion shows content immediately', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('h1#page-heading')).toBeVisible();
  await expect(page.locator('#loader')).not.toBeAttached();
  await page.goto('/');
  await expect(page.locator('h1#page-heading')).toBeVisible();
  await expect(page.locator('#loader')).not.toBeAttached();
});

test('reduced motion marks the scene ready once the still frame is drawn', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 });
});

test('filter works in reduced motion', async ({ page }) => {
  await page.goto('/projects');
  const browsers = page.locator('.filter [data-filter="browsers"]');
  await browsers.click();
  await expect(browsers).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.index-group:visible')).toHaveCount(1);
  await expect(page.locator('[data-group="browsers"]')).toBeVisible();
});
