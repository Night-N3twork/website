import type { MDXContent } from 'mdx/types';
import { DOCS_SIDEBAR } from '@/content/docs-sidebar';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import type { DirectorySection, DocsLabel, DocsLabels, DocsPageData, PagerLink, TocEntry } from '@/lib/docs/page';
import { readFrontmatter } from '@/lib/docs/frontmatter';
import { docPath, docSlug } from '@/lib/docs/paths';
import { buildSidebar, type NavNode, readingOrder } from '@/lib/docs/sidebar';
import { type HeadModel, headModel, shareImage } from '@/lib/seo/head';
import { remember } from '@/ui/glass/docs/content';

interface DocModule {
  default: MDXContent;
  frontmatter?: unknown;
  heading: string | null;
  toc: TocEntry[];
}

export interface DocEntry {
  slug: string;
  file: string;
  title: string;
  heading: string;
  description: string;
  draft: boolean;
  order?: number;
  label?: string;
  toc: TocEntry[];
  content: MDXContent;
}

const ROOT = '/src/content/docs/';
const LABELS: readonly DocsLabel[] = ['docs', 'browse', 'contents', 'pager', 'previous', 'next', 'copy', 'copied', 'copyFailed'];

const MODULES = import.meta.glob<DocModule>('/src/content/docs/**/*.{md,mdx}', { eager: true });

function readEntry(path: string, mod: DocModule): DocEntry {
  const file = path.slice(ROOT.length);
  const { title, description = '', draft = false, sidebar } = readFrontmatter(mod.frontmatter, file);
  return { slug: docSlug(file), file, title, heading: mod.heading ?? title, description, draft, order: sidebar?.order, label: sidebar?.label, toc: mod.toc, content: mod.default };
}

export const DOCS: readonly DocEntry[] = Object.entries(MODULES)
  .map(([path, mod]) => readEntry(path, mod))
  .filter((doc) => !doc.draft);

const BY_SLUG: ReadonlyMap<string, DocEntry> = new Map(DOCS.map((doc) => [doc.slug, doc]));
const HOME = BY_SLUG.get('');
if (!HOME) throw new Error('docs need an index.md at the content root');

export const DOCS_NAV: readonly NavNode[] = buildSidebar(DOCS_SIDEBAR, DOCS);
const ORDER: readonly string[] = readingOrder(DOCS_NAV);
export const DOC_PATHS: readonly string[] = DOCS.map((doc) => docPath(doc.slug));

function trailTo(nodes: readonly NavNode[], slug: string): string[] | null {
  for (const node of nodes) {
    if (node.kind === 'link') {
      if (node.slug === slug) return [];
      continue;
    }
    const inner = trailTo(node.items, slug);
    if (inner) return [node.label, ...inner];
  }
  return null;
}

function pagerLink(slug: string | undefined): PagerLink | null {
  const doc = slug === undefined ? undefined : BY_SLUG.get(slug);
  return doc ? { slug: doc.slug, title: doc.heading } : null;
}

const firstLink = (node: NavNode): string => (node.kind === 'link' ? node.slug : firstLink(node.items[0]));

function directory(): DirectorySection[] {
  return DOCS_NAV.flatMap((section) => {
    if (section.kind === 'link') return [];
    const entries = section.items.map((node) => {
      const doc = BY_SLUG.get(firstLink(node));
      return { slug: doc?.slug ?? '', title: node.label, description: doc?.description ?? '' };
    });
    const kind = section.items.every((node) => node.kind === 'group') ? 'products' : 'pages';
    return [{ label: section.label, kind, entries }];
  });
}

function docsHead(locale: Locale, doc: DocEntry): HeadModel {
  const model = headModel({ locale: DEFAULT_LOCALE, path: docPath(doc.slug), title: doc.heading, description: doc.description || HOME?.description || doc.heading, image: shareImage(DEFAULT_LOCALE) });
  return { ...model, index: locale === DEFAULT_LOCALE, alternates: [], og: model.og ? { ...model.og, alternateLocales: [] } : null };
}

async function docsLabels(locale: Locale): Promise<DocsLabels> {
  const t = await translator(locale, 'docs');
  const labels = Object.fromEntries(LABELS.map((key) => [key, t(key)])) as Record<DocsLabel, string>;
  return { ...labels, lang: locale, notice: locale === DEFAULT_LOCALE ? null : t('notice') };
}

export async function docsPage(locale: Locale, splat: string | undefined): Promise<DocsPageData> {
  const slug = (splat ?? '').replace(/^\/+|\/+$/g, '');
  const doc = BY_SLUG.get(slug);
  if (!doc) throw new Response(null, { status: 404, statusText: 'Not Found' });
  remember(doc.file, doc.content);
  const at = ORDER.indexOf(slug);
  return {
    slug,
    file: doc.file,
    title: doc.heading,
    description: doc.description,
    toc: doc.toc,
    nav: [...DOCS_NAV],
    trail: trailTo(DOCS_NAV, slug) ?? [],
    pager: at === -1 ? { previous: null, next: null } : { previous: pagerLink(ORDER[at - 1]), next: pagerLink(ORDER[at + 1]) },
    directory: slug === '' ? directory() : null,
    labels: await docsLabels(locale),
    seo: docsHead(locale, doc),
  };
}
