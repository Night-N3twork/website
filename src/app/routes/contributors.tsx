import { ROLES } from '@/content/roles';
import { translator } from '@/i18n/translate';
import { getContributors } from '@/lib/data/contributors';
import { headModel } from '@/lib/seo/head';
import peoplePath from '@/styles/glass/people.css?url';
import { RouteError } from '@/ui/glass/Lost';
import { Button } from '@/ui/glass/parts';
import { PeopleHead } from '@/ui/glass/people/PeopleHead';
import { toPerson } from '@/ui/glass/people/person';
import { RoleGroups } from '@/ui/glass/people/RoleGroups';
import { headMeta, lostMeta, rootLost } from '../head';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/contributors';

export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: peoplePath }];

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const [t, cards] = await Promise.all([translator(locale), getContributors()]);
  const groups = ROLES.map((role) => ({
    key: role.id,
    title: t(`roles.${role.id}`),
    subnote: role.id === 'owner' ? t('contributors.ownerSubnote') : null,
    people: cards.filter((card) => card.role === role.id).map((card) => toPerson(card, card.since ? t('contributors.since', { year: String(card.since) }) : null, card.link)),
    note: null,
  })).filter((group) => group.people.length > 0);
  return {
    seo: headModel({ locale, path: pagePath(request), title: t('nav.contributors'), description: t('contributors.lede') }),
    head: { kicker: t('nav.contributors'), title: t('contributors.title'), lede: t('contributors.lede') },
    join: t('contributors.join'),
    groups,
  };
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function ContributorsRoute({ loaderData }: Route.ComponentProps) {
  const { head, join, groups } = loaderData;
  return (
    <>
      <PeopleHead copy={head}>
        <Button kind="primary" to="/community">
          {join}
        </Button>
      </PeopleHead>
      <RoleGroups label={head.kicker} groups={groups} />
    </>
  );
}

export const ErrorBoundary = RouteError;
