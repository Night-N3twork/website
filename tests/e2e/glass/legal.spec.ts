import { expect, type Locator, type Page, test } from '@playwright/test';
import { GRAPH_NODES } from '../../../src/content/legal-graph';

const GA_ORIGIN = 'http://localhost:3002';
const GA_ID = 'G-TEST123';
const CONSENT_KEY = 'night-consent';
const PREFIXES = ['', '/es', '/fr', '/ja'];
const LEGAL = ['/privacy', '/terms', '/requests'];
const CLAUSE = 'acceptable-use';
const CLAUSE_TOP_MAX = 130;
const SIZE_SLACK = 2;
const MAX_TABS = 140;
const GRAPH = 'svg.legal-graph';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const stored = (page: Page) => page.evaluate((key) => localStorage.getItem(key), CONSENT_KEY);
const region = (page: Page) => page.getByRole('region', { name: 'Privacy choices' });

async function stubGoogle(page: Page): Promise<string[]> {
  const urls: string[] = [];
  await page.route('https://www.googletagmanager.com/**', (route) => {
    urls.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.dataLayer = window.dataLayer || [];' });
  });
  return urls;
}

async function openAsk(page: Page, path = '/privacy'): Promise<void> {
  await page.goto(`${GA_ORIGIN}${path}`);
  await ready(page);
  await expect(region(page)).toBeVisible();
}

test('the footer Legal links reach the three pages in every locale', async ({ page }) => {
  for (const prefix of PREFIXES) {
    await page.goto(prefix || '/');
    for (const path of LEGAL) await expect(page.locator(`footer.foot a[href="${prefix}${path}"]`)).toBeVisible();
  }
});

test('the footer offers no Cookie settings while nothing is measured', async ({ page }) => {
  await page.goto('/privacy');
  await ready(page);
  await expect(page.locator('footer.foot').getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.locator('footer.foot').getByRole('button', { name: 'Cookie settings' })).toHaveCount(0);
  await expect(page.locator('.consent')).toHaveCount(0);
});

test('a map node link lands on its clause', async ({ page }) => {
  await page.goto('/privacy');
  await ready(page);
  await page.locator(`${GRAPH} a[aria-label="Discord bots"]`).click();
  await expect(page).toHaveURL(/\/privacy#bots$/);
  await expect(page.locator('section#bots')).toBeInViewport();
});

test('the text list repeats every service and every collected item the map draws', async ({ page }) => {
  await page.goto('/privacy');
  await ready(page);
  await page.locator(GRAPH).waitFor();
  const nodes = await page.locator(`${GRAPH} a`).evaluateAll((els) => els.map((el) => [el.getAttribute('aria-label'), el.getAttribute('href')]));
  const items = await page.locator('.legal-graph-list a.legal-graph-item').evaluateAll((els) => els.map((el) => [el.textContent, el.getAttribute('href')]));
  expect(nodes).toHaveLength(GRAPH_NODES.length);
  expect(items).toHaveLength(GRAPH_NODES.filter((node) => node.kind !== 'data').length);
  for (const item of items) expect(nodes).toContainEqual(item);
  const collected = (await page.locator('.legal-graph-line dd').allInnerTexts()).join(', ');
  const dataLabels = await page.locator(`${GRAPH} a[data-kind="data"]`).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
  expect(dataLabels).toHaveLength(GRAPH_NODES.filter((node) => node.kind === 'data').length);
  for (const label of dataLabels) expect(collected, label).toContain(label);
});

test('the data map loads as its own chunk, on the privacy page only', async ({ page }) => {
  const chunks: string[] = [];
  page.on('response', (response) => {
    if (/\/assets\/LegalGraph-[^/]+\.js$/.test(response.url())) chunks.push(response.url());
  });
  await page.goto('/terms');
  await ready(page);
  await page.locator('html[data-scene="ready"]').waitFor({ state: 'attached', timeout: 20_000 });
  expect(chunks).toEqual([]);
  await page.goto('/privacy');
  await page.locator(GRAPH).waitFor();
  expect(chunks).toHaveLength(1);
});

test('no Google request before Accept, and measurement stops after Decline', async ({ page }) => {
  const google = await stubGoogle(page);
  await page.goto(`${GA_ORIGIN}/privacy`);
  await ready(page);
  await expect(region(page)).toBeVisible();
  expect(google).toEqual([]);
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect.poll(() => google.length).toBeGreaterThan(0);
  expect(await stored(page)).toBe('granted');
  await page.getByRole('button', { name: 'Cookie settings' }).click();
  await page.getByRole('button', { name: 'Decline' }).click();
  expect(await page.evaluate((id) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], GA_ID)).toBe(true);
  expect(await stored(page)).toBe('denied');
  const before = google.length;
  await page.reload();
  await ready(page);
  await expect(region(page)).toHaveCount(0);
  expect(google.length).toBe(before);
});

test('Accept and Decline are the same size', async ({ page }) => {
  await openAsk(page);
  const [accept, decline] = await Promise.all([page.getByRole('button', { name: 'Accept' }).boundingBox(), page.getByRole('button', { name: 'Decline' }).boundingBox()]);
  expect(Math.abs((accept?.width ?? 0) - (decline?.width ?? 1))).toBeLessThanOrEqual(SIZE_SLACK);
  expect(Math.abs((accept?.height ?? 0) - (decline?.height ?? 1))).toBeLessThanOrEqual(SIZE_SLACK);
});

