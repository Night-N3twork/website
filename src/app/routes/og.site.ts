import { isLocale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { ogLocale } from '@/lib/og/locale';
import { ogImage } from '@/lib/og/template';
import type { Route } from './+types/og.site';

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  if (!isLocale(params.locale)) return new Response(null, { status: 404 });
  const hero = await translator(ogLocale(params.locale), 'home.hero');
  return ogImage({ title: hero('headline') });
}
