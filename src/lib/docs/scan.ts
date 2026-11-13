import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse } from 'yaml';
import { type Frontmatter, readFrontmatter } from './frontmatter.ts';
import type { DocIndex } from './links.ts';
import { docSlug } from './paths.ts';

export interface DocScan extends DocIndex {
  pages: readonly string[];
}

const SOURCE = /\.mdx?$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function parseYaml(text: string, file: string): unknown {
  try {
    return parse(text);
  } catch (error) {
    throw new Error(`unreadable docs frontmatter in ${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

export function frontmatterOf(source: string, file: string): Frontmatter {
  const front = FRONTMATTER.exec(source);
  return readFrontmatter(front ? parseYaml(front[1], file) : undefined, file);
}

export function isDraft(source: string, file: string): boolean {
  return frontmatterOf(source, file).draft === true;
}

export function docFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(sep).join('/'))
    .filter((file) => SOURCE.test(file))
    .sort();
}

export function scanDocs(root: string): DocScan {
  const owners = new Map<string, string>();
  const published = new Set<string>();
  const drafts = new Set<string>();
  const pages: string[] = [];
  for (const file of docFiles(root)) {
    const slug = docSlug(file);
    const owner = owners.get(slug);
    if (owner) throw new Error(`two docs share the slug "${slug}": ${owner} and ${file}`);
    owners.set(slug, file);
    if (isDraft(readFileSync(join(root, file), 'utf8'), file)) {
      drafts.add(slug);
      continue;
    }
    published.add(slug);
    pages.push(file);
  }
  return { published, drafts, pages };
}
