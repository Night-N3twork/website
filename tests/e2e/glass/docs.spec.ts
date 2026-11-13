import { expect, type Page, test } from '@playwright/test';

const ready = (page: Page) => page.waitForSelector('html.intro-done', { timeout: 20_000 });
const PHONE = { width: 375, height: 812 };

test('the header Docs tab opens the docs home in every locale', async ({ page }) => {
  for (const prefix of ['', '/ja']) {
    await page.goto(prefix || '/');
    await ready(page);
    await page.locator('.nav-links').getByRole('link', { name: prefix ? 'ドキュメント' : 'Docs' }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/docs$`));
    await expect(page.locator('main h1')).toHaveText('NightDocs');
    await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveAttribute('href', `${prefix}/docs`);
  }
});

test('the sidebar moves between pages without a reload and keeps its place', async ({ page }) => {
  await page.goto('/docs/moonbeam/api-reference');
  await ready(page);
  await page.evaluate(() => Object.assign(window, { __stayed: true }));
  await page.locator('.docs-nav').getByRole('link', { name: 'Architecture' }).first().click();
  await expect(page).toHaveURL(/\/docs\/moonbeam\/architecture$/);
  await expect(page.locator('main h1')).toHaveText('Architecture');
  await expect(page.locator('.docs-prose h2').first()).toBeVisible();
  await expect(page.locator('.docs-nav-link[aria-current="page"]')).toHaveText('Architecture');
  expect(await page.evaluate(() => (window as unknown as { __stayed?: boolean }).__stayed)).toBe(true);
});

test('on this page follows the reader down the article', async ({ page }) => {
  await page.goto('/docs/services/daydream/configuration');
  await ready(page);
  const last = page.locator('.docs-toc-link').last();
  await expect(last).not.toHaveAttribute('aria-current');
  await page.locator('.docs-prose h2').last().evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
  await expect(last).toHaveAttribute('aria-current', 'location');
});

test('the server-rendered article survives hydration', async ({ page }) => {
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      const replaced = records.some((record) => record.target instanceof Element && record.target.closest('.docs-prose') && [...record.removedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'TEMPLATE'));
      if (replaced) Object.assign(window, { __replaced: true });
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/docs/services/daydream/configuration');
  await ready(page);
  await expect(page.locator('.docs-prose h2').first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __replaced?: boolean }).__replaced ?? false)).toBe(false);
});

test('the sidebar shows the current page when it sits low in the index', async ({ page }) => {
  await page.goto('/docs/reference/limitations');
  await ready(page);
  const shown = await page.evaluate(() => {
    const side = document.querySelector('.docs-side');
    const link = side?.querySelector('[aria-current="page"]');
    if (!side || !link) return false;
    const box = side.getBoundingClientRect();
    const spot = link.getBoundingClientRect();
    return spot.top >= box.top - 1 && spot.bottom <= box.bottom + 1;
  });
  expect(shown).toBe(true);
});

test('the pager walks the sidebar order', async ({ page }) => {
  await page.goto('/docs/dusk/installation');
  await ready(page);
  const next = page.locator('.docs-pager-link[data-dir="next"]');
  await expect(next).toHaveAttribute('href', '/docs/dusk/integration');
  await expect(page.locator('.docs-pager-link[data-dir="previous"]')).toHaveAttribute('href', /\/docs\/dusk\/dpm\/troubleshooting$/);
});

test('code blocks carry their language and a copy button', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/dusk/installation');
  await ready(page);
  const block = page.locator('.doc-code').first();
  await expect(block.locator('.doc-code-lang')).toHaveText('sh');
  await block.getByRole('button', { name: 'Copy' }).click();
  await expect(block.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm install @nightnetwork/dusk@1.0.1');
});

test('drafts and dropped placeholders are not served', async ({ page }) => {
  for (const path of ['/docs/eclipse', '/docs/reference/eclipse-api', '/docs/services/umbra', '/docs/guides/migrations']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
  await page.goto('/docs/reference/limitations');
  await expect(page.locator('.docs-prose a', { hasText: 'Eclipse' })).toHaveCount(0);
});

test('translated chrome keeps English docs out of the index', async ({ page }) => {
  await page.goto('/ja/docs/dusk/installation');
  await ready(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/docs\/dusk\/installation$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('.docs-notice')).toBeVisible();
  await expect(page.locator('.docs-prose')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.doc-code-copy').first()).toHaveAttribute('lang', 'ja');
  await expect(page.locator('nav#docs-nav')).not.toHaveAttribute('lang');
  await expect(page.locator('.docs-nav a[href="/ja/docs/dusk/integration"]')).toHaveCount(1);
});

test('docs pages load without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  for (const path of ['/docs', '/docs/dusk/installation', '/ja/docs/dusk/installation']) {
    await page.goto(path);
    await ready(page);
  }
  expect(errors).toEqual([]);
});

test('the phone index opens from its toggle', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/docs/dusk/installation');
  await ready(page);
  const toggle = page.getByRole('button', { name: 'Browse the docs' });
  await expect(page.locator('#docs-nav')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#docs-nav').getByRole('link', { name: 'Installation' })).toBeVisible();
});
