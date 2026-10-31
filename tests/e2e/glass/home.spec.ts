import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const toCatalog = async (page: Page) => {
  await page.locator('.sec-catalog').scrollIntoViewIfNeeded();
  await expect(page.locator('.sec-catalog .tabs')).toBeVisible();
};

test('home has every section in order', async ({ page }) => {
  await page.goto('/');
  const order = await page.locator('main > *').evaluateAll((els) => els.map((el) => el.getAttribute('data-frame') ?? el.className.split(' ')[0]));
  expect(order).toEqual(['hero', 'statement', 'products', 'marquee', 'catalog', 'flagship', 'community']);
  await expect(page.locator('.sec-hero .pill-dot')).toHaveCount(0);
});

test('catalog tabs work by keyboard', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await toCatalog(page);
  const browsers = page.getByRole('tab', { name: /Browsers/ });
  await browsers.focus();
  await page.keyboard.press('ArrowRight');
  const apps = page.getByRole('tab', { name: /Apps/ });
  await expect(apps).toBeFocused();
  await expect(apps).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-apps')).toBeVisible();
  await expect(page.locator('#panel-browsers')).toBeHidden();
  await page.keyboard.press('Home');
  await expect(browsers).toHaveAttribute('aria-selected', 'true');
});

test('hero ctas reach projects and community', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.locator('.sec-hero .actions a').first().click();
  await expect(page).toHaveURL('/projects');
  await page.goBack();
  await ready(page);
  await page.locator('.sec-hero .actions a').nth(1).click();
  await expect(page).toHaveURL('/community');
});

test('catalog row opens the project page', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await toCatalog(page);
  const row = page.locator('#panel-browsers a.row').first();
  await expect(row).toBeVisible();
  const href = await row.getAttribute('href');
  expect(href).toMatch(/^\/projects\/[a-z-]+$/);
  await row.click();
  await expect(page).toHaveURL(href!);
});

test('deck pins and steps through the platform', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const deck = page.locator('.sec-products');
  const current = page.locator('.deck-index button[aria-current="step"]');
  await expect(current).toHaveAttribute('data-index', '0');
  await deck.evaluate((el) => scrollTo(0, el.getBoundingClientRect().bottom + scrollY - innerHeight - 4));
  const last = String((await page.locator('.deck-index button').count()) - 1);
  await expect(current).toHaveAttribute('data-index', last);
});

