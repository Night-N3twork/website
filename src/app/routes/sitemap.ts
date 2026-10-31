import { ROUTE_CACHE, sitemapXml } from '@/lib/seo/routes';

export function loader(): Response {
  return new Response(sitemapXml(), { headers: { 'content-type': 'application/xml', 'cache-control': ROUTE_CACHE } });
}
