import { expect, test } from '@playwright/test';

const get = (request: import('@playwright/test').APIRequestContext, path: string) => request.get(path, { maxRedirects: 0 });

test('english prefix redirects to the bare path', async ({ request }) => {
  const res = await get(request, '/en/projects');
  expect(res.status()).toBe(307);
  expect(res.headers().location).toBe('/projects');
});

test('trailing slash is dropped permanently', async ({ request }) => {
  const res = await get(request, '/community/');
  expect(res.status()).toBe(308);
  expect(res.headers().location).toBe('/community');
});

test('locale roots and unknown locales', async ({ request }) => {
  expect((await get(request, '/es')).status()).toBe(200);
  expect((await get(request, '/xx/projects')).status()).toBe(404);
});

test('a malformed request target gets a 400 and the server keeps serving', async ({ request, baseURL }) => {
  test.skip(Boolean(baseURL?.startsWith('https')), 'raw http only reaches the node server directly');
  const { connect } = await import('node:net');
  const { hostname, port } = new URL(baseURL ?? 'http://localhost:3000');
  const reply = await new Promise<string>((resolve, reject) => {
    const socket = connect(Number(port), hostname, () => socket.end('GET http://[/ HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
    let data = '';
    socket.on('data', (chunk) => (data += chunk));
    socket.on('end', () => resolve(data));
    socket.on('error', reject);
  });
  expect(reply).toMatch(/^HTTP\/1\.1 400/);
  expect((await request.get('/')).status()).toBe(200);
});
