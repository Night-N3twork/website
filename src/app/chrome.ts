import { SITE } from '@/content/site';
import type { Locale } from '@/i18n/locales';
import type { InternalPath } from '@/i18n/paths';
import { translator } from '@/i18n/translate';

export interface NavItem {
  key: string;
  path: InternalPath;
  label: string;
}

export interface SocialLink {
  name: string;
  label: string;
  href: string;
}

export interface ExternalLink {
  label: string;
  href: string;
}

export type ChromeLabel = 'menu' | 'close' | 'language' | 'languageCurrent' | 'connect' | 'support' | 'supportLine' | 'skip';

export interface Chrome {
  nav: NavItem[];
  labels: Record<ChromeLabel, string>;
  socials: SocialLink[];
  support: ExternalLink[];
  footer: { blurb: string; copyright: string; explore: string; connect: string; support: string };
}

const NAV: readonly { key: string; path: InternalPath }[] = [
  { key: 'projects', path: '/projects' },
  { key: 'contributors', path: '/contributors' },
  { key: 'supporters', path: '/supporters' },
  { key: 'community', path: '/community' },
];

const SOCIALS: readonly SocialLink[] = [
  { name: 'discord', label: 'Discord', href: SITE.discord },
  { name: 'github', label: 'GitHub', href: SITE.github },
  { name: 'gitlab', label: 'GitLab', href: SITE.gitlab },
  { name: 'youtube', label: 'YouTube', href: SITE.youtube },
  { name: 'instagram', label: 'Instagram', href: SITE.instagram },
];

const SUPPORT: readonly ExternalLink[] = [
  { label: 'Patreon', href: SITE.patreon },
  { label: 'Cash App', href: SITE.cashApp },
];

const LABELS: readonly ChromeLabel[] = ['menu', 'close', 'language', 'languageCurrent', 'connect', 'support', 'supportLine', 'skip'];

export async function siteChrome(locale: Locale, year: number = new Date().getFullYear()): Promise<Chrome> {
  const [nav, footer] = await Promise.all([translator(locale, 'nav'), translator(locale, 'footer')]);
  return {
    nav: NAV.map((item) => ({ ...item, label: nav(item.key) })),
    labels: Object.fromEntries(LABELS.map((key) => [key, nav(key)])) as Record<ChromeLabel, string>,
    socials: [...SOCIALS],
    support: [...SUPPORT],
    footer: { blurb: footer('blurb'), copyright: footer('copyright', { year }), explore: footer('explore'), connect: footer('connect'), support: footer('support') },
  };
}
