import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';
import { splitLocale } from '@/i18n/paths';

export function localeOf(param: string | undefined): Locale {
  const locale = param ?? DEFAULT_LOCALE;
  if (!isLocale(locale)) throw new Response(null, { status: 404, statusText: 'Not Found' });
  return locale;
}

const DATA_SUFFIX = /\.data$/;
const ROOT_DATA = '/_root';

export interface PageLocation {
  locale: Locale;
  path: string;
}

export function pageLocation(request: Request): PageLocation {
  const raw = new URL(request.url).pathname.replace(DATA_SUFFIX, '');
  const { locale, path } = splitLocale(raw === ROOT_DATA ? '/' : raw);
  return { locale, path };
}

export function pagePath(request: Request): string {
  return pageLocation(request).path;
}
