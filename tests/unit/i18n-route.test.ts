import { describe, expect, it } from 'vitest';
import { localizePath, splitLocale } from '@/i18n/paths';
import { redirectFor, routeFor } from '@/i18n/route';

const route = (path: string) => routeFor(new URL(path, 'http://localhost'));

describe('localizePath', () => {
  it('leaves English unprefixed', () => {
    expect(localizePath('/supporters', 'en')).toBe('/supporters');
    expect(localizePath('/', 'en')).toBe('/');
  });

  it('prefixes the other locales', () => {
    expect(localizePath('/supporters', 'ja')).toBe('/ja/supporters');
    expect(localizePath('/', 'es')).toBe('/es');
  });
});

describe('splitLocale', () => {
  it('reads a known prefix in any case', () => {
    expect(splitLocale('/en/supporters')).toEqual({ locale: 'en', path: '/supporters', prefix: 'en' });
    expect(splitLocale('/ES')).toEqual({ locale: 'es', path: '/', prefix: 'ES' });
  });

  it('treats anything else as an English path', () => {
    expect(splitLocale('/de/supporters')).toEqual({ locale: 'en', path: '/de/supporters', prefix: null });
    expect(splitLocale('/')).toEqual({ locale: 'en', path: '/', prefix: null });
  });
});

describe('routeFor', () => {
  it('rewrites unprefixed pages onto the English route', () => {
    expect(route('/')).toEqual({ action: 'rewrite', to: '/en' });
    expect(route('/supporters?ref=x')).toEqual({ action: 'rewrite', to: '/en/supporters?ref=x' });
    expect(route('/de/supporters')).toEqual({ action: 'rewrite', to: '/en/de/supporters' });
  });

  it('passes prefixed locales through', () => {
    expect(route('/es')).toEqual({ action: 'pass' });
    expect(route('/ja/projects/dusk')).toEqual({ action: 'pass' });
  });

  it('sends the English prefix to the bare path', () => {
    expect(route('/en')).toEqual({ action: 'redirect', to: '/', status: 307 });
    expect(route('/en/supporters?a=1')).toEqual({ action: 'redirect', to: '/supporters?a=1', status: 307 });
    expect(route('/EN/supporters')).toEqual({ action: 'redirect', to: '/supporters', status: 307 });
  });

  it('lowercases a locale prefix', () => {
    expect(route('/ES/supporters')).toEqual({ action: 'redirect', to: '/es/supporters', status: 307 });
  });

  it('drops a trailing slash first', () => {
    expect(route('/supporters/')).toEqual({ action: 'redirect', to: '/supporters', status: 308 });
    expect(route('/es/es/?q=1')).toEqual({ action: 'redirect', to: '/es/es?q=1', status: 308 });
  });

  it('never builds a protocol-relative location', () => {
    const raw = (pathname: string) => routeFor(Object.assign(new URL('http://localhost'), { pathname }));
    expect(raw('//evil/')).toEqual({ action: 'redirect', to: '/evil', status: 308 });
    expect(raw('/en//evil')).toEqual({ action: 'redirect', to: '/evil', status: 307 });
  });

  it('drops a trailing slash from endpoints and files too', () => {
    expect(route('/api/status/')).toEqual({ action: 'redirect', to: '/api/status', status: 308 });
    expect(route('/icon.svg/')).toEqual({ action: 'redirect', to: '/icon.svg', status: 308 });
  });

  it('leaves assets, endpoints and image routes alone', () => {
    for (const path of ['/api/status', '/assets/root-abc12345.js', '/icon.svg', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/en/opengraph-image', '/es/projects/dusk/opengraph-image']) {
      expect(route(path), path).toEqual({ action: 'pass' });
    }
  });
});

describe('redirectFor', () => {
  const redirect = (path: string) => redirectFor(new URL(path, 'http://x'));

  it('returns only the redirects', () => {
    expect(redirect('/en/projects')).toEqual({ to: '/projects', status: 307 });
    expect(redirect('/projects/')).toEqual({ to: '/projects', status: 308 });
    expect(redirect('/ES/projects?x=1')).toEqual({ to: '/es/projects?x=1', status: 307 });
  });

  it('is null for pages and files that need no redirect', () => {
    for (const path of ['/es/projects', '/projects', '/assets/root-abc12345.js', '/']) expect(redirect(path), path).toBeNull();
  });
});
