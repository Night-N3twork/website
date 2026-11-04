import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

export type InternalPath = '/' | '/projects' | '/contributors' | '/supporters' | '/community' | '/privacy' | '/terms' | '/requests' | `/projects/${string}`;

export type LocalePath = { locale: Locale; path: string; prefix: string | null };

export function localizePath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export function splitLocale(pathname: string): LocalePath {
  const [, first = '', ...rest] = pathname.split('/');
  const locale = first.toLowerCase();
  if (!isLocale(locale)) return { locale: DEFAULT_LOCALE, path: pathname, prefix: null };
  return { locale, path: `/${rest.join('/')}`, prefix: first };
}
