import { join } from 'node:path';
import mdx from '@mdx-js/rollup';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { docsMdxOptions } from './mdx-options.ts';
import { type DocScan, scanDocs } from './scan.ts';

const PAGES = 'virtual:docs-pages';
const RESOLVED = `\0${PAGES}`;

const fingerprint = (scan: DocScan): string => JSON.stringify([scan.pages, [...scan.drafts]]);

function pagesModule(root: string, pages: readonly string[]): string {
  const entries = pages.map((file) => `  ${JSON.stringify(file)}: () => import(${JSON.stringify(normalizePath(join(root, file)))}),`);
  return `export default {\n${entries.join('\n')}\n};\n`;
}

function watchPages(server: ViteDevServer, root: string, scan: DocScan): void {
  const folder = `${normalizePath(root)}/`;
  const known = fingerprint(scan);
  const check = (path: string): void => {
    if (!normalizePath(path).startsWith(folder)) return;
    try {
      if (fingerprint(scanDocs(root)) !== known) void server.restart();
    } catch (error) {
      server.config.logger.error(error instanceof Error ? error.message : String(error));
    }
  };
  server.watcher.on('add', check).on('unlink', check).on('change', check);
}

function docsPages(root: string, scan: DocScan): Plugin {
  return {
    name: 'docs-pages',
    resolveId: (id) => (id === PAGES ? RESOLVED : undefined),
    load: (id) => (id === RESOLVED ? pagesModule(root, scan.pages) : undefined),
    configureServer: (server) => watchPages(server, root, scan),
  };
}

export function docsMdx(root: string): Plugin[] {
  const scan = scanDocs(root);
  return [{ enforce: 'pre', ...(mdx({ include: /\/src\/content\/docs\/.+\.mdx?$/, ...docsMdxOptions(root, scan) }) as Plugin) }, docsPages(root, scan)];
}
