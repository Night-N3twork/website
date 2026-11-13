import { describe, expect, it } from 'vitest';
import { resolveDocLink } from '@/lib/docs/links';
import { docPath, docSlug } from '@/lib/docs/paths';

const pages = {
  published: new Set(['', 'dusk', 'dusk/installation', 'dusk/dpm', 'dusk/reference', 'dusk/reference/networking', 'moonbeam/integration', 'services/nebula', 'services/nebula/deployment']),
  drafts: new Set(['eclipse', 'eclipse/limitations']),
};

describe('docSlug', () => {
  it('drops the extension and folds index files into their folder', () => {
    expect(docSlug('index.md')).toBe('');
    expect(docSlug('dusk/index.md')).toBe('dusk');
    expect(docSlug('dusk/dpm/registry/index.mdx')).toBe('dusk/dpm/registry');
    expect(docSlug('dusk/installation.md')).toBe('dusk/installation');
  });

  it('accepts leading dot segments and backslashes', () => {
    expect(docSlug('./guides/index.md')).toBe('guides');
    expect(docSlug('services\\space.md')).toBe('services/space');
  });
});

describe('docPath', () => {
  it('puts every page under /docs', () => {
    expect(docPath('')).toBe('/docs');
    expect(docPath('dusk/installation')).toBe('/docs/dusk/installation');
  });
});

describe('resolveDocLink', () => {
  it('leaves external, mail and same-page links alone', () => {
    expect(resolveDocLink('https://night-x.com', 'index.md', pages)).toEqual({ kind: 'keep' });
    expect(resolveDocLink('mailto:a@b.c', 'index.md', pages)).toEqual({ kind: 'keep' });
    expect(resolveDocLink('#setup', 'dusk/index.md', pages)).toEqual({ kind: 'keep' });
    expect(resolveDocLink('//cdn.example.com/x', 'index.md', pages)).toEqual({ kind: 'keep' });
  });

  it('resolves relative links against the folder of the file', () => {
    expect(resolveDocLink('./installation/', 'dusk/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/installation' });
    expect(resolveDocLink('../installation/', 'dusk/dpm/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/installation' });
    expect(resolveDocLink('./reference/networking/', 'dusk/reference.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/reference/networking' });
  });

  it('falls back to the page url when the folder reading misses', () => {
    expect(resolveDocLink('../dpm/', 'dusk/reference.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/dpm' });
    expect(resolveDocLink('../', 'services/nebula/deployment.md', pages)).toEqual({ kind: 'doc', href: '/docs/services/nebula' });
  });

  it('reads root links as docs paths', () => {
    expect(resolveDocLink('/moonbeam/integration/', 'guides/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/moonbeam/integration' });
    expect(resolveDocLink('/docs/moonbeam/integration', 'guides/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/moonbeam/integration' });
    expect(resolveDocLink('/', 'guides/index.md', pages)).toEqual({ kind: 'doc', href: '/docs' });
  });

  it('keeps the hash and accepts file names with extensions', () => {
    expect(resolveDocLink('./installation/#requirements', 'dusk/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/installation#requirements' });
    expect(resolveDocLink('./installation.md', 'dusk/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/installation' });
    expect(resolveDocLink('./dpm/index.mdx', 'dusk/index.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/dpm' });
  });

  it('flags links to draft pages', () => {
    expect(resolveDocLink('/eclipse/limitations/', 'reference/limitations.md', pages)).toEqual({ kind: 'draft' });
  });

  it('refuses a link that reads as two different pages', () => {
    const both = { published: new Set([...pages.published, 'dpm']), drafts: pages.drafts };
    expect(resolveDocLink('../dpm/', 'dusk/reference.md', pages)).toEqual({ kind: 'doc', href: '/docs/dusk/dpm' });
    expect(resolveDocLink('../dpm/', 'dusk/reference.md', both)).toEqual({ kind: 'ambiguous', targets: ['dpm', 'dusk/dpm'] });
  });

  it('reports links that point nowhere', () => {
    expect(resolveDocLink('./nope/', 'dusk/index.md', pages)).toEqual({ kind: 'missing', target: 'dusk/nope' });
    expect(resolveDocLink('../../../etc/', 'dusk/index.md', pages)).toEqual({ kind: 'missing', target: '../../etc' });
  });
});
