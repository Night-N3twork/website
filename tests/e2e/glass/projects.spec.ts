import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const visibleGroups = (page: Page) => page.locator('.index-group:visible').evaluateAll((els) => els.map((el) => el.getAttribute('data-group')));

test('filter shows one group', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const apps = page.locator('.filter [data-filter="apps"]');
  await apps.click();
  await expect(apps).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.filter [data-filter="all"]')).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => visibleGroups(page)).toEqual(['apps']);
});

test('filter reveals a group that started below the fold', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await page.locator('.filter [data-filter="apps"]').click();
  for (const part of ['.index-head', '.index-panel']) await expect(page.locator(`[data-group="apps"] ${part}`)).toHaveCSS('opacity', '1');
});

test('filter buttons read their label and count', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await expect(page.locator('.filter [data-filter="apps"]')).toHaveAccessibleName(/^Apps \d+$/);
});

test('filter survives rapid clicks and leaving', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  for (const value of ['apps', 'browsers', 'all', 'platform']) await page.locator(`.filter [data-filter="${value}"]`).click({ delay: 0 });
  await page.locator('[data-group="platform"] a.index-row').first().click();
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('.filter [data-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => visibleGroups(page)).toEqual(['platform', 'apps', 'browsers']);
  await expect.poll(() => page.locator('.index-group').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))).toEqual(['1', '1', '1']);
});

test('status labels and the current language carry no dot', async ({ page }) => {
  const marks = (selector: string) => page.locator(selector).evaluateAll((els) => els.map((el) => getComputedStyle(el, '::before').content));
  await page.goto('/projects');
  await ready(page);
  const chips = await marks('.chip');
  expect(chips.length).toBeGreaterThan(0);
  expect(new Set([...chips, ...(await marks('.langs a[aria-current]'))])).toEqual(new Set(['none']));
  await page.goto('/projects/link-archive');
  await ready(page);
  await expect(page.locator('.detail-status .status-label')).toHaveCount(1);
  expect(await marks('.detail-status .status-label')).toEqual(['none']);
});
