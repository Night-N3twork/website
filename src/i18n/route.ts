import { DEFAULT_LOCALE } from './locales';
import { localizePath, splitLocale } from './paths';

export type Route = { action: 'pass' } | { action: 'rewrite'; to: string } | { action: 'redirect'; to: string; status: 307 | 308 };

const UNLOCALIZED = /^\/(?:api|assets)(?:\/|$)|\.|opengraph-image/;

export function routeFor(url: URL): Route {
  const pathname = url.pathname.replace(/\/{2,}/g, '/');
  const { search } = url;
  if (pathname.length > 1 && pathname.endsWith('/')) return { action: 'redirect', to: `${pathname.replace(/\/+$/, '') || '/'}${search}`, status: 308 };
  if (UNLOCALIZED.test(pathname)) return { action: 'pass' };
  const { locale, path, prefix } = splitLocale(pathname);
  if (prefix === null) return { action: 'rewrite', to: `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}${search}` };
  if (locale === DEFAULT_LOCALE) return { action: 'redirect', to: `${path}${search}`, status: 307 };
  if (prefix !== locale) return { action: 'redirect', to: `${localizePath(path, locale)}${search}`, status: 307 };
  return { action: 'pass' };
}

export type Redirect = { to: string; status: 307 | 308 };

export function redirectFor(url: URL): Redirect | null {
  const route = routeFor(url);
  return route.action === 'redirect' ? { to: route.to, status: route.status } : null;
}
