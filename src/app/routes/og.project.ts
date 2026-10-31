import { getProject } from '@/content/projects';
import { isLocale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { ogLocale } from '@/lib/og/locale';
import { ogImage } from '@/lib/og/template';
import type { Route } from './+types/og.project';

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  const project = getProject(params.slug);
  if (!isLocale(params.locale) || !project) return new Response(null, { status: 404 });
  const t = await translator(ogLocale(params.locale), 'projects');
  return ogImage({ title: project.name, subtitle: t(`items.${project.slug}.line`), icon: project.slug });
}
