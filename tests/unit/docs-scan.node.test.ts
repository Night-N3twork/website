import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { isDraft, scanDocs } from '@/lib/docs/scan';

const CONTENT = fileURLToPath(new URL('../../src/content/docs', import.meta.url));
const temps: string[] = [];

function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'docs-scan-'));
  temps.push(root);
  for (const [file, body] of Object.entries(files)) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), body);
  }
  return root;
}

const page = (title: string, extra = ''): string => `---\ntitle: ${title}\n${extra}---\n# ${title}\n`;

afterEach(() => {
  for (const root of temps.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('isDraft', () => {
  it('reads draft only from the frontmatter', () => {
    expect(isDraft('---\ntitle: A\ndraft: true\n---\nbody', 'a.md')).toBe(true);
    expect(isDraft('---\ntitle: A\ndraft: false\n---\nbody', 'a.md')).toBe(false);
    expect(isDraft('---\ntitle: A\n---\ndraft: true\n', 'a.md')).toBe(false);
  });

  it('parses the yaml the way the page compiler does', () => {
    expect(isDraft('---\ntitle: A\ndraft: true # still writing\n---\n', 'a.md')).toBe(true);
    expect(isDraft('---\ntitle: A\ndraft: True\n---\n', 'a.md')).toBe(true);
  });

  it('rejects frontmatter the docs do not understand', () => {
    expect(() => isDraft('no frontmatter', 'a.md')).toThrow(/invalid docs frontmatter in a\.md/);
    expect(() => isDraft('---\ntitle: A\ndraft: yes please\n---\n', 'a.md')).toThrow(/a\.md/);
    expect(() => isDraft('---\ntitle: A\ntemplate: splash\n---\n', 'a.md')).toThrow(/template/);
    expect(() => isDraft('---\ntitle: A\nsidebar:\n  hidden: true\n---\n', 'a.md')).toThrow(/hidden/);
    expect(() => isDraft('---\ntitle: [A\n---\n', 'b.md')).toThrow(/unreadable docs frontmatter in b\.md/);
  });
});

describe('scanDocs', () => {
  it('splits the real docs into published pages and drafts', () => {
    const { published, drafts } = scanDocs(CONTENT);
    expect(published.has('')).toBe(true);
    expect(published.has('dusk/dpm/registry')).toBe(true);
    expect(published.has('services/space')).toBe(true);
    expect([...drafts].sort()).toEqual(['eclipse', 'eclipse/architecture', 'eclipse/installation', 'eclipse/limitations', 'eclipse/operations', 'eclipse/troubleshooting', 'reference/eclipse-api']);
  });

  it('lists the files of published pages only', () => {
    const { pages } = scanDocs(tree({ 'index.md': page('Home'), 'a.md': page('A', 'draft: true\n'), 'b/index.md': page('B') }));
    expect(pages).toEqual(['b/index.md', 'index.md']);
  });

  it('reads mdx files too', () => {
    const { published } = scanDocs(tree({ 'index.mdx': page('A'), 'a/b.mdx': page('B'), 'notes.txt': 'skip' }));
    expect([...published].sort()).toEqual(['', 'a/b']);
  });

  it('throws when a file and a folder index share a slug', () => {
    expect(() => scanDocs(tree({ 'a.md': page('A'), 'a/index.md': page('A') }))).toThrow(/a\.md and a\/index\.md/);
  });
});
