import { DEFAULT_LOCALE } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { ROUTE_CACHE, webManifest } from '@/lib/seo/routes';

export async function loader(): Promise<Response> {
  const site = await translator(DEFAULT_LOCALE, 'site');
  return new Response(webManifest(site('description')), { headers: { 'content-type': 'application/manifest+json', 'cache-control': ROUTE_CACHE } });
}
