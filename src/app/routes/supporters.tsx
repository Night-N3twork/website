import { SITE } from '@/content/site';
import { translator } from '@/i18n/translate';
import { getSupporters } from '@/lib/data/supporters';
import { headModel } from '@/lib/seo/head';
import peoplePath from '@/styles/glass/people.css?url';
import { RouteError } from '@/ui/glass/Lost';
import { Button } from '@/ui/glass/parts';
import { PeopleHead } from '@/ui/glass/people/PeopleHead';
import { toPerson } from '@/ui/glass/people/person';
import { SupporterGroups } from '@/ui/glass/people/SupporterGroups';
import { headMeta, lostMeta, rootLost } from '../head';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/supporters';

export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: peoplePath }];

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const [t, supporters] = await Promise.all([translator(locale), getSupporters()]);
  const empty = t('supporters.empty');
  const boosters = supporters.boosters.map((s) => toPerson(s));
  const donators = supporters.donators.map((s) => toPerson(s));
  return {
    seo: headModel({ locale, path: pagePath(request), title: t('nav.supporters'), description: t('supporters.lede') }),
    head: { kicker: t('nav.supporters'), title: t('supporters.title'), lede: t('supporters.lede') },
    actions: { patreon: t('supporters.patreon'), cashApp: t('supporters.cashApp') },
    groups: [
      { key: 'boosters', title: t('supporters.boosters'), people: boosters, note: supporters.ok ? (boosters.length ? null : empty) : t('supporters.unavailable') },
      { key: 'donators', title: t('supporters.donators'), people: donators, note: donators.length ? null : empty },
    ],
    tiers: { title: t('supporters.tiers'), name: t('supporters.tierName'), price: t('supporters.tierPrice'), perks: t.raw('supporters.perks') as string[] },
  };
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function SupportersRoute({ loaderData }: Route.ComponentProps) {
  const { head, actions, groups, tiers } = loaderData;
  return (
    <>
      <PeopleHead copy={head}>
        <Button kind="primary" to={SITE.patreon}>
          {actions.patreon}
        </Button>
        <Button kind="ghost" to={SITE.cashApp}>
          {actions.cashApp}
        </Button>
      </PeopleHead>
      <SupporterGroups label={head.kicker} groups={groups} tiers={tiers} />
    </>
  );
}

export const ErrorBoundary = RouteError;
