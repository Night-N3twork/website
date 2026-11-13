const PAGES: ReadonlySet<string> = new Set(['home', 'projects', 'project', 'community', 'contributors', 'supporters', 'privacy', 'terms', 'requests', 'docs']);

export interface RouteMatchLike {
  id: string;
  loaderData: unknown;
}

export function routeName(matches: readonly RouteMatchLike[]): string {
  const leaf = matches.at(-1);
  return leaf && PAGES.has(leaf.id) && leaf.loaderData !== undefined ? leaf.id : 'lost';
}
