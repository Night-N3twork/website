import { PROJECTS } from '@/content/projects';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/locales';
import { env } from '@/lib/env';

export const PAGE_PATHS: readonly string[] = ['/', '/projects', ...PROJECTS.map((p) => `/projects/${p.slug}`), '/contributors', '/supporters', '/community'];

export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

export function absoluteUrl(path: string): string {
  return path === '/' ? env.siteUrl : `${env.siteUrl}${path}`;
}

export function localizedUrl(locale: Locale, path: string): string {
  return absoluteUrl(localizedPath(locale, path));
}

export function hreflangUrls(path: string): Record<string, string> {
  return { ...Object.fromEntries(LOCALES.map((l) => [l, localizedUrl(l, path)])), 'x-default': localizedUrl(DEFAULT_LOCALE, path) };
}
