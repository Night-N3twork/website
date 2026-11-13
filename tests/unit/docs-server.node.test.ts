import { matchRoutes } from 'react-router';
import PAGES from 'virtual:docs-pages';
import { describe, expect, it } from 'vitest';
import ja from '../../messages/ja.json';
import { DOC_PATHS, DOCS, DOCS_NAV, docsPage } from '@/app/docs.server';
import routes from '@/app/routes';
import { docSlug } from '@/lib/docs/paths';
import { type NavNode, readingOrder } from '@/lib/docs/sidebar';

const labels = (nodes: readonly NavNode[]): string[] => nodes.map((node) => node.label);
const group = (nodes: readonly NavNode[], label: string): NavNode[] => {
  const found = nodes.find((node) => node.label === label);
  if (found?.kind !== 'group') throw new Error(`no group ${label}`);
  return found.items;
};

describe('docs content', () => {
  const slugs = DOCS.map((doc) => doc.slug);

  it('publishes the docs home and leaves drafts and placeholders out', () => {
    expect(slugs).toContain('');
    expect(slugs.filter((slug) => slug.startsWith('eclipse') || slug === 'reference/eclipse-api')).toEqual([]);
    for (const gone of ['services/umbra', 'services/starlight', 'services/lunar', 'guides/migrations']) expect(slugs).not.toContain(gone);
  });

  it('keeps the sidebar sections of the docs repo', () => {
    expect(labels(DOCS_NAV)).toEqual(['Overview', 'Libraries', 'Services', 'Guides', 'Reference']);
    expect(labels(group(DOCS_NAV, 'Libraries'))).toEqual(['Dusk', 'MoonBeam', 'Nova', 'LunaSSH', 'MoonScale']);
    expect(labels(group(DOCS_NAV, 'Services'))).toEqual(['Daydream', 'Nebula', 'Space']);
    expect(labels(group(DOCS_NAV, 'Reference'))[0]).toBe('Overview');
  });

  it('nests the DPM registry inside DPM and the Dusk reference pages under Reference', () => {
    const dusk = group(group(DOCS_NAV, 'Libraries'), 'Dusk');
    const dpm = dusk.find((node) => node.kind === 'group' && readingOrder([node]).includes('dusk/dpm'));
    expect(dpm && readingOrder([dpm])).toEqual(expect.arrayContaining(['dusk/dpm/registry', 'dusk/dpm/registry/setup']));
    const reference = dusk.find((node) => node.kind === 'group' && readingOrder([node])[0] === 'dusk/reference');
    expect(reference && readingOrder([reference])).toContain('dusk/reference/runtime-and-boot');
  });

  it('puts every published page except the home in the sidebar', () => {
    const listed = new Set(readingOrder(DOCS_NAV));
    expect(slugs.filter((slug) => slug !== '' && !listed.has(slug))).toEqual([]);
  });

  it('lifts the leading heading into the page title', () => {
    expect(DOCS.find((doc) => doc.slug === 'dusk/reference')?.heading).toBe('Dusk Reference');
    expect(DOCS.find((doc) => doc.slug === 'services/space')?.heading).toBe('Space');
  });
});

describe('docsPage', () => {
  it('serves English pages to the index with an English canonical', async () => {
    const page = await docsPage('en', 'dusk/installation');
    expect(page.seo).toMatchObject({ index: true, canonical: 'https://night-x.com/docs/dusk/installation', alternates: [] });
    expect(page.trail).toEqual(['Libraries', 'Dusk']);
    expect(page.labels.notice).toBeNull();
    expect(page.directory).toBeNull();
  });

  it('keeps translated chrome out of the index and points it at English', async () => {
    const page = await docsPage('ja', 'dusk/installation/');
    expect(page.slug).toBe('dusk/installation');
    expect(page.seo).toMatchObject({ index: false, canonical: 'https://night-x.com/docs/dusk/installation', alternates: [] });
    expect(page.labels.notice).toBe(ja.docs.notice);
    expect(page.labels.contents).toBe(ja.docs.contents);
  });

  it('walks the sidebar order for previous and next', async () => {
    const order = readingOrder(DOCS_NAV);
    const at = order.indexOf('dusk/installation');
    const page = await docsPage('en', 'dusk/installation');
    expect(page.pager.previous?.slug).toBe(order[at - 1]);
    expect(page.pager.next?.slug).toBe(order[at + 1]);
    expect((await docsPage('en', order[0])).pager.previous).toBeNull();
    expect((await docsPage('en', order.at(-1))).pager.next).toBeNull();
  });

  it('gives the home a directory and no pager', async () => {
    const page = await docsPage('en', undefined);
    expect(page.title).toBe('NightDocs');
    expect(page.pager).toEqual({ previous: null, next: null });
    expect(page.directory?.map((section) => [section.label, section.kind])).toEqual([
      ['Overview', 'pages'],
      ['Libraries', 'products'],
      ['Services', 'products'],
      ['Guides', 'pages'],
      ['Reference', 'pages'],
    ]);
  });

  it('answers 404 for drafts and unknown pages', async () => {
    for (const slug of ['eclipse', 'reference/eclipse-api', 'services/umbra', 'nope']) await expect(docsPage('en', slug)).rejects.toMatchObject({ status: 404 });
  });
});

describe('docs in the browser', () => {
  it('ships the published pages and nothing else', () => {
    const files = Object.keys(PAGES);
    expect(files.map(docSlug).sort()).toEqual(DOCS.map((doc) => doc.slug).sort());
    expect(files.filter((file) => file.startsWith('eclipse') || file.includes('eclipse-api'))).toEqual([]);
  });

  it('lands every page on the docs route in every locale', () => {
    const table = routes.map(({ id, path }) => ({ id, path }));
    for (const path of DOC_PATHS) {
      for (const prefix of ['', '/ja']) expect(matchRoutes(table, `${prefix}${path}`)?.at(-1)?.route.id, `${prefix}${path}`).toBe('docs');
    }
  });
});
