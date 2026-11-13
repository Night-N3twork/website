import type { Locale } from '@/i18n/locales';
import type { HeadModel } from '@/lib/seo/head';
import type { NavNode } from './sidebar';

export interface TocEntry {
  depth: 2 | 3;
  id: string;
  text: string;
}

export type DocsLabel = 'docs' | 'browse' | 'contents' | 'pager' | 'previous' | 'next' | 'copy' | 'copied' | 'copyFailed';

export interface DocsLabels extends Record<DocsLabel, string> {
  lang: Locale;
  notice: string | null;
}

export interface PagerLink {
  slug: string;
  title: string;
}

export interface DirectoryEntry {
  slug: string;
  title: string;
  description: string;
}

export interface DirectorySection {
  label: string;
  kind: 'products' | 'pages';
  entries: DirectoryEntry[];
}

export interface DocsPageData {
  slug: string;
  file: string;
  title: string;
  description: string;
  toc: TocEntry[];
  nav: NavNode[];
  trail: string[];
  pager: { previous: PagerLink | null; next: PagerLink | null };
  directory: DirectorySection[] | null;
  labels: DocsLabels;
  seo: HeadModel;
}
