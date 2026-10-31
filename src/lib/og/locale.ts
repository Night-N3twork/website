import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';

const LATIN_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['en', 'es', 'fr']);

export function ogLocale(value: string): Locale {
  return isLocale(value) && LATIN_LOCALES.has(value) ? value : DEFAULT_LOCALE;
}
