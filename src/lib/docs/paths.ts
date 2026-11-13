export const DOCS_PATH = '/docs';

export function docSlug(file: string): string {
  const bare = file.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '').replace(/\.mdx?$/, '');
  if (bare === 'index') return '';
  return bare.endsWith('/index') ? bare.slice(0, -'/index'.length) : bare;
}

export function docPath(slug: string): string {
  return slug ? `${DOCS_PATH}/${slug}` : DOCS_PATH;
}
