import { evaluate } from '@mdx-js/mdx';
import type { MDXModule } from 'mdx/types';
import { createElement } from 'react';
import * as runtime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vitest';
import { docsMdxOptions } from '@/lib/docs/mdx-options';
import type { TocEntry } from '@/lib/docs/page';

type DocModule = MDXModule & { heading: string | null; toc: TocEntry[]; frontmatter?: unknown };

const ROOT = '/content';
const pages = {
  published: new Set(['', 'dusk', 'dusk/installation', 'moonbeam/integration']),
  drafts: new Set(['eclipse']),
};

async function compile(file: string, value: string) {
  const mod = (await evaluate(new VFile({ path: `${ROOT}/${file}`, value }), { ...runtime, ...docsMdxOptions(ROOT, pages) })) as DocModule;
  return { ...mod, html: renderToStaticMarkup(createElement(mod.default)) };
}

describe('docs MDX pipeline', () => {
  it('lifts the leading title out of the body', async () => {
    const page = await compile('dusk/index.md', '---\ntitle: Dusk\n---\n\n# Dusk runtime\n\nBody.\n');
    expect(page.heading).toBe('Dusk runtime');
    expect(page.frontmatter).toEqual({ title: 'Dusk' });
    expect(page.html).not.toContain('<h1');
  });

  it('exports a null heading when the page opens without one', async () => {
    const page = await compile('dusk/index.md', '---\ntitle: Dusk\n---\n\nIntro.\n\n# Later\n');
    expect(page.heading).toBeNull();
    expect(page.html).toContain('<h1 id="later">Later</h1>');
  });

  it('gives headings github ids and lists the second and third levels', async () => {
    const page = await compile('dusk/index.md', '# T\n\n## Set `up`\n\n### Notes\n\n#### Deep\n\n## Set up\n');
    expect(page.toc).toEqual([
      { depth: 2, id: 'set-up', text: 'Set up' },
      { depth: 3, id: 'notes', text: 'Notes' },
      { depth: 2, id: 'set-up-1', text: 'Set up' },
    ]);
    expect(page.html).toContain('<h4 id="deep">Deep</h4>');
  });

  it('rewrites doc links and unlinks drafts', async () => {
    const page = await compile('dusk/index.md', 'See [install](./installation/), [relay](/moonbeam/integration/#relay), [Eclipse](/eclipse/) and [site](https://night-x.com).\n');
    expect(page.html).toContain('<a href="/docs/dusk/installation">install</a>');
    expect(page.html).toContain('<a href="/docs/moonbeam/integration#relay">relay</a>');
    expect(page.html).toContain(' Eclipse and ');
    expect(page.html).toContain('<a href="https://night-x.com">site</a>');
  });

  it('rewrites reference style links', async () => {
    const page = await compile('dusk/index.md', 'See [install][i].\n\n[i]: ./installation/\n');
    expect(page.html).toContain('<a href="/docs/dusk/installation">install</a>');
  });

  it('fails the build on a link to nowhere', async () => {
    await expect(compile('dusk/index.md', '[gone](./gone/)\n')).rejects.toThrow(/broken docs link: \.\/gone\//);
  });

  it('highlights fenced code by class and leaves plain text alone', async () => {
    const page = await compile('dusk/index.md', '```ts\nconst a = 1;\n```\n\n```text\nplain\n```\n');
    expect(page.html).toContain('<code class="hljs language-ts"><span class="hljs-keyword">const</span>');
    expect(page.html).not.toContain('style=');
  });

  it('renders gfm tables', async () => {
    const page = await compile('dusk/index.md', '| a | b |\n| - | - |\n| 1 | 2 |\n');
    expect(page.html).toContain('<table>');
  });
});
