import { PAGE_PATHS, ROUTE_CACHE, sitemapXml } from '@/lib/seo/routes';
import { DOC_PATHS } from '../docs.server';

export function loader(): Response {
  return new Response(sitemapXml(PAGE_PATHS, DOC_PATHS), { headers: { 'content-type': 'application/xml', 'cache-control': ROUTE_CACHE } });
}
