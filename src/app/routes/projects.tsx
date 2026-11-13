import { PRODUCT_GROUPS, projectsIn, type Stage } from '@/content/projects';
import { showcase } from '@/content/shots';
import { translator } from '@/i18n/translate';
import { headModel } from '@/lib/seo/head';
import { headMeta, lostMeta, rootLost } from '../head';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { flipGroups, stopGroups } from '@/motion/micro/filter';
import { withScene } from '@/scene/slot';
import { RouteError } from '@/ui/glass/Lost';
import { Filter, type FilterValue } from '@/ui/glass/projects/Filter';
import { ProjectIndex } from '@/ui/glass/projects/ProjectIndex';
import { ProjectsHead } from '@/ui/glass/projects/ProjectsHead';
import { Shots } from '@/ui/glass/projects/Shots';
import shotsPath from '@/styles/glass/shots.css?url';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/projects';

const STAGES: Stage[] = ['live', 'beta', 'building', 'planned'];

export const links: Route.LinksFunction = () => [{ rel: 'stylesheet', href: shotsPath }];

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const t = await translator(locale);
  const groups = PRODUCT_GROUPS.map((key) => ({
    key,
    title: t(`projects.groups.${key}.title`),
    line: t(`projects.groups.${key}.line`),
    items: projectsIn(key).map((p) => ({ slug: p.slug, name: p.name, stage: p.stage, line: t(`projects.items.${p.slug}.line`) })),
  }));
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const shots = showcase().map(({ project, n, image }) => ({
    slug: project.slug,
    group: project.group,
    n,
    name: project.name,
    line: t(`projects.items.${project.slug}.line`),
    stage: project.stage,
    image,
  }));
  return {
    seo: headModel({ locale, path: pagePath(request), title: t('nav.projects'), description: t('projects.lede') }),
    head: { kicker: t('nav.projects'), title: t('projects.title', { count }), lede: t('projects.lede') },
    all: t('projects.all'),
    shotsCopy: { label: t('projects.shots.label'), prev: t('projects.shots.prev'), next: t('projects.shots.next') },
    shots,
    groups,
    stages: Object.fromEntries(STAGES.map((stage) => [stage, t(`projects.stages.${stage}`)])) as Record<Stage, string>,
  };
}

export const meta: Route.MetaFunction = ({ loaderData, matches, error }) => (loaderData ? headMeta(loaderData.seo) : lostMeta(rootLost(matches, error)));

export default function Projects({ loaderData }: Route.ComponentProps) {
  const { head, groups, stages, all, shots, shotsCopy } = loaderData;
  const [filter, setFilter] = useState<FilterValue>('all');
  useEffect(() => stopGroups, []);
  const options = [{ value: 'all' as const, label: all, count: groups.reduce((n, g) => n + g.items.length, 0) }, ...groups.map((g) => ({ value: g.key, label: g.title, count: g.items.length }))];
  const choose = (next: FilterValue): void => {
    if (next === filter) return;
    withScene((scene) => scene.nudge('hover'));
    flipGroups([...document.querySelectorAll<HTMLElement>('main .index-group')], () => flushSync(() => setFilter(next)));
  };
  return (
    <>
      <ProjectsHead copy={head}>
        <Filter label={head.kicker} options={options} value={filter} onChange={choose} />
      </ProjectsHead>
      <Shots copy={shotsCopy} slides={shots} filter={filter} stages={stages} />
      <ProjectIndex label={head.kicker} filter={filter} groups={groups} stages={stages} />
    </>
  );
}

export const ErrorBoundary = RouteError;
