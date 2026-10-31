import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { PARTNERS } from '@/content/partners';
import { PRODUCT_ICONS } from '@/content/product-icons';
import { getProject, MONITORED, PRODUCT_GROUPS, PROJECTS, projectsIn } from '@/content/projects';
import { ROLES } from '@/content/roles';
import { SITE } from '@/content/site';

const items = en.projects.items as Record<string, { line: string; features: string[] }>;
const CONCEPTS = ['aurora', 'solar'];

describe('PROJECTS', () => {
  it('lists sixteen projects with unique slugs, Dusk first', () => {
    expect(PROJECTS).toHaveLength(16);
    expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(16);
    expect(PROJECTS[0].slug).toBe('dusk');
  });

  it('keeps each group together, platform first, and the older browsers last', () => {
    expect(PROJECTS.map((p) => p.group)).toEqual(PRODUCT_GROUPS.flatMap((group) => projectsIn(group).map(() => group)));
    expect(projectsIn('platform').map((p) => p.slug)).toEqual(['dusk', 'moonbeam', 'eclipse', 'luna', 'moonscale', 'nova', 'dpm']);
    expect(projectsIn('browsers').map((p) => p.slug)).toEqual(['ddx', 'daylight', 'space', 'lunar']);
  });

  it('maps Uptime Kuma monitor ids for the four monitored projects only', () => {
    expect(Object.fromEntries(MONITORED.map((p) => [p.slug, p.monitorId]))).toEqual({ 'link-archive': 16, ddx: 2, space: 1, lunar: 5 });
  });

  it('only relates to existing slugs and never to itself', () => {
    for (const p of PROJECTS) {
      expect(p.related).not.toContain(p.slug);
      for (const r of p.related) expect(getProject(r)).toBeDefined();
    }
  });

  it('has an English tagline for every project and features for every one with code behind it', () => {
    for (const p of PROJECTS) {
      expect(items[p.slug]?.line).toBeTruthy();
      if (!CONCEPTS.includes(p.slug)) expect(items[p.slug]?.features.length).toBeGreaterThan(1);
    }
  });

  it('draws an icon for every project, with an accent part', () => {
    for (const p of PROJECTS) {
      expect(PRODUCT_ICONS[p.slug].base.length).toBeGreaterThan(0);
      expect(PRODUCT_ICONS[p.slug].accent.length).toBeGreaterThan(0);
    }
  });

  it('marks Lunar as a partner project and nothing else', () => {
    expect(PROJECTS.filter((p) => p.partner).map((p) => p.slug)).toEqual(['lunar']);
  });

  it('only calls monitored projects live', () => {
    expect(PROJECTS.filter((p) => p.stage === 'live').every((p) => p.monitorId !== null)).toBe(true);
  });

  it('offers a Discord invite only for the publicly addable bot', () => {
    expect(PROJECTS.filter((p) => p.discordInvite !== null).map((p) => p.slug)).toEqual(['solar']);
  });

  it('uses https for every url, invite, repo and package', () => {
    for (const p of PROJECTS) {
      if (p.url) expect(p.url).toMatch(/^https:\/\//);
      if (p.discordInvite) expect(p.discordInvite).toMatch(/^https:\/\/discord\.com\/oauth2\/authorize\?client_id=\d+$/);
      if (p.repo) expect(p.repo).toMatch(/^https:\/\/(github\.com|gitlab\.com)\//);
      if (p.npm) expect(p.npm).toMatch(/^https:\/\/www\.npmjs\.com\/package\/@nightnetwork\/[a-z]+$/);
    }
  });

  it('returns undefined for an unknown slug', () => {
    expect(getProject('nope')).toBeUndefined();
  });
});

describe('PARTNERS, ROLES, SITE', () => {
  it('has five partners with https urls and logos under /partners', () => {
    expect(PARTNERS).toHaveLength(5);
    for (const p of PARTNERS) {
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.logo).toMatch(/^\/partners\/[a-z]+\.png$/);
    }
  });

  it('has an English name for every role', () => {
    for (const r of ROLES) expect((en.roles as Record<string, string>)[r.id]).toBeTruthy();
  });

  it('knows the canonical origin and founding year', () => {
    expect(SITE.baseUrl).toBe('https://night-x.com');
    expect(SITE.founded).toBe(2023);
  });
});
