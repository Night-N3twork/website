import { describe, expect, it } from 'vitest';
import { assetCache, IMMUTABLE, PAGE_CACHE, withSiteHeaders } from '@/lib/security/site-headers';

const OPTIONS = { dev: false };
const html = (status = 200, headers: Record<string, string> = {}) => new Response('<p>hi</p>', { status, headers: { 'content-type': 'text/html', ...headers } });

describe('withSiteHeaders', () => {
  it('adds the security headers and keeps status and body', async () => {
    const response = withSiteHeaders(html(404), OPTIONS);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('<p>hi</p>');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('content-security-policy')).not.toContain('unsafe-eval');
    expect(response.headers.get('content-security-policy-report-only')).toBeNull();
  });

  it('gives pages without their own cache policy the shared one', () => {
    expect(withSiteHeaders(html(), OPTIONS).headers.get('cache-control')).toBe(PAGE_CACHE);
    expect(withSiteHeaders(html(404), OPTIONS).headers.get('cache-control')).toBe(PAGE_CACHE);
    expect(PAGE_CACHE).toBe('s-maxage=60, stale-while-revalidate=3540');
  });

  it('keeps a cache policy the route set itself', () => {
    expect(withSiteHeaders(html(200, { 'cache-control': 'no-store' }), OPTIONS).headers.get('cache-control')).toBe('no-store');
  });

  it('names the charset on pages that leave it out', () => {
    expect(withSiteHeaders(html(), OPTIONS).headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(withSiteHeaders(html(200, { 'content-type': 'Text/HTML ' }), OPTIONS).headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(withSiteHeaders(html(200, { 'content-type': 'Text/HTML ' }), OPTIONS).headers.get('cache-control')).toBe(PAGE_CACHE);
    expect(withSiteHeaders(html(200, { 'content-type': 'text/html; charset=iso-8859-1' }), OPTIONS).headers.get('content-type')).toBe('text/html; charset=iso-8859-1');
  });

  it('leaves the cache policy of other content types alone', () => {
    const json = new Response('{}', { headers: { 'content-type': 'application/json' } });
    expect(withSiteHeaders(json, OPTIONS).headers.has('cache-control')).toBe(false);
  });

  it('works on responses whose headers are frozen', () => {
    const response = withSiteHeaders(Response.redirect('http://localhost/', 307), OPTIONS);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('assetCache', () => {
  it('caches hashed build assets for a year', () => {
    expect(assetCache('/assets/root-B4xQ9k2a.js')).toBe(IMMUTABLE);
    expect(assetCache('/assets/entry.client-DACGHCEi.js')).toBe(IMMUTABLE);
    for (const pathname of ['/assets/../x.js', '/assets/root.js', '/robots.txt']) expect(assetCache(pathname), pathname).toBeNull();
  });

  it('caches hashed backdrops for a year', () => {
    expect(assetCache('/backdrops/range-2400.1a2b3c4d.avif')).toBe(IMMUTABLE);
    expect(assetCache('/backdrops/peak-1280.9e8f7a6b.webp')).toBe(IMMUTABLE);
    for (const pathname of ['/backdrops/range-2400.avif', '/backdrops/../x.avif']) expect(assetCache(pathname), pathname).toBeNull();
  });

  it('caches hashed project screenshots for a year', () => {
    expect(assetCache('/shots/umbra-01-1600.dac10524.avif')).toBe(IMMUTABLE);
    expect(assetCache('/shots/link-archive-05-960.1331380b.webp')).toBe(IMMUTABLE);
    for (const pathname of ['/shots/umbra-01-1600.avif', '/shots/../x.avif', '/shots/umbra-01-1600.dac10524.png', '/shots/umbra-1600.dac10524.avif']) expect(assetCache(pathname), pathname).toBeNull();
  });
});
