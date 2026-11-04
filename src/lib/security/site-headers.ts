import { securityHeaders } from './headers';

export const PAGE_CACHE = 's-maxage=60, stale-while-revalidate=3540';
export const IMMUTABLE = 'public, max-age=31536000, immutable';

export const HTML_TYPE = 'text/html; charset=utf-8';
const HASHED_ASSET = /^\/assets\/[\w.-]+-[\w-]{8,}\.(?:js|css|woff2|avif|webp|png|svg)$/;
const HASHED_BACKDROP = /^\/backdrops\/(?:range|peak)-(?:1280|2400)\.[0-9a-f]{8}\.(?:avif|webp)$/;

type Options = { dev: boolean; nonce?: string };

export function withSiteHeaders(response: Response, options: Options): Response {
  const headers = new Headers(response.headers);
  for (const { key, value } of securityHeaders({ ...options, nonce: options.nonce ?? '' })) headers.set(key, value);
  const type = (headers.get('content-type') ?? '').trim().toLowerCase();
  if (type === 'text/html') headers.set('content-type', HTML_TYPE);
  if (type.includes('text/html') && !headers.has('cache-control')) headers.set('cache-control', PAGE_CACHE);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function assetCache(pathname: string): string | null {
  return HASHED_ASSET.test(pathname) || HASHED_BACKDROP.test(pathname) ? IMMUTABLE : null;
}
