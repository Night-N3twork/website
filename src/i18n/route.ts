import { DEFAULT_LOCALE } from './locales';
import { localizePath, splitLocale } from './paths';

export type Route = { action: 'pass' } | { action: 'rewrite'; to: string } | { action: 'redirect'; to: string; status: 308 };

const UNLOCALIZED = /^\/(?:api|assets)(?:\/|$)|\.|opengraph-image/;

function canonicalSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment)).toLowerCase();
  } catch {
    return segment.toLowerCase();
  }
}

const canonicalPath = (pathname: string): string => pathname.split('/').map(canonicalSegment).join('/');

const redirect = (to: string): Route => ({ action: 'redirect', to, status: 308 });

export function routeFor(url: URL): Route {
  const pathname = url.pathname.replace(/\/{2,}/g, '/');
  const { search } = url;
  if (pathname.length > 1 && pathname.endsWith('/')) return redirect(`${pathname.replace(/\/+$/, '') || '/'}${search}`);
  if (UNLOCALIZED.test(pathname)) return { action: 'pass' };
  const canonical = canonicalPath(pathname);
  const { locale, path, prefix } = splitLocale(canonical);
  if (prefix === null) return canonical === pathname ? { action: 'rewrite', to: `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}${search}` } : redirect(`${canonical}${search}`);
  if (locale === DEFAULT_LOCALE) return redirect(`${path}${search}`);
  if (prefix !== locale || canonical !== pathname) return redirect(`${localizePath(path, locale)}${search}`);
  return { action: 'pass' };
}

export type Redirect = { to: string; status: 308 };

export function redirectFor(url: URL): Redirect | null {
  const route = routeFor(url);
  return route.action === 'redirect' ? { to: route.to, status: route.status } : null;
}
