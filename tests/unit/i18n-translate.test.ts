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
  const values = (node: unknown): string[] => {
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(values);
    if (node && typeof node === 'object') return Object.values(node).flatMap(values);
    return [];
  };

  it('no placeholder copy ships', () => {
    expect(values(en).filter((value) => value.includes('[temp]'))).toEqual([]);
  });
});
