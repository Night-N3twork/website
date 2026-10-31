import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const probe = (page: Page) => page.locator('canvas#gl').evaluate((el) => (el.dataset.probe = '1'));
const reach = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));

test('detail renders from the server', async ({ page }) => {
  await page.goto('/projects/link-archive');
  await ready(page);
  await expect(page.locator('h1#page-heading')).toHaveText('Link Archive');
  const live = page.locator('.detail-status .status-live');
  await expect(live).toHaveAttribute('data-state', 'up');
  await expect(live).toContainText('Up and running');
  await expect(page.locator('.sec-related a.row').first()).toBeAttached();
});

test('detail is server rendered before scripts run', async ({ request }) => {
  const response = await request.get('/projects/link-archive');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('Link Archive');
  expect(body).toContain('Up and running');
});

test('no monitor, no live line', async ({ page }) => {
  await page.goto('/projects/dusk');
  await ready(page);
  await reach(page, '.detail-status');
  await expect(page.locator('.detail-status')).toBeVisible();
  await expect(page.locator('.detail-status .chip')).toBeVisible();
  await expect(page.locator('.detail-status .status-live')).toHaveCount(0);
});

test('projects without features show no features card', async ({ page }) => {
  await page.goto('/projects/solar');
  await ready(page);
  await expect(page.locator('.detail-what')).toHaveCount(0);
  await expect(page.locator('.detail-status')).toBeVisible();
});

test('actions put the primary link first', async ({ page }) => {
  await page.goto('/projects/dusk');
  await ready(page);
  const buttons = page.locator('.sec-detail .actions .btn');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.first()).toHaveClass(/btn-primary/);
  await expect(buttons.first()).toHaveAttribute('href', 'https://github.com/Night-N3twork/Dusk');
  await expect(buttons.nth(1)).toHaveClass(/btn-ghost/);
});

test('related row navigates and keeps the canvas', async ({ page }) => {
  await page.goto('/projects/link-archive');
  await ready(page);
  await probe(page);
  await reach(page, '.sec-related a.row');
  const row = page.locator('.sec-related a.row').first();
  const href = await row.getAttribute('href');
  await row.click();
  await expect(page).toHaveURL(href ?? '');
  await expect(page.locator('canvas#gl[data-probe="1"]')).toBeAttached();
  await expect(page.locator('h1#page-heading')).toBeFocused();
});

test('detail frames', async ({ page }) => {
  await page.goto('/projects/dusk');
  await ready(page);
  await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'detail', { timeout: 5_000 });
});

test('unknown slug is a 404', async ({ request }) => {
  const response = await request.get('/projects/nope');
  expect(response.status()).toBe(404);
});

for (const width of [375, 1440]) {
  test(`live line keeps its height at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/projects/link-archive');
    await ready(page);
    await reach(page, '.detail-status');
    const heights = await page.locator('.detail-status .status-live').evaluate((el) => {
      const empty = el.cloneNode(true) as HTMLElement;
      empty.querySelector('.status-label')?.remove();
      empty.querySelectorAll('p').forEach((row) => (row.textContent = ''));
      el.after(empty);
      const pair = [el.getBoundingClientRect().height, empty.getBoundingClientRect().height];
      empty.remove();
      return pair;
    });
    expect(heights[0]).toBeCloseTo(heights[1], 0);
  });
}

test('only the up or down state is announced', async ({ page }) => {
  await page.goto('/projects/link-archive');
  await ready(page);
  await expect(page.locator('.detail-status [aria-live] .status-label')).toHaveCount(1);
  await expect(page.locator('.detail-status [aria-live] .status-checked, .detail-status [aria-live].status-checked')).toHaveCount(0);
  await expect(page.locator('.detail-status [aria-live]')).not.toContainText('Checked');
});

test('detail landmarks have distinct names', async ({ page }) => {
  await page.goto('/projects/link-archive');
  await ready(page);
  const names = await page.locator('main section').evaluateAll((sections) =>
    sections.flatMap((section) => {
      const by = section.getAttribute('aria-labelledby');
      const name = section.getAttribute('aria-label') ?? (by ? document.getElementById(by)?.textContent?.trim() : null);
      return name ? [name] : [];
    }),
  );
  expect(new Set(names).size).toBe(names.length);
});
