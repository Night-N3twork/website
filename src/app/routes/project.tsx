import type { MetaDescriptor } from 'react-router';
import { getProject, type Project, type Stage } from '@/content/projects';
import type { Locale } from '@/i18n/locales';
import { type Translate, translator } from '@/i18n/translate';
import { projectMonitor } from '@/lib/data/status';
import type { StatusMonitor } from '@/lib/data/status-poll';
import { relatedProjects } from '@/lib/projects/related';
import { headModel, shareImage } from '@/lib/seo/head';
import { breadcrumbJsonLd, softwareApplicationJsonLd } from '@/lib/seo/jsonld';
import { RouteError } from '@/ui/glass/Lost';
import { type DetailAction, type DetailCopy, ProjectDetail } from '@/ui/glass/projects/ProjectDetail';
import { headMeta, jsonLd, lostMeta, rootLost } from '../head';
import { localeOf, pagePath } from '../locale';
import type { Route } from './+types/project';

const STAGES: Stage[] = ['live', 'beta', 'building', 'planned'];

function actions(project: Project, t: Translate): DetailAction[] {
  const links: (DetailAction | null)[] = [
    project.url ? { href: project.url, label: t('projects.open', { name: project.name }) } : null,
    project.repo ? { href: project.repo, label: t('projects.source') } : null,
    project.npm ? { href: project.npm, label: t('projects.npm') } : null,
    project.discordInvite ? { href: project.discordInvite, label: t('projects.addToDiscord', { name: project.name }) } : null,
  ];
  return links.filter((link): link is DetailAction => link !== null);
}

function detailCopy(project: Project, t: Translate): DetailCopy {
  const stages = Object.fromEntries(STAGES.map((stage) => [stage, t(`projects.stages.${stage}`)])) as Record<Stage, string>;
  const group = t(`projects.groups.${project.group}.title`);
  const partner = project.partner ? t('projects.partner') : null;
  return {
    slug: project.slug,
    name: project.name,
    line: t(`projects.items.${project.slug}.line`),
    back: t('projects.all'),
    group,
    partner,
    stage: project.stage,
    stageLabel: stages[project.stage],
    actions: actions(project, t),
    featuresTitle: t('projects.sections.what'),
    features: (t.raw(`projects.items.${project.slug}.features`) as string[] | undefined) ?? [],
    status: {
      title: t('projects.sections.status'),
      stage: project.stage,
      stageLabel: stages[project.stage],
      group,
      line: t(`projects.groups.${project.group}.line`),
      partner,
      up: t('projects.status.up'),
      down: t('projects.status.down'),
      checked: t.raw('projects.status.checked') as string,
    },
    relatedTitle: t('projects.related'),
    related: relatedProjects(project.slug).map((p) => ({ slug: p.slug, name: p.name, stage: p.stage, line: t(`projects.items.${p.slug}.line`) })),
    stages,
  };
}

async function liveMonitor(slug: string): Promise<StatusMonitor | null> {
  const snapshot = await projectMonitor(slug);
  return snapshot ? { status: snapshot.status, uptime24h: snapshot.uptime24h, lastCheck: snapshot.lastCheck } : null;
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const locale = localeOf(params.locale);
  const project = getProject(params.slug);
  if (!project) throw new Response(null, { status: 404, statusText: 'Not Found' });
  const [t, monitor] = await Promise.all([translator(locale), liveMonitor(project.slug)]);
  const copy = detailCopy(project, t);
  return {
    locale,
    copy,
    monitorId: project.monitorId,
    monitor,
    seo: headModel({ locale, path: pagePath(request), title: project.name, description: copy.line, image: shareImage(locale, project.slug, `${project.name}: ${copy.line}`) }),
    crumbs: { home: t('nav.home'), projects: t('nav.projects') },
  };
}

function structured(project: Project, description: string, locale: Locale, crumbs: { home: string; projects: string }): MetaDescriptor[] {
  const trail = [
    { name: crumbs.home, path: '/' },
    { name: crumbs.projects, path: '/projects' },
    { name: project.name, path: `/projects/${project.slug}` },
  ];
  return [jsonLd(softwareApplicationJsonLd(project, description, locale)), jsonLd(breadcrumbJsonLd(trail, locale))];
}

export const meta: Route.MetaFunction = ({ loaderData, matches, params, error }) => {
  const project = getProject(params.slug);
  if (!loaderData || !project) return lostMeta(rootLost(matches, error));
  return [...headMeta(loaderData.seo), ...structured(project, loaderData.copy.line, loaderData.locale, loaderData.crumbs)];
};

export default function ProjectRoute({ loaderData }: Route.ComponentProps) {
  const { copy, locale, monitorId, monitor } = loaderData;
  return <ProjectDetail copy={copy} locale={locale} monitorId={monitorId} monitor={monitor} />;
}

export const ErrorBoundary = RouteError;
