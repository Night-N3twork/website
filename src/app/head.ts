import type { MetaDescriptor } from 'react-router';
import type { Thing, WithContext } from 'schema-dts';
import { type HeadImage, type HeadModel, missingHead } from '@/lib/seo/head';
import { copyKey, errorStatus } from '@/ui/glass/Lost';

const IMAGE_ORDER = { og: ['', 'type', 'width', 'height', 'alt'], twitter: ['', 'alt', 'type', 'width', 'height'] } as const;

function imageField(image: HeadImage, field: string): string {
  if (field === '') return image.url;
  if (field === 'width' || field === 'height') return String(image[field]);
  return field === 'type' ? image.type : image.alt;
}

function imageMeta(prefix: 'og' | 'twitter', image: HeadImage): MetaDescriptor[] {
  const key = prefix === 'og' ? 'property' : 'name';
  return IMAGE_ORDER[prefix].map((field) => ({ [key]: field ? `${prefix}:image:${field}` : `${prefix}:image`, content: imageField(image, field) }));
}

function shareMeta(model: HeadModel): MetaDescriptor[] {
  const { og, image } = model;
  if (!og) return [];
  return [
    { property: 'og:title', content: model.title },
    { property: 'og:description', content: model.description },
    { property: 'og:url', content: og.url },
    { property: 'og:site_name', content: og.siteName },
    { property: 'og:locale', content: og.locale },
    ...(image ? imageMeta('og', image) : []),
    ...og.alternateLocales.map((locale) => ({ property: 'og:locale:alternate', content: locale })),
    { property: 'og:type', content: og.type },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: model.title },
    { name: 'twitter:description', content: model.description },
    ...(image ? imageMeta('twitter', image) : []),
  ];
}

export function headMeta(model: HeadModel): MetaDescriptor[] {
  return [
    { title: model.title },
    { name: 'description', content: model.description },
    { name: 'robots', content: model.index ? 'index, follow' : 'noindex' },
    ...(model.canonical ? [{ tagName: 'link', rel: 'canonical', href: model.canonical }] : []),
    ...model.alternates.map((a) => ({ tagName: 'link', rel: 'alternate', hrefLang: a.hreflang, href: a.href })),
    ...shareMeta(model),
  ];
}

export function jsonLd(data: WithContext<Thing>): MetaDescriptor {
  return { 'script:ld+json': data };
}

export interface LostCopy {
  meta: string;
  lede: string;
}

export function lostMeta(copy: LostCopy | undefined): MetaDescriptor[] {
  return headMeta(missingHead({ title: copy?.meta ?? 'Page not found', description: copy?.lede ?? '' }));
}

export function rootLost(matches: readonly ({ id: string; loaderData: unknown } | undefined)[], error?: unknown): LostCopy | undefined {
  const data = matches.find((match) => match?.id === 'root')?.loaderData as Partial<Record<'notFound' | 'serverError', LostCopy>> | undefined;
  return data?.[error === undefined ? 'notFound' : copyKey(errorStatus(error))];
}