test('the bar is a region named apart from its own link', async ({ page }) => {
  await openAsk(page);
  await expect(region(page).getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy');
  await expect(page.locator('section.consent')).toHaveAccessibleName('Privacy choices');
  await expect(page.locator('section.consent')).not.toHaveAccessibleName(/^Privacy$/);
});

test('Escape neither answers the question nor sends anything', async ({ page }) => {
  const google = await stubGoogle(page);
  await openAsk(page);
  await page.getByRole('button', { name: 'Accept' }).focus();
  await page.keyboard.press('Escape');
  await expect(region(page)).toBeVisible();
  expect(await stored(page)).toBeNull();
  expect(google).toEqual([]);
});

test('Cookie settings reopens the bar by keyboard and gives focus back on Decline', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'granted'), CONSENT_KEY);
  await stubGoogle(page);
  await page.goto(`${GA_ORIGIN}/privacy`);
  await ready(page);
  await expect(region(page)).toHaveCount(0);
  const settings = page.locator('footer.foot').getByRole('button', { name: 'Cookie settings' });
  await settings.focus();
  await page.keyboard.press('Enter');
  await expect(region(page)).toBeVisible();
  await page.getByRole('button', { name: 'Decline' }).focus();
  await page.keyboard.press('Enter');
  await expect(region(page)).toHaveCount(0);
  await expect(settings).toBeFocused();
  expect(await stored(page)).toBe('denied');
});

test('Accept on the reopened bar gives focus back too', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'denied'), CONSENT_KEY);
  const google = await stubGoogle(page);
  await page.goto(`${GA_ORIGIN}/terms`);
  await ready(page);
  const settings = page.locator('footer.foot').getByRole('button', { name: 'Cookie settings' });
  await settings.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(region(page)).toHaveCount(0);
  await expect(settings).toBeFocused();
  await expect.poll(() => google.length).toBeGreaterThan(0);
});

test('the bar comes after the footer in tab order and its buttons answer to Enter', async ({ page }) => {
  await openAsk(page, '/requests');
  const accept = page.getByRole('button', { name: 'Accept' });
  await page.locator('footer.foot').getByRole('button', { name: 'Cookie settings' }).focus();
  const seen: string[] = [];
  for (let i = 0; i < MAX_TABS && !(await accept.evaluate((el) => el === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ''));
  }
  await expect(accept).toBeFocused();
  expect(seen.at(-1)).toBe('Accept');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Decline' })).toBeFocused();
  expect(await page.getByRole('button', { name: 'Decline' }).evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
});

test('the pages are noindex while previewed and absent from the sitemap', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/projects');
  for (const path of LEGAL) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    expect(sitemap).not.toContain(path);
  }
});

test('an unknown locale prefix gives the 404 page', async ({ page }) => {
  for (const path of LEGAL) expect((await page.goto(`/xx${path}`))?.status(), path).toBe(404);
});

async function clauseTop(clause: Locator): Promise<number> {
  return clause.evaluate((el) => el.getBoundingClientRect().top);
}

for (const prefix of ['', '/es']) {
  test(`the conduct link on ${prefix}/community lands on the acceptable use clause, then Projects lands on top`, async ({ page }) => {
    await page.goto(`${prefix}/community`);
    await ready(page);
    await page.locator('canvas#gl').evaluate((el) => (el.dataset.probe = '1'));
    const link = page.locator('.notes a.note-link');
    await expect(link).toHaveAttribute('href', `${prefix}/terms#${CLAUSE}`);
    await link.scrollIntoViewIfNeeded();
    await link.click();
    await expect(page).toHaveURL(`${prefix}/terms#${CLAUSE}`);
    await expect(page.locator('canvas#gl[data-probe="1"]')).toBeAttached();
    const clause = page.locator(`section#${CLAUSE}`);
    await expect(async () => {
      const top = await clauseTop(clause);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(CLAUSE_TOP_MAX);
    }).toPass({ timeout: 10_000 });
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    const nav = page.locator('.nav');
    await expect(async () => {
      await page.mouse.wheel(0, -60);
      await expect(nav).not.toHaveClass(/is-hidden/, { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    await page.locator(`header.nav .nav-links a[href="${prefix}/projects"]`).click();
    await expect(page).toHaveURL(`${prefix}/projects`);
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(0);
  });
}

for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
  test(`every graph node, list link and index link takes keyboard focus with a visible indicator at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/privacy');
    await ready(page);
    await page.locator(GRAPH).waitFor();
    const lists = await page.locator('.legal-graph-list a').count();
    const indexes = await page.locator('.legal-index a').count();
    const stops: { part: string; label: string; ring: boolean }[] = [];
    for (let i = 0; i < MAX_TABS && stops.length < GRAPH_NODES.length + lists + indexes; i += 1) {
      await page.keyboard.press('Tab');
      const stop = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const part = el?.closest('svg.legal-graph') ? 'node' : el?.closest('.legal-graph-list') ? 'list' : el?.closest('.legal-index') ? 'index' : 'other';
        if (part === 'other' || !el) return { part, label: '', ring: false };
        const label = el.getAttribute('aria-label') ?? el.textContent?.trim() ?? '';
        if (part !== 'node') return { part, label, ring: getComputedStyle(el).outlineStyle !== 'none' };
        const hit = el.querySelector('.legal-graph-hit') as Element;
        const style = getComputedStyle(hit);
        return { part, label, ring: style.stroke !== 'none' && Number.parseFloat(style.strokeWidth) >= 2 && hit.getBoundingClientRect().width >= 24 };
      });
      if (stop.part !== 'other') stops.push(stop);
    }
    expect(stops.filter((s) => s.part === 'node')).toHaveLength(GRAPH_NODES.length);
    expect(stops.filter((s) => s.part === 'list')).toHaveLength(lists);
    expect(stops.filter((s) => s.part === 'index')).toHaveLength(indexes);
    expect(stops.filter((s) => !s.ring), JSON.stringify(stops.filter((s) => !s.ring))).toEqual([]);
  });
}
