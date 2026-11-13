export interface SidebarPage {
  slug: string;
  title: string;
  label?: string;
  order?: number;
}

export type SidebarEntry =
  | { slug: string; label?: string }
  | { autogenerate: { directory: string; collapsed?: boolean } }
  | { label: string; collapsed?: boolean; items: readonly SidebarEntry[] };

export interface NavLink {
  kind: 'link';
  label: string;
  slug: string;
}

export interface NavGroup {
  kind: 'group';
  label: string;
  collapsed: boolean;
  items: NavNode[];
}

export type NavNode = NavLink | NavGroup;

type Pages = ReadonlyMap<string, SidebarPage>;
type Ranked = { node: NavNode; order: number; key: string };

const OVERVIEW = 'Overview';

const linkTo = (page: SidebarPage, label: string = page.label ?? page.title): NavLink => ({ kind: 'link', label, slug: page.slug });

const byRank = (a: Ranked, b: Ranked): number => a.order - b.order || a.key.localeCompare(b.key);

function folder(dir: string, pages: Pages, collapsed: boolean): NavNode[] {
  const prefix = dir ? `${dir}/` : '';
  const inside = [...pages.keys()].filter((slug) => slug !== dir && slug.startsWith(prefix));
  if (inside.length === 0) throw new Error(`empty sidebar folder: ${dir}`);
  const names = [...new Set(inside.map((slug) => slug.slice(prefix.length).split('/')[0]))];
  const ranked = names.map((name): Ranked => {
    const slug = `${prefix}${name}`;
    const head = pages.get(slug);
    const order = head?.order ?? Number.POSITIVE_INFINITY;
    if (!inside.some((other) => other.startsWith(`${slug}/`)) && head) return { node: linkTo(head), order, key: slug };
    return { node: { kind: 'group', label: head?.title ?? name, collapsed, items: folder(slug, pages, collapsed) }, order, key: slug };
  });
  const index = pages.get(dir);
  return [...(index ? [linkTo(index, OVERVIEW)] : []), ...ranked.sort(byRank).map(({ node }) => node)];
}

function expand(entry: SidebarEntry, pages: Pages): NavNode[] {
  if ('autogenerate' in entry) return folder(entry.autogenerate.directory.replace(/^\/+|\/+$/g, ''), pages, entry.autogenerate.collapsed ?? false);
  if ('items' in entry) return [{ kind: 'group', label: entry.label, collapsed: entry.collapsed ?? false, items: entry.items.flatMap((item) => expand(item, pages)) }];
  const page = pages.get(entry.slug);
  if (!page) throw new Error(`sidebar page not found: ${entry.slug}`);
  return [linkTo(page, entry.label)];
}

export function buildSidebar(entries: readonly SidebarEntry[], pages: readonly SidebarPage[]): NavNode[] {
  const known: Pages = new Map(pages.map((page) => [page.slug, page]));
  return entries.flatMap((entry) => expand(entry, known));
}

export function readingOrder(nodes: readonly NavNode[]): string[] {
  return [...new Set(nodes.flatMap((node) => (node.kind === 'link' ? [node.slug] : readingOrder(node.items))))];
}

export function groupHolds(group: NavGroup, slug: string): boolean {
  return group.items.some((node) => (node.kind === 'link' ? node.slug === slug : groupHolds(node, slug)));
}
