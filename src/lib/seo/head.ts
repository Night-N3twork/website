import { SITE } from '@/content/site';
import { LOCALES, type Locale } from '@/i18n/locales';
import { OG_SIZE } from '@/lib/og/size';
import { absoluteUrl, hreflangUrls, localizedUrl } from './paths';

const OG_LOCALES: Record<Locale, string> = { en: 'en_US', es: 'es_ES', fr: 'fr_FR', ja: 'ja_JP' };

export type HeadImage = { url: string; alt: string; width: number; height: number; type: string };
export type HeadModel = {
  title: string;
  description: string;
  index: boolean;
  canonical: string | null;
  alternates: readonly { hreflang: string; href: string }[];
  og: { siteName: string; locale: string; alternateLocales: readonly string[]; url: string; type: 'website' } | null;
  image: HeadImage | null;
};

type Input = { locale: Locale; path: string; title: string; description: string; image?: HeadImage | null };

export function pageTitle(title: string): string {
  return title === SITE.name ? title : `${title} · ${SITE.name}`;
}

export function shareImage(locale: Locale, slug?: string, alt: string = SITE.name): HeadImage {
  const card = slug ? `/${locale}/projects/${slug}/opengraph-image` : `/${locale}/opengraph-image`;
  return { url: absoluteUrl(card), alt, ...OG_SIZE, type: 'image/png' };
}

export function headModel({ locale, path, title, description, image = null }: Input): HeadModel {
  const canonical = localizedUrl(locale, path);
  return {
    title: pageTitle(title),
    description,
    index: true,
    canonical,
    alternates: Object.entries(hreflangUrls(path)).map(([hreflang, href]) => ({ hreflang, href })),
    og: { siteName: SITE.name, locale: OG_LOCALES[locale], alternateLocales: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]), url: canonical, type: 'website' },
    image,
  };
}

export function missingHead({ title, description }: Pick<Input, 'title' | 'description'>): HeadModel {
  return { title: pageTitle(title), description, index: false, canonical: null, alternates: [], og: null, image: null };
}
