import { PROJECTS, projectsIn, type ProductGroup, type Stage } from '@/content/projects';
import type { Translate } from '@/i18n/translate';
import { translator } from '@/i18n/translate';
import { headModel, shareImage } from '@/lib/seo/head';
import { RouteError } from '@/ui/glass/Lost';
import { Catalog } from '@/ui/glass/home/Catalog';
import { CommunityCall } from '@/ui/glass/home/CommunityCall';
import { Flagship } from '@/ui/glass/home/Flagship';
import { Hero } from '@/ui/glass/home/Hero';
import { Marquee } from '@/ui/glass/home/Marquee';
import { Products } from '@/ui/glass/home/Products';
import { Statement } from '@/ui/glass/home/Statement';
import type { RowItem } from '@/ui/glass/parts';
import { headMeta, lostMeta, rootLost } from '../head';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/home';

const STAGES: Stage[] = ['live', 'beta', 'building', 'planned'];
const CATALOG: ProductGroup[] = ['browsers', 'apps'];
const FLAGSHIP = 'dusk';

function rows(t: Translate, group: ProductGroup): RowItem[] {
  return projectsIn(group).map((p) => ({ slug: p.slug, name: p.name, stage: p.stage, line: t(`projects.items.${p.slug}.line`) }));
}

function sections(t: Translate) {
  const flagship = PROJECTS.find((p) => p.slug === FLAGSHIP);
  return {
    stages: Object.fromEntries(STAGES.map((stage) => [stage, t(`projects.stages.${stage}`)])) as Record<Stage, string>,
    products: { eyebrow: t('projects.groups.platform.title'), title: t('home.products.title'), lede: t('home.products.lede'), items: rows(t, 'platform') },
    marquee: PROJECTS.map((p) => ({ slug: p.slug, name: p.name, stage: p.stage })),
    catalog: { title: t('home.catalog.title'), lede: t('home.catalog.lede'), tabs: CATALOG.map((key) => ({ key, label: t(`projects.groups.${key}.title`), items: rows(t, key) })) },
    flagship: { kicker: t('home.flagship.kicker'), title: t('home.flagship.title'), line: t('home.flagship.line'), notes: t.raw('home.flagship.notes') as string[], stage: flagship?.stage ?? 'building' },
    community: { title: t('community.title'), lede: t('community.lede'), discord: t('community.discord') },
  };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const t = await translator(locale);
  return {
    seo: headModel({ locale, path: pagePath(request), title: t('site.name'), description: t('site.description'), image: shareImage(locale) }),
    hero: {
      subline: t('home.hero.subline'),
      headline: t('home.hero.headline'),
      cta: t('home.hero.cta'),
      community: t('home.hero.community'),
      countShort: t('home.stats.countShort'),
      countUnit: t('home.stats.countUnit'),
      statLine: t('home.stats.line'),
    },
    support: t('home.hero.support'),
    ...sections(t),
  };
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function Home({ loaderData: data }: Route.ComponentProps) {
  return (
    <>
      <Hero copy={data.hero} />
      <Statement text={data.support} />
      <Products copy={data.products} stages={data.stages} />
      <Marquee items={data.marquee} />
      <Catalog copy={data.catalog} stages={data.stages} onSelect={(panel) => void import('@/motion/micro/tabs').then(({ fadePanel }) => fadePanel(panel))} />
      <Flagship copy={data.flagship} stages={data.stages} />
      <CommunityCall copy={data.community} />
    </>
  );
}

export const ErrorBoundary = RouteError;
