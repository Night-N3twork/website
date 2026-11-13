import { DOCS_PATH, docPath, docSlug } from './paths.ts';

export interface DocIndex {
  published: ReadonlySet<string>;
  drafts: ReadonlySet<string>;
}

export type DocLink = { kind: 'keep' } | { kind: 'doc'; href: string } | { kind: 'draft' } | { kind: 'missing'; target: string } | { kind: 'ambiguous'; targets: string[] };

const KEEP = /^(?:[a-z][a-z\d+.-]*:|\/\/|#|$)/i;

function normalize(path: string): string {
  const parts = path.split('/').reduce<string[]>((out, part) => {
    if (part === '' || part === '.') return out;
    if (part === '..' && out.length > 0 && out[out.length - 1] !== '..') return out.slice(0, -1);
    return [...out, part];
  }, []);
  return docSlug(parts.join('/'));
}

function unrooted(path: string): string {
  return path === DOCS_PATH || path.startsWith(`${DOCS_PATH}/`) ? path.slice(DOCS_PATH.length) : path;
}

function candidates(path: string, file: string): string[] {
  if (path.startsWith('/')) return [normalize(unrooted(path))];
  const folder = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
  return [...new Set([normalize(`${folder}/${path}`), normalize(`${docSlug(file)}/${path}`)])];
}

export function resolveDocLink(href: string, file: string, pages: DocIndex): DocLink {
  if (KEEP.test(href)) return { kind: 'keep' };
  const cut = href.indexOf('#');
  const path = (cut === -1 ? href : href.slice(0, cut)).split('?')[0];
  const hash = cut === -1 || cut === href.length - 1 ? '' : href.slice(cut);
  const options = candidates(path, file);
  const known = options.filter((slug) => pages.published.has(slug) || pages.drafts.has(slug));
  if (known.length > 1) return { kind: 'ambiguous', targets: known };
  const [hit] = known;
  if (hit === undefined) return { kind: 'missing', target: options[0] };
  return pages.published.has(hit) ? { kind: 'doc', href: `${docPath(hit)}${hash}` } : { kind: 'draft' };
}
