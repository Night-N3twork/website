import { expect, type Page, test } from '@playwright/test';

const PAGES = ['/', '/projects', '/projects/link-archive', '/community', '/contributors', '/supporters', '/nope'];
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

test('no csp violations on any page with ga', async ({ page }) => {
  test.slow();
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.dataLayer = window.dataLayer || [];' }),
  );
  const getViolations = monitorViolations(page);
  for (const path of PAGES) {
    await page.goto(`${GA_ORIGIN}${path}`);
    await page.waitForSelector('html.intro-done', { timeout: 20_000 });
    await page.waitForSelector('html[data-scene="ready"]', { timeout: 20_000 });
    const violations = await getViolations();
    expect(violations).toEqual([]);
  }
});
