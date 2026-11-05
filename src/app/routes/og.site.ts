import { isLocale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { ogLocale } from '@/lib/og/locale';
import { ogImage } from '@/lib/og/template';
import type { Route } from './+types/og.site';

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  if (!isLocale(params.locale)) return new Response(null, { status: 404 });
  const locale = ogLocale(params.locale);
  const hero = await translator(locale, 'home.hero');
  const stats = await translator(locale, 'home.stats');
  return ogImage({ title: hero('headline'), subtitle: [stats('countShort'), stats('countUnit'), stats('line')].join(' ') });
}
