import { LOCALE_NAMES, LOCALES, type Locale } from './locales';
import { localizePath } from './paths';

export interface LanguageLink {
  locale: Locale;
  name: string;
  href: string;
  current: boolean;
}

export function languageLinks(locale: Locale, path: string): LanguageLink[] {
  return LOCALES.map((l) => ({ locale: l, name: LOCALE_NAMES[l], href: localizePath(path, l), current: l === locale }));
}
