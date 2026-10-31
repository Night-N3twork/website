import { describe, expect, it, vi } from 'vitest';
import { getProject, PROJECTS } from '@/content/projects';
import { ogLocale } from '@/lib/og/locale';
import { breadcrumbJsonLd, organizationJsonLd, serializeJsonLd, softwareApplicationJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';
import { absoluteUrl, hreflangUrls, localizedPath, PAGE_PATHS } from '@/lib/seo/paths';

const CONTEXT = 'https://schema.org' as const;
const PROJECTS_HREFLANG = {
  en: 'https://night-x.com/projects',
  es: 'https://night-x.com/es/projects',
  fr: 'https://night-x.com/fr/projects',
  ja: 'https://night-x.com/ja/projects',
  'x-default': 'https://night-x.com/projects',
};

describe('paths', () => {
  it('leaves English unprefixed and prefixes the others', () => {
    expect(localizedPath('en', '/')).toBe('/');
    expect(localizedPath('ja', '/')).toBe('/ja');
    expect(localizedPath('es', '/projects/space')).toBe('/es/projects/space');
    expect(absoluteUrl('/')).toBe('https://night-x.com');
    expect(absoluteUrl('/fr')).toBe('https://night-x.com/fr');
  });

  it('enumerates the home, the index, every project and the three team pages', () => {
    expect(PAGE_PATHS).toHaveLength(PROJECTS.length + 5);
    expect(PAGE_PATHS).toContain('/projects/link-archive');
    expect(PAGE_PATHS).toContain('/community');
  });

  it('lists every locale plus x-default for a path', () => {
    expect(hreflangUrls('/projects')).toEqual(PROJECTS_HREFLANG);
  });
});

describe('ogLocale', () => {
  it('keeps the locales the share image font can set and falls back to English otherwise', () => {
    expect(ogLocale('fr')).toBe('fr');
    expect(ogLocale('es')).toBe('es');
    expect(ogLocale('ja')).toBe('en');
    expect(ogLocale('de')).toBe('en');
  });
});

describe('jsonld', () => {
  it('escapes closing tags when serialising', () => {
    expect(serializeJsonLd({ '@context': CONTEXT, '@type': 'Thing', name: '</script><b>' })).not.toContain('</script>');
    expect(serializeJsonLd({ '@context': CONTEXT, '@type': 'Thing', name: '</script>' })).toContain('\\u003c/script>');
  });

  it('builds an Organization and a WebSite with the social profiles and locales', () => {
    expect(organizationJsonLd()).toMatchObject({
      '@type': 'Organization',
      url: 'https://night-x.com',
      sameAs: expect.arrayContaining(['https://discord.gg/JS6u8KuXf7', 'https://github.com/Night-N3twork', 'https://gitlab.com/nightnetwork']),
    });
    expect(webSiteJsonLd()).toMatchObject({ '@type': 'WebSite', url: 'https://night-x.com', inLanguage: ['en', 'es', 'fr', 'ja'] });
  });

  it('builds a SoftwareApplication and a BreadcrumbList for a project', () => {
    const space = getProject('space');
    if (!space) throw new Error('space missing');
    const app = softwareApplicationJsonLd(space, 'A proxy.', 'en');
    expect(app).toMatchObject({ '@type': 'SoftwareApplication', name: 'Space', url: 'https://night-x.com/projects/space', installUrl: 'https://gointospace.app' });
    const crumbs = breadcrumbJsonLd([{ name: 'Projects', path: '/projects' }, { name: 'Space', path: '/projects/space' }], 'ja');
    expect(crumbs).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Projects', item: 'https://night-x.com/ja/projects' },
        { '@type': 'ListItem', position: 2, name: 'Space', item: 'https://night-x.com/ja/projects/space' },
      ],
    });
  });
});

describe('site url', () => {
  it('follows the configured origin for every absolute url', async () => {
    vi.resetModules();
    vi.doMock('@/lib/env', () => ({ env: { siteUrl: 'https://next.night-x.com', gaId: null } }));
    const paths = await import('@/lib/seo/paths');
    expect(paths.absoluteUrl('/projects')).toBe('https://next.night-x.com/projects');
    expect(paths.localizedUrl('ja', '/')).toBe('https://next.night-x.com/ja');
    expect(paths.hreflangUrls('/')['x-default']).toBe('https://next.night-x.com');
    vi.doUnmock('@/lib/env');
  });
});
