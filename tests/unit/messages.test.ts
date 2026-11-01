import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import ja from '../../messages/ja.json';
import { loadMessages, mergeMessages } from '@/i18n/messages';

describe('mergeMessages', () => {
  it('returns base values where the partial has no key', () => {
    const merged = mergeMessages({ nav: { projects: 'Projects', home: 'Home' } }, { nav: { projects: 'Proyectos' } });
    expect(merged).toEqual({ nav: { projects: 'Proyectos', home: 'Home' } });
  });

  it('does not mutate either input', () => {
    const base = { a: { b: 'x' } };
    const partial = { a: { b: 'y' } };
    mergeMessages(base, partial);
    expect(base).toEqual({ a: { b: 'x' } });
    expect(partial).toEqual({ a: { b: 'y' } });
  });

  it('ignores a partial value whose type differs from the base', () => {
    const merged = mergeMessages({ nav: { projects: 'Projects' } }, { nav: 'broken' } as never);
    expect(merged).toEqual({ nav: { projects: 'Projects' } });
  });

  it('keeps a base array when the partial lacks the key', () => {
    const merged = mergeMessages({ space: { features: ['Cloaking', 'Accounts'], line: 'A proxy.' } }, { space: { line: 'Un proxy.' } });
    expect(merged).toEqual({ space: { features: ['Cloaking', 'Accounts'], line: 'Un proxy.' } });
  });

  it('takes a translated array when both sides are arrays, as a copy', () => {
    const partial = { space: { features: ['Camuflaje', 'Cuentas'] } };
    const merged = mergeMessages({ space: { features: ['Cloaking', 'Accounts'] } }, partial);
    expect(merged.space.features).toEqual(['Camuflaje', 'Cuentas']);
    expect(merged.space.features).not.toBe(partial.space.features);
  });

  it('ignores a partial whose shape differs from the base leaf in either direction', () => {
    expect(mergeMessages({ space: { features: ['Cloaking'] } }, { space: { features: 'oops' } } as never)).toEqual({ space: { features: ['Cloaking'] } });
    expect(mergeMessages({ space: { line: 'A proxy.' } }, { space: { line: ['nope'] } } as never)).toEqual({ space: { line: 'A proxy.' } });
    expect(mergeMessages({ space: { features: ['Cloaking'] } }, { space: { features: ['ok', 7] } } as never)).toEqual({ space: { features: ['Cloaking'] } });
  });
});

describe('loadMessages', () => {
  it('returns English unchanged for en', async () => {
    const en = await loadMessages('en');
    expect(en.nav.projects).toBe('Projects');
  });

  it('reads a locale file over English', async () => {
    const loaded = await loadMessages('ja');
    expect(loaded.nav.projects).toBe(ja.nav.projects);
  });

  it('has no locale key that English lacks', () => {
    const paths = (node: unknown, prefix = ''): string[] =>
      typeof node === 'object' && node !== null && !Array.isArray(node) ? Object.entries(node).flatMap(([key, value]) => paths(value, prefix ? `${prefix}.${key}` : key)) : [prefix];
    const known = new Set(paths(en));
    for (const [locale, file] of Object.entries({ es, fr, ja })) expect(paths(file).filter((path) => !known.has(path)), locale).toEqual([]);
  });
});
