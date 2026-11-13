import { describe, expect, it } from 'vitest';
import es from '../../messages/es.json';
import { siteChrome } from '@/app/chrome';
import { languageLinks } from '@/i18n/languages';

describe('siteChrome', () => {
  it('lists the five destinations with localized paths and labels', async () => {
    const chrome = await siteChrome('es', 2026, { stage: 'held', analytics: false });
    expect(chrome.nav.map((n) => [n.key, n.path])).toEqual([
      ['projects', '/projects'],
      ['docs', '/docs'],
      ['contributors', '/contributors'],
      ['supporters', '/supporters'],
      ['community', '/community'],
    ]);
    expect(chrome.nav[0].label).toBe(es.nav.projects);
    expect(chrome.nav[1].label).toBe(es.nav.docs);
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
    const chrome = await siteChrome('en', 2026, { stage: 'held', analytics: false });
    expect(chrome.footer.copyright).toContain('2026');
    expect(chrome.socials.map((s) => s.name)).toEqual(['discord', 'github', 'gitlab', 'youtube', 'instagram']);
    expect(chrome.support.map((s) => s.label)).toEqual(['Patreon', 'Cash App']);
    expect(chrome.labels.skip).toBe('Skip to content');
  });

  it('adds no Legal column while held', async () => expect((await siteChrome('en', 2026, { stage: 'held' })).legal).toBeNull());

  it('lists Privacy, Terms and Requests with localized paths and labels', async () => {
    const { legal } = await siteChrome('es', 2026, { stage: 'live', analytics: true });
    expect(legal?.title).toBe(es.footer.legal);
    expect(legal?.links.map((l) => [l.key, l.path])).toEqual([
      ['privacy', '/privacy'],
      ['terms', '/terms'],
      ['requests', '/requests'],
    ]);
    expect(legal?.links[0].label).toBe(es.footer.privacy);
    expect(legal?.cookieSettings).toBe(es.footer.cookieSettings);
  });

  it('offers Cookie settings only when analytics exists', async () => {
    expect((await siteChrome('en', 2026, { stage: 'live', analytics: false })).legal?.cookieSettings).toBeNull();
  });

  it('shows the Legal column in preview as well as live', async () => {
    expect((await siteChrome('en', 2026, { stage: 'preview', analytics: false })).legal?.links).toHaveLength(3);
  });
});
