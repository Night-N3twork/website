import { type ChildProcess, spawn } from 'node:child_process';
import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const reach = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
const BROKEN_PORT = 3125;

test('contributors are grouped by role', async ({ page }) => {
  await page.goto('/contributors');
  await ready(page);
  await expect(page.locator('h1#page-heading')).toHaveText("Night's volunteers");
  const groups = page.locator('.people-group');
  await expect(groups.first()).toHaveAttribute('data-group', 'owner');
  await expect(groups.first().locator('.people-title')).toHaveText('Owners');
  await expect(groups.first().locator('.people-subnote')).toHaveText('All owners are developers.');
  await expect(groups.first().locator('.person')).toHaveCount(4);
  const order = await groups.evaluateAll((els) => els.map((el) => el.getAttribute('data-group')));
  expect(order).toEqual(['owner', 'co-owner', 'director', 'developer', 'admin', 'mod', 'marketer'].filter((role) => order.includes(role)));
  const avatars = page.locator('.person img');
  expect(await avatars.count()).toBeGreaterThan(10);
  for (const size of await avatars.evaluateAll((els) => els.map((el) => [el.getAttribute('width'), el.getAttribute('height')]))) expect(size).toEqual(['48', '48']);
  await expect(page.locator('.person a[href="https://amplifydev.tech"]')).toHaveAttribute('target', '_blank');
});

test('supporters show boosters and donators', async ({ page }) => {
  await page.goto('/supporters');
  await ready(page);
  await expect(page.locator('h1#page-heading')).toHaveText('Who keeps Night running');
  await expect(page.locator('.sec-page .actions .btn')).toHaveCount(2);
  const groups = page.locator('.people-group');
  await expect(groups).toHaveCount(2);
  await expect(groups.nth(0)).toHaveAttribute('data-group', 'boosters');
  await expect(groups.nth(0).locator('.person')).toHaveCount(4);
  await expect(groups.nth(1)).toHaveAttribute('data-group', 'donators');
  await reach(page, '[data-group="donators"]');
  await expect(groups.nth(1).locator('.people-note')).toHaveText('Nobody here yet.');
  await expect(page.locator('.people-tiers .tier-name')).toHaveText('Night+');
  await expect(page.locator('.people-tiers .tier-price')).toHaveText('$9.99 a month on Patreon');
  await expect(page.locator('.people-tiers .tier-perks li')).toHaveCount(6);
});

test('people pages keep the glass following', async ({ page }) => {
  for (const path of ['/contributors', '/supporters']) {
    await page.goto(path);
    await ready(page);
    await expect(page.locator('canvas#gl')).toHaveAttribute('data-frame-target', 'page', { timeout: 5_000 });
  }
});

test.describe('when Discord is down', () => {
  let server: ChildProcess | null = null;

  test.beforeAll(async () => {
    server = spawn('node', ['build/server.mjs'], {
      env: {
        ...process.env,
        PORT: String(BROKEN_PORT),
        UPTIME_KUMA_BASE: 'http://127.0.0.1:3900',
        UPTIME_KUMA_SLUG: 'all',
        DISCORD_API_BASE: 'http://127.0.0.1:9/discord',
        DISCORD_CDN_BASE: 'http://127.0.0.1:9/cdn',
        DISCORD_BOT_TOKEN: 'browser-tests',
        DISCORD_GUILD_ID: '1158510129075982467',
        DISCORD_BOOSTER_ROLE_ID: '1198297300477432099',
        REVALIDATE_SECRET: '',
        GA_ID: '',
      },
      stdio: 'ignore',
    });
    await expect.poll(async () => fetch(`http://127.0.0.1:${BROKEN_PORT}/`).then((r) => r.status).catch(() => 0), { timeout: 20_000 }).toBe(200);
  });

  test.afterAll(() => {
    server?.kill();
  });

  test('supporters say so when Discord fails', async ({ request }) => {
    const body = await (await request.get(`http://127.0.0.1:${BROKEN_PORT}/supporters`)).text();
    expect(body).toContain("The booster list didn&#x27;t load from Discord. Try again in a few minutes.");
    expect(body).toContain('Donators');
  });

  test('contributors fall back to the avatar route', async ({ request }) => {
    const body = await (await request.get(`http://127.0.0.1:${BROKEN_PORT}/contributors`)).text();
    expect(body).toContain('/api/users/1199165998998245377/avatar');
  });
});
