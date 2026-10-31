import { expect, test } from '@playwright/test';

test('home renders server-side', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<main');
  expect(html).toContain('__reactRouterContext');
});

test('projects renders and unknown locale is a 404', async ({ request }) => {
  expect((await request.get('/projects')).status()).toBe(200);
  expect((await request.get('/es/projects')).status()).toBe(200);
  expect((await request.get('/xx/projects')).status()).toBe(404);
});
