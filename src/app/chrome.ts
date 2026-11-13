import type { LegalStage } from '@/content/legal-facts';
import { LEGAL_PATHS, type LegalKind } from '@/content/legal-pages';
import { SITE } from '@/content/site';
import type { Locale } from '@/i18n/locales';
import type { InternalPath } from '@/i18n/paths';
import { type Translate, translator } from '@/i18n/translate';
import { env } from '@/lib/env';
import { LEGAL_STAGE } from '@/lib/legal-stage';

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

export interface LegalLink {
  key: LegalKind;
  path: InternalPath;
  label: string;
}

export interface LegalColumn {
  title: string;
  links: LegalLink[];
  cookieSettings: string | null;
}

export interface ChromeOptions {
  stage?: LegalStage;
  analytics?: boolean;
}

export interface Chrome {
  nav: NavItem[];
  labels: Record<ChromeLabel, string>;
  socials: SocialLink[];
  support: ExternalLink[];
  footer: { blurb: string; copyright: string; explore: string; connect: string; support: string };
  legal: LegalColumn | null;
}

const NAV: readonly { key: string; path: InternalPath }[] = [
  { key: 'projects', path: '/projects' },
  { key: 'docs', path: '/docs' },
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

const LEGAL_KINDS: readonly LegalKind[] = ['privacy', 'terms', 'requests'];

function legalColumn(footer: Translate, stage: LegalStage, analytics: boolean): LegalColumn | null {
  if (stage === 'held') return null;
  return {
    title: footer('legal'),
    links: LEGAL_KINDS.map((key) => ({ key, path: LEGAL_PATHS[key], label: footer(key) })),
    cookieSettings: analytics ? footer('cookieSettings') : null,
  };
}

export async function siteChrome(
  locale: Locale,
  year: number = new Date().getFullYear(),
  { stage = LEGAL_STAGE, analytics = env.gaId !== null }: ChromeOptions = {},
): Promise<Chrome> {
  const [nav, footer] = await Promise.all([translator(locale, 'nav'), translator(locale, 'footer')]);
  return {
    nav: NAV.map((item) => ({ ...item, label: nav(item.key) })),
    labels: Object.fromEntries(LABELS.map((key) => [key, nav(key)])) as Record<ChromeLabel, string>,
    socials: [...SOCIALS],
    support: [...SUPPORT],
    footer: { blurb: footer('blurb'), copyright: footer('copyright', { year }), explore: footer('explore'), connect: footer('connect'), support: footer('support') },
    legal: legalColumn(footer, stage, analytics),
  };
}
