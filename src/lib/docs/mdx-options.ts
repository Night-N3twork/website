import type { CompileOptions } from '@mdx-js/mdx';
import rehypeHighlight from 'rehype-highlight';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import type { DocIndex } from './links.ts';
import { remarkDocs } from './remark.ts';

export function docsMdxOptions(root: string, pages: DocIndex): Pick<CompileOptions, 'remarkPlugins' | 'rehypePlugins'> {
  return {
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, [remarkDocs, { root, pages }]],
    rehypePlugins: [[rehypeHighlight, { detect: false, plainText: ['text', 'txt', 'plaintext'] }]],
  };
}
