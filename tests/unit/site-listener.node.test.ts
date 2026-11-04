import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { IMMUTABLE } from '@/lib/security/site-headers';
import { siteListener } from '@/lib/security/site-listener';

const BODY = '<p>night</p>'.repeat(400);
const servers: Server[] = [];

async function serve(status = 200, implicit = false): Promise<string> {
  const server = createServer(
    siteListener((_req, res) => {
      if (implicit) res.statusCode = status;
      else res.writeHead(status, { 'content-type': 'text/html' });
      res.end(status === 304 ? undefined : BODY);
    }),
  );
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

describe('siteListener', () => {
  it('puts the security headers on everything it serves', async () => {
    const response = await fetch(`${await serve(404)}/icon.svg`);
    expect(response.status).toBe(404);
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).not.toContain('unsafe-eval');
  });

  it('compresses when the browser asks', async () => {
    const base = await serve();
    const response = await fetch(`${base}/`, { headers: { 'accept-encoding': 'gzip' } });
    expect(response.headers.get('content-encoding')).toBe('gzip');
    expect(await response.text()).toBe(BODY);
  });

  it('caches hashed backdrops for a year only when they are found', async () => {
    const backdrop = '/backdrops/range-1280.8727c46a.webp';
    expect((await fetch(`${await serve()}${backdrop}`)).headers.get('cache-control')).toBe(IMMUTABLE);
    expect((await fetch(`${await serve(404)}${backdrop}`)).headers.get('cache-control')).toBeNull();
    expect((await fetch(`${await serve()}/?v=${backdrop}`)).headers.get('cache-control')).toBeNull();
  });

  it('caches backdrops a file server streams without writing the head itself', async () => {
    const backdrop = '/backdrops/peak-2400.0123abcd.avif';
    expect((await fetch(`${await serve(200, true)}${backdrop}`)).headers.get('cache-control')).toBe(IMMUTABLE);
    expect((await fetch(`${await serve(304, true)}${backdrop}`)).headers.get('cache-control')).toBe(IMMUTABLE);
    expect((await fetch(`${await serve(412, true)}${backdrop}`)).headers.get('cache-control')).toBeNull();
  });
});
