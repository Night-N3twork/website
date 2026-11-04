import { describe, expect, it } from 'vitest';
import { translator } from '@/i18n/translate';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';

describe('translator', () => {
  it('reads a key inside a namespace', async () => {
    const t = await translator('en', 'home.hero');
    expect(t('cta')).toBe(en.home.hero.cta);
  });

  it('reads a full path without a namespace', async () => {
    const t = await translator('en');
    expect(t('site.name')).toBe(en.site.name);
  });

  it('reads a translated locale', async () => {
    const t = await translator('es', 'nav');
    expect(t('projects')).toBe(es.nav.projects);
  });

  it('fills ICU arguments', async () => {
    const t = await translator('en', 'projects');
    expect(t('title', { count: 7 })).toBe(en.projects.title.replace('{count}', '7'));
  });

  it('prints a bare number argument as is', async () => {
    const t = await translator('fr', 'projects');
    expect(t('title', { count: 1000 })).toBe(fr.projects.title.replace('{count}', '1000'));
  });

  it('returns lists and maps untouched through raw', async () => {
    const t = await translator('en', 'home.flagship');
    expect(t.raw('notes')).toEqual(en.home.flagship.notes);
  });

  it('throws on a missing key outside production', async () => {
    const t = await translator('en', 'home.hero');
    expect(() => t('nope')).toThrow('home.hero.nope');
  });

  it('throws when a key points at a list instead of a string', async () => {
    const t = await translator('en', 'home.flagship');
    expect(() => t('notes')).toThrow('home.flagship.notes');
  });
});

describe('english copy', () => {
  const leaves = (node: unknown, path = ''): [string, string][] => {
    if (typeof node === 'string') return [[path, node]];
    if (Array.isArray(node)) return node.flatMap((item, index) => leaves(item, `${path}.${index}`));
    if (node && typeof node === 'object') return Object.entries(node).flatMap(([key, value]) => leaves(value, path ? `${path}.${key}` : key));
    return [];
  };

  const placeholders = (tree: unknown) => leaves(tree).filter(([, value]) => value.includes('[temp]')).map(([path]) => path);

  it('ships no placeholder copy anywhere', () => {
    expect(placeholders(en)).toEqual([]);
  });

  it('flags a placeholder at any key, including the consent, legal and conduct copy', () => {
    expect(placeholders({ consent: { text: '[temp]', accept: 'Accept' }, legal: { terms: { lede: '[temp]' } }, home: { hero: '[temp]' }, community: { conductText: '[temp]', lede: 'Fine' } })).toEqual(['consent.text', 'legal.terms.lede', 'home.hero', 'community.conductText']);
  });
});
