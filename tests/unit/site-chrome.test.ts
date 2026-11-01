import { describe, expect, it } from 'vitest';
import es from '../../messages/es.json';
import { siteChrome } from '@/app/chrome';
import { languageLinks } from '@/i18n/languages';

describe('siteChrome', () => {
  it('lists the four destinations with localized paths and labels', async () => {
    const chrome = await siteChrome('es', 2026);
    expect(chrome.nav.map((n) => [n.key, n.path])).toEqual([
      ['projects', '/projects'],
      ['contributors', '/contributors'],
      ['supporters', '/supporters'],
      ['community', '/community'],
    ]);
    expect(chrome.nav[0].label).toBe(es.nav.projects);
  });

  it('links each language to the same page and marks the current one', () => {
    expect(languageLinks('es', '/projects').map((l) => [l.locale, l.href, l.current])).toEqual([
      ['en', '/projects', false],
      ['es', '/es/projects', true],
      ['fr', '/fr/projects', false],
      ['ja', '/ja/projects', false],
    ]);
  });

  it('fills the footer and the external links', async () => {
    const chrome = await siteChrome('en', 2026);
    expect(chrome.footer.copyright).toContain('2026');
    expect(chrome.socials.map((s) => s.name)).toEqual(['discord', 'github', 'gitlab', 'youtube', 'instagram']);
    expect(chrome.support.map((s) => s.label)).toEqual(['Patreon', 'Cash App']);
    expect(chrome.labels.skip).toBe('Skip to content');
  });
});
