import { ROUTE_CACHE, robotsTxt } from '@/lib/seo/routes';

export function loader(): Response {
  return new Response(robotsTxt(), { headers: { 'content-type': 'text/plain', 'cache-control': ROUTE_CACHE } });
}
