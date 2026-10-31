import { PARTNERS } from '@/content/partners';
import { SITE } from '@/content/site';
import { translator } from '@/i18n/translate';
import { headModel } from '@/lib/seo/head';
import { Community } from '@/ui/glass/community/Community';
import { RouteError } from '@/ui/glass/Lost';
import { headMeta, lostMeta, rootLost } from '../head';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/community';

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const t = await translator(locale);
  return {
    seo: headModel({ locale, path: pagePath(request), title: t('nav.community'), description: t('community.lede') }),
    copy: {
      kicker: t('nav.community'),
      title: t('community.title'),
      lede: t('community.lede'),
      links: [
        { href: SITE.discord, label: t('community.discord') },
        { href: SITE.github, label: 'GitHub' },
        { href: SITE.gitlab, label: 'GitLab' },
      ],
      contribute: t('community.contribute'),
      contributeLede: t('community.contributeLede'),
      conduct: t('community.conduct'),
      conductPending: t('community.conductPending'),
      partnersTitle: t('partners.title'),
      partnersLede: t('partners.lede'),
      partners: PARTNERS.map((p) => ({ id: p.id, name: p.name, url: p.url, host: new URL(p.url).hostname })),
    },
  };
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function CommunityRoute({ loaderData }: Route.ComponentProps) {
  return <Community copy={loaderData.copy} />;
}

export const ErrorBoundary = RouteError;
