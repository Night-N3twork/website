import { expect, type Page, test } from '@playwright/test';
import fr from '../../../messages/fr.json' with { type: 'json' };
import { getProject } from '../../../src/content/projects';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const probe = (page: Page) => page.locator('canvas#gl').evaluate((el) => (el.dataset.probe = '1'));
const probed = (page: Page) => page.locator('canvas#gl[data-probe="1"]');

test('nav links reach every page and keep the canvas', async ({ page }) => {
  page.on('console', (m) => console.log('PAGE LOG:', m.type(), m.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message, err.stack));
  await page.goto('/');
  await ready(page);
  await probe(page);
  for (const [label, path] of [['Projects', '/projects'], ['Community', '/community'], ['Contributors', '/contributors'], ['Supporters', '/supporters']]) {
    await page.locator('header.nav .nav-links').getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(path);
    await expect(page.locator('main [aria-current], header.nav [aria-current="page"]').first()).toBeAttached();
    await expect(probed(page)).toBeAttached();
  }
});

test('skip link moves focus to main', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('language switch keeps the shell and drops the prefix', async ({ page }) => {
  await page.goto('/es/projects');
  await ready(page);
  await probe(page);
  await page.locator('footer.foot').getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL('/projects');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://night-x.com/projects');
  await expect(probed(page)).toBeAttached();
});

test('footer Legal links navigate in app, keep the canvas and focus the heading', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await probe(page);
  for (const [label, path] of [['Privacy', '/privacy'], ['Terms', '/terms'], ['Requests', '/requests']]) {
    await page.locator('footer.foot').getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(page.locator('h1#page-heading')).toBeFocused();
    await expect(probed(page)).toBeAttached();
  }
});

test('language switch keeps a legal page and the shell', async ({ page }) => {
  await page.goto('/es/terms');
  await ready(page);
  await probe(page);
  await expect(page.locator('.legal-notice')).toBeVisible();
  await page.locator('footer.foot').getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL('/terms');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://night-x.com/terms');
  await expect(page.locator('.legal-notice')).toHaveCount(0);
  await expect(probed(page)).toBeAttached();
});

test('language switch translates the split headings', async ({ page }) => {
  await page.goto('/es');
  await ready(page);
  await page.locator('footer.foot').getByRole('link', { name: 'Français' }).click();
  await expect(page).toHaveURL('/fr');
  await expect(page.locator('h1.headline')).toHaveText(fr.home.hero.headline);
  await expect(page.locator('h1.headline')).not.toHaveAttribute('aria-label', /Llevamos/);
  await expect(page.locator('main h2.title').first()).toHaveText(fr.home.products.title);
});

test('moving between two projects swaps the split title', async ({ page }) => {
  const next = getProject('dpm');
  if (!next) throw new Error('dpm');
  await page.goto('/projects/dusk');
  await ready(page);
  const link = page.locator(`main a[href="/projects/${next.slug}"]`).first();
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(`/projects/${next.slug}`);
  await expect(page.locator('h1').first()).toHaveText(next.name);
});

test('rail jumps to a section on home', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const ticks = page.locator('nav.rail .rail-tick');
  await expect(ticks.first()).toBeAttached();
  await expect(async () => {
    await ticks.nth(1).click();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 2000 }).toBeGreaterThan(200);
  }).toPass({ timeout: 15_000 });
});

test.describe('narrow', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('menu opens, traps focus and closes on Escape', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const trigger = page.getByRole('button', { name: 'Menu' });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('menu reopens after the browser closes it', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const trigger = page.getByRole('button', { name: 'Menu' });
    await trigger.click();
    await page.getByRole('dialog').evaluate((el) => (el as HTMLDialogElement).close());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('menu link navigates and closes', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('short landscape', () => {
  test.use({ viewport: { width: 568, height: 320 } });

  test('every menu link can be reached', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    const last = page.getByRole('dialog').getByRole('link', { name: '日本語' });
    await last.scrollIntoViewIfNeeded();
    const fits = await last.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const frame = el.closest('dialog')!.getBoundingClientRect();
      return box.bottom <= Math.min(frame.bottom, innerHeight) && box.top >= frame.top;
    });
    expect(fits).toBe(true);
  });
});

test('the footer wordmark keeps its word space', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const width = await page.locator('.foot-word .foot-char').nth(5).evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(4);
});

test('nav hides on the way down and returns on the way up', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  const nav = page.locator('.nav');
  await expect(nav).toHaveCSS('opacity', '1');
  await expect(async () => {
    await page.mouse.wheel(0, 600);
    await expect(nav).toHaveClass(/is-hidden/, { timeout: 1000 });
  }).toPass();
  await expect.poll(() => nav.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  await page.mouse.wheel(0, -400);
  await expect(nav).not.toHaveClass(/is-hidden/);
  await expect.poll(() => nav.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
});

const wheelUntil = async (page: Page, dy: number, check: () => Promise<void>) => {
  await expect(async () => {
    await page.mouse.wheel(0, dy);
    await check();
  }).toPass({ timeout: 20_000 });
};

test('footer word shows after a client navigation from home', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.locator('.nav-links a[href="/projects"]').click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('h1#page-heading')).toBeFocused();
  const last = page.locator('.foot-word .foot-char').last();
  await wheelUntil(page, 1500, async () => expect.poll(() => last.evaluate((el) => getComputedStyle(el).opacity), { timeout: 1500 }).toBe('1'));
});

test('nav returns on the way up after a client navigation to home', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  await page.locator('.nav .brand').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('h1#page-heading')).toBeFocused();
  const nav = page.locator('.nav');
  await wheelUntil(page, 1500, async () => expect(await page.evaluate(() => scrollY)).toBeGreaterThan(5000));
  await expect(nav).toHaveClass(/is-hidden/);
  await page.mouse.wheel(0, -400);
  await expect(nav).not.toHaveClass(/is-hidden/);
});

test('hovering the brand thins the crescent instead of hollowing it', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  const brand = page.locator('header.nav .brand');
  await brand.hover();
  await expect
    .poll(() => brand.locator('.mark-shadow').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a), { timeout: 10_000 })
    .toBeGreaterThan(1.15);
  const shape = await brand.evaluate((el) => {
    const shadow = el.querySelector<SVGCircleElement>('.mark-shadow');
    const moon = el.querySelector<SVGCircleElement>('svg > circle');
    if (!shadow || !moon) return null;
    const m = new DOMMatrix(getComputedStyle(shadow).transform);
    const origin = getComputedStyle(shadow).transformBox;
    const r = shadow.r.baseVal.value * m.a;
    const d = Math.hypot(shadow.cx.baseVal.value - moon.cx.baseVal.value, shadow.cy.baseVal.value - moon.cy.baseVal.value);
    return { scale: m.a, shear: m.b, origin, r, d, R: moon.r.baseVal.value };
  });
  expect(shape).not.toBeNull();
  if (!shape) return;
  expect(shape.origin).toBe('fill-box');
  expect(shape.shear).toBe(0);
  expect(shape.scale).toBeGreaterThan(1);
  expect(shape.r).toBeGreaterThanOrEqual(shape.R - shape.d);
  expect(shape.r).toBeLessThan(shape.R + shape.d);
});
