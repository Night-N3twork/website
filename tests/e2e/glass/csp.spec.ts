import { expect, type Page, test } from '@playwright/test';

const PAGES = ['/', '/projects', '/projects/link-archive', '/community', '/contributors', '/supporters', '/privacy', '/terms', '/requests', '/nope'];
const GA_ORIGIN = 'http://localhost:3002';

function monitorViolations(page: Page): () => Promise<unknown[]> {
  const violations: unknown[] = [];
  page.exposeFunction('__onViolation', (v: unknown) => violations.push(v)).catch(() => undefined);
  page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __onViolation?: (v: unknown) => void }).__onViolation?.({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });
    });
  });
  return async () => violations;
}

test('every inline script carries the header nonce', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  const csp = response?.headers()['content-security-policy'] ?? '';
  const match = csp.match(/'nonce-([^']+)'/);
  expect(match).toBeTruthy();
  const nonce = match?.[1];

  await page.waitForSelector('html.intro-done', { timeout: 20_000 });
  const nonces = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script:not([src])'));
    return scripts.map((s) => s.getAttribute('nonce') || s.nonce);
  });
  expect(nonces.length).toBeGreaterThan(0);
  for (const n of nonces) {
    expect(n).toBe(nonce);
  }
});

test('no csp violations on any page', async ({ page }) => {
  test.slow();
  const getViolations = monitorViolations(page);
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForSelector('html.intro-done', { timeout: 20_000 });
    await page.waitForSelector('html[data-scene="ready"]', { timeout: 20_000 });
    const violations = await getViolations();
    expect(violations).toEqual([]);
  }
});

async function countGoogleRequests(page: Page): Promise<() => number> {
  let requests = 0;
  await page.route('https://www.googletagmanager.com/**', (route) => {
    requests += 1;
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.dataLayer = window.dataLayer || [];' });
  });
  return () => requests;
}

async function settle(page: Page, path: string): Promise<void> {
  await page.goto(`${GA_ORIGIN}${path}`);
  await page.waitForSelector('html.intro-done', { timeout: 20_000 });
  await page.waitForSelector('html[data-scene="ready"]', { timeout: 20_000 });
}

test('no csp violations on any page with ga after a stored grant', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => localStorage.setItem('night-consent', 'granted'));
  const googleRequests = await countGoogleRequests(page);
  const getViolations = monitorViolations(page);
  for (const [index, path] of PAGES.entries()) {
    await settle(page, path);
    if (index === 0) await expect.poll(googleRequests).toBeGreaterThan(0);
    const violations = await getViolations();
    expect(violations).toEqual([]);
  }
});

for (const path of PAGES) {
  test(`a fresh visitor who accepts on ${path} loads google without a csp violation`, async ({ page }) => {
    const googleRequests = await countGoogleRequests(page);
    const getViolations = monitorViolations(page);
    await settle(page, path);
    expect(googleRequests()).toBe(0);
    await page.getByRole('button', { name: 'Accept' }).click();
    await expect.poll(googleRequests).toBeGreaterThan(0);
    await expect(page.getByRole('region', { name: 'Privacy choices' })).toHaveCount(0);
    expect(await getViolations()).toEqual([]);
  });
}

test('nothing reaches google before consent, and the bar asks', async ({ page }) => {
  const googleRequests = await countGoogleRequests(page);
  const getViolations = monitorViolations(page);
  await settle(page, '/');
  await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();
  expect(googleRequests()).toBe(0);
  expect(await getViolations()).toEqual([]);
});
