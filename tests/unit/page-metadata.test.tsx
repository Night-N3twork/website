import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { getProject } from '@/content/projects';
import type { Locale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { headModel, missingHead } from '@/lib/seo/head';
import { breadcrumbJsonLd, softwareApplicationJsonLd } from '@/lib/seo/jsonld';

async function inner(locale: Locale, path: string, label: string, namespace: string) {
  const [nav, t] = await Promise.all([translator(locale, 'nav'), translator(locale, namespace)]);
  return headModel({ locale, path, title: nav(label), description: t('lede') });
}

describe('page metadata', () => {
  it('gives the home page the bare site name and a canonical per locale', async () => {
    const site = await translator('ja', 'site');
    const head = headModel({ locale: 'ja', path: '/', title: site('name'), description: site('description') });
    expect(head.title).toBe('Night Network');
    expect(head.canonical).toBe('https://night-x.com/ja');
  });

  it('titles the inner pages by their nav label and describes them by their lede', async () => {
    expect(await inner('en', '/projects', 'projects', 'projects')).toMatchObject({ title: 'Projects · Night Network', description: en.projects.lede, canonical: 'https://night-x.com/projects' });
    expect(await inner('es', '/contributors', 'contributors', 'contributors')).toMatchObject({ title: 'Contributors · Night Network', canonical: 'https://night-x.com/es/contributors' });
    expect(await inner('fr', '/supporters', 'supporters', 'supporters')).toMatchObject({ title: 'Supporters · Night Network', canonical: 'https://night-x.com/fr/supporters' });
    const community = await inner('en', '/community', 'community', 'community');
    expect(community.title).toBe('Community · Night Network');
    expect(community.alternates).toContainEqual({ hreflang: 'ja', href: 'https://night-x.com/ja/community' });
  });

  it('titles a project page by its name and describes it by its line', async () => {
    const project = getProject('space');
    if (!project) throw new Error('space');
    const t = await translator('en', 'projects');
    const head = headModel({ locale: 'en', path: '/projects/space', title: project.name, description: t('items.space.line') });
    expect(head).toMatchObject({ title: 'Space · Night Network', description: en.projects.items.space.line, canonical: 'https://night-x.com/projects/space' });
  });

  it('calls an unknown address missing in the tab title', async () => {
    const [site, t] = await Promise.all([translator('es', 'site'), translator('es', 'notFound')]);
    expect(missingHead({ title: t('meta'), description: site('description') }).title).toBe(`${en.notFound.meta} · Night Network`);
  });

  it('describes a project page as a SoftwareApplication under the projects breadcrumb', async () => {
    const project = getProject('lunar');
    if (!project) throw new Error('lunar');
    const [nav, t] = await Promise.all([translator('fr', 'nav'), translator('fr', 'projects')]);
    const path = `/projects/${project.slug}`;
    const app = softwareApplicationJsonLd(project, t('items.lunar.line'), 'fr');
    const crumbs = breadcrumbJsonLd([{ name: nav('projects'), path: '/projects' }, { name: project.name, path }], 'fr');
    expect(app).toMatchObject({ '@type': 'SoftwareApplication', name: 'Lunar', url: 'https://night-x.com/fr/projects/lunar', installUrl: 'https://lunaron.top' });
    expect(crumbs).toMatchObject({ itemListElement: [{ position: 1, item: 'https://night-x.com/fr/projects' }, { position: 2, name: 'Lunar', item: 'https://night-x.com/fr/projects/lunar' }] });
  });
});
