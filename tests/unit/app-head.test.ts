import { describe, expect, it } from 'vitest';
import { headMeta, jsonLd } from '@/app/head';
import { headModel, missingHead, shareImage } from '@/lib/seo/head';
import { organizationJsonLd } from '@/lib/seo/jsonld';

const projects = headModel({ locale: 'es', path: '/projects', title: 'Proyectos', description: 'd', image: shareImage('es') });

describe('headMeta', () => {
  it('links the canonical and every hreflang alternate', () => {
    const meta = headMeta(projects);
    expect(meta).toContainEqual({ tagName: 'link', rel: 'canonical', href: 'https://night-x.com/es/projects' });
    const alternates = meta.filter((m) => 'rel' in m && m.rel === 'alternate');
    expect(alternates.map((m) => ('hrefLang' in m ? m.hrefLang : null))).toEqual(['en', 'es', 'fr', 'ja', 'x-default']);
  });

  it('carries the title, description, og locale and share image', () => {
    const meta = headMeta(projects);
    expect(meta).toContainEqual({ title: 'Proyectos · Night Network' });
    expect(meta).toContainEqual({ name: 'description', content: 'd' });
    expect(meta).toContainEqual({ property: 'og:locale', content: 'es_ES' });
    expect(meta).toContainEqual({ property: 'og:image', content: 'https://night-x.com/es/opengraph-image' });
    expect(meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
  });

  it('describes the share image with the given alt text and falls back to the site name', () => {
    const described = headMeta(headModel({ locale: 'en', path: '/', title: 'Night Network', description: 'd', image: shareImage('en', undefined, 'A glass crescent moon over a snow peak.') }));
    const plain = headMeta(projects);
    expect(described).toContainEqual({ property: 'og:image:alt', content: 'A glass crescent moon over a snow peak.' });
    expect(described).toContainEqual({ name: 'twitter:image:alt', content: 'A glass crescent moon over a snow peak.' });
    expect(plain).toContainEqual({ property: 'og:image:alt', content: 'Night Network' });
  });

  it('marks a missing page noindex with no canonical', () => {
    const meta = headMeta(missingHead({ title: 'Page not found', description: 'gone' }));
    expect(meta).toContainEqual({ name: 'robots', content: 'noindex' });
    expect(meta.some((m) => 'rel' in m && m.rel === 'canonical')).toBe(false);
    expect(meta.some((m) => 'property' in m)).toBe(false);
  });
});

describe('tag order', () => {
  it('matches the order of the previous head', () => {
    const keys = headMeta(projects).map((m) => {
      const tag = m as Record<string, unknown>;
      if ('title' in tag) return 'title';
      if ('tagName' in tag) return `link:${String(tag.rel)}`;
      return String(tag.property ?? tag.name);
    });
    const og = ['og:title', 'og:description', 'og:url', 'og:site_name', 'og:locale', 'og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:locale:alternate', 'og:locale:alternate', 'og:locale:alternate', 'og:type'];
    const twitter = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt', 'twitter:image:type', 'twitter:image:width', 'twitter:image:height'];
    expect(keys).toEqual(['title', 'description', 'robots', 'link:canonical', ...Array(5).fill('link:alternate'), ...og, ...twitter]);
  });
});

describe('jsonLd', () => {
  it('wraps structured data for the meta export', () => {
    const data = organizationJsonLd();
    expect(jsonLd(data)).toEqual({ 'script:ld+json': data });
  });
});
