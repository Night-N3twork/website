import { expect, test } from '@playwright/test';

test('pages carry the security headers', async ({ request }) => {
  const res = await request.get('/');
  const headers = res.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['content-security-policy']).toBeTruthy();
});

test('hashed scripts are served with immutable caching', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const src = /<script type="module" src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1] ?? /<link rel="modulepreload" href="(\/assets\/[^"]+\.js)"/.exec(html)?.[1];
  expect(src).toBeTruthy();
  const asset = await request.get(src as string);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('resource routes answer through the server', async ({ request }) => {
  const status = await request.get('/api/status');
  expect(status.headers()['content-type']).toContain('application/json');
  expect(status.headers()['cache-control']).toBe('public, max-age=30, s-maxage=30, stale-while-revalidate=60');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toBe('application/xml');
  expect(await sitemap.text()).toContain('https://night-x.com/es/projects/dusk');
  expect((await request.get('/robots.txt')).headers()['content-type']).toBe('text/plain');
  expect((await request.get('/manifest.webmanifest')).headers()['content-type']).toBe('application/manifest+json');
  expect((await request.get('/en/opengraph-image')).headers()['content-type']).toBe('image/png');
  expect((await request.get('/es/projects/dusk/opengraph-image')).headers()['content-type']).toBe('image/png');
  expect((await request.post('/api/revalidate?tag=uptime')).status()).toBe(404);
});
