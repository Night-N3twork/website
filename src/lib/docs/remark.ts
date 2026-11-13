import { relative, sep } from 'node:path';
import { valueToEstree } from 'estree-util-value-to-estree';
import GithubSlugger from 'github-slugger';
import type { Definition, Heading, Link, Parent, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { define } from 'unist-util-mdx-define';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { type DocIndex, resolveDocLink } from './links.ts';
import type { TocEntry } from './page.ts';

export interface RemarkDocsOptions {
  root: string;
  pages: DocIndex;
}

const PREAMBLE = new Set(['yaml', 'toml', 'mdxjsEsm']);

function takeLead(tree: Root): string | null {
  const at = tree.children.findIndex((node) => !PREAMBLE.has(node.type));
  const lead = tree.children[at];
  if (lead?.type !== 'heading' || lead.depth !== 1) return null;
  tree.children.splice(at, 1);
  return toString(lead);
}

function slugHeadings(tree: Root): TocEntry[] {
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  visit(tree, 'heading', (node: Heading) => {
    const text = toString(node);
    const id = slugger.slug(text);
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    if (node.depth === 2 || node.depth === 3) toc.push({ depth: node.depth, id, text });
  });
  return toc;
}

function rewriteLinks(tree: Root, file: VFile, from: string, pages: DocIndex): void {
  visit(tree, (node, index, parent: Parent | undefined) => {
    if (node.type !== 'link' && node.type !== 'definition') return;
    const target = node as Link | Definition;
    const link = resolveDocLink(target.url, from, pages);
    if (link.kind === 'doc') target.url = link.href;
    if (link.kind === 'missing') file.fail(`broken docs link: ${target.url} (no page at ${link.target})`, node);
    if (link.kind === 'ambiguous') file.fail(`ambiguous docs link: ${target.url} (could be ${link.targets.join(' or ')})`, node);
    if (link.kind !== 'draft') return;
    if (node.type === 'definition' || !parent || index === undefined) return file.fail(`docs link to a draft page: ${target.url}`, node);
    parent.children.splice(index, 1, ...(node as Link).children);
    return [SKIP, index];
  });
}

export function remarkDocs({ root, pages }: RemarkDocsOptions) {
  return (tree: Root, file: VFile): void => {
    const from = relative(root, file.path).split(sep).join('/');
    const heading = takeLead(tree);
    const toc = slugHeadings(tree);
    rewriteLinks(tree, file, from, pages);
    define(tree, file, { heading: valueToEstree(heading), toc: valueToEstree(toc) });
  };
}
