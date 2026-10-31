import type { BreadcrumbList, Organization, SoftwareApplication, Thing, WebSite, WithContext } from 'schema-dts';
import type { Project } from '@/content/projects';
import { SITE } from '@/content/site';
import { LOCALES, type Locale } from '@/i18n/locales';
import { absoluteUrl, localizedUrl } from './paths';

const CONTEXT = 'https://schema.org' as const;

export function organizationJsonLd(): WithContext<Organization> {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: SITE.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon.svg'),
    foundingDate: String(SITE.founded),
    sameAs: [SITE.discord, ...SITE.githubOrgs, SITE.gitlab, SITE.youtube, SITE.instagram, SITE.patreon],
  };
}

export function webSiteJsonLd(): WithContext<WebSite> {
  return { '@context': CONTEXT, '@type': 'WebSite', name: SITE.name, url: absoluteUrl('/'), inLanguage: [...LOCALES] };
}

export function softwareApplicationJsonLd(project: Project, description: string, locale: Locale): WithContext<SoftwareApplication> {
  return {
    '@context': CONTEXT,
    '@type': 'SoftwareApplication',
    name: project.name,
    description,
    url: localizedUrl(locale, `/projects/${project.slug}`),
    applicationCategory: project.group === 'platform' ? 'DeveloperApplication' : 'WebApplication',
    operatingSystem: 'Any',
    ...(project.partner ? {} : { author: { '@type': 'Organization', name: SITE.name, url: absoluteUrl('/') } }),
    ...(project.url ? { installUrl: project.url } : {}),
  };
}

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[], locale: Locale): WithContext<BreadcrumbList> {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: localizedUrl(locale, item.path) })),
  };
}

export function serializeJsonLd(data: WithContext<Thing>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
