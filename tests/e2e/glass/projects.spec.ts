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
  await expect.poll(() => visibleGroups(page)).toEqual(['apps']);
  await page.locator('[data-group="apps"] .index-panel').scrollIntoViewIfNeeded();
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

const band = (page: Page) => page.getByRole('region', { name: 'Screenshots' });
const shotGroups = (page: Page) => band(page).locator('.shot').evaluateAll((els) => els.map((el) => el.getAttribute('data-group')));

test('screenshots step with next and previous', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const total = await band(page).locator('.shot').count();
  test.skip(total < 2, 'needs two screenshots');
  const prev = band(page).getByRole('button', { name: 'Previous screenshot' });
  const next = band(page).getByRole('button', { name: 'Next screenshot' });
  const reel = band(page).locator('.shots-reel .sr-only');
  await expect(prev).toHaveAttribute('aria-disabled', 'true');
  for (let i = 2; i <= total; i += 1) {
    await next.click();
    await expect(reel).toHaveText(String(i).padStart(2, '0'));
  }
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeFocused();
  await prev.click();
  await expect(prev).toHaveAttribute('aria-disabled', 'false');
  await expect(reel).toHaveText(String(total - 1).padStart(2, '0'));
});

test('screenshots follow the filter', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const groups = await shotGroups(page);
  for (const value of ['platform', 'apps', 'browsers', 'all']) {
    await page.locator(`.filter [data-filter="${value}"]`).click();
    const expected = value === 'all' ? groups.length : groups.filter((group) => group === value).length;
    await expect(band(page).locator('.shot')).toHaveCount(expected);
    if (expected === 0) await expect(band(page)).toHaveCount(0);
    if (expected === 1) await expect(band(page).locator('.shots-bar')).toHaveCount(0);
  }
});

test('a screenshot opens its project', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const link = band(page).locator('a.shot-link').first();
  const href = await link.getAttribute('href');
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});
