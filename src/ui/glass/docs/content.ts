import type { MDXContent } from 'mdx/types';
import { lazy, type LazyExoticComponent } from 'react';
import PAGES from 'virtual:docs-pages';

type DocModule = { default: MDXContent };

const ready = new Map<string, MDXContent>();
const waiting = new Map<string, LazyExoticComponent<MDXContent>>();

function loader(file: string): () => Promise<DocModule> {
  const load = PAGES[file];
  if (!load) throw new Error(`unknown docs file: ${file}`);
  return load;
}

export function remember(file: string, content: MDXContent): void {
  ready.set(file, content);
}

export async function preload(file: string): Promise<void> {
  if (ready.has(file)) return;
  remember(file, (await loader(file)()).default);
}

export function docContent(file: string): MDXContent | LazyExoticComponent<MDXContent> {
  const known = ready.get(file);
  if (known) return known;
  const later = waiting.get(file) ?? lazy(loader(file));
  waiting.set(file, later);
  return later;
}
