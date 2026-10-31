import { expect, test } from '@playwright/test';

const html = async (request: import('@playwright/test').APIRequestContext, path: string) => (await request.get(path)).text();
const ldTypes = (body: string) => [...body.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);

test('home has canonical, share card and site structured data', async ({ request }) => {
  const body = await html(request, '/');
  expect(body).toContain('<link rel="canonical" href="https://night-x.com"');
  expect(body).toContain('content="https://night-x.com/en/opengraph-image"');
  expect(ldTypes(body)).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
});

test('a localized page points its canonical and alternates at itself', async ({ request }) => {
  const body = await html(request, '/es/projects');
  expect(body).toContain('<link rel="canonical" href="https://night-x.com/es/projects"');
  expect(body).toContain('hrefLang="x-default" href="https://night-x.com/projects"');
  expect(body).toContain('content="es_ES"');
  expect(body).toContain('<html lang="es"');
});

test('a project page has its own card and structured data', async ({ request }) => {
  const body = await html(request, '/projects/dusk');
  expect(body).toContain('content="https://night-x.com/en/projects/dusk/opengraph-image"');
  expect(ldTypes(body)).toEqual(expect.arrayContaining(['SoftwareApplication', 'BreadcrumbList']));
});

test('a missing page is noindex', async ({ request }) => {
  const body = await html(request, '/nope');
  expect(body).toContain('<meta name="robots" content="noindex"');
  expect(body).not.toContain('rel="canonical"');
});

test('a thrown 404 under an unknown locale is noindex too', async ({ request }) => {
  const res = await request.get('/xx/projects');
  expect(res.status()).toBe(404);
  const body = await res.text();
  expect(body).toContain('<meta name="robots" content="noindex"');
  expect(body).toContain('<title>Page not found · Night Network</title>');
});

test('pages load without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  for (const path of ['/', '/projects']) {
    await page.goto(path);
    await page.waitForSelector('html.intro-done', { timeout: 20_000 });
  }
  expect(errors).toEqual([]);
});

test('no third-party requests for fonts or backdrops', async ({ page }) => {
  const thirdParty: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || url.includes('images.unsplash.com')) {
      thirdParty.push(url);
    }
  });
  for (const path of ['/', '/projects']) {
    await page.goto(path);
    await page.waitForSelector('html.intro-done', { timeout: 20_000 });
  }
  expect(thirdParty).toEqual([]);
});
