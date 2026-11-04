import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import jaMessages from '../../messages/ja.json';
import { legalPage, readSections } from '@/app/legal';
import { localeOf } from '@/app/locale';
import { LEGAL_FACTS, type LegalFacts } from '@/content/legal-facts';
import { GRAPH_NODES } from '@/content/legal-graph';
import { LEGAL_UPDATED } from '@/content/legal-pages';

const RESOLVED: LegalFacts = {
  governingState: { status: 'resolved', value: 'Delaware' },
  ticketChannel: { status: 'resolved', value: 'the ticket channel' },
  responder: { status: 'resolved', value: 'the owner' },
  captchaFields: { status: 'resolved', value: 'the page address' },
  noOtherDestinationLogs: { status: 'resolved', value: true },
  appLogs: { status: 'resolved', value: 'thirty days' },
  mullvadLive: { status: 'resolved', value: false },
};

const longDate = (locale: string, iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));

describe('legalPage', () => {
  it('answers 404 while held, in every locale', async () => {
    for (const locale of ['en', 'es', 'ja'] as const) await expect(legalPage('privacy', locale, '/privacy', { stage: 'held' })).rejects.toMatchObject({ status: 404 });
  });

  it('previews noindex with open facts shown as markers', async () => {
    const data = await legalPage('terms', 'en', '/terms', { stage: 'preview', facts: LEGAL_FACTS });
    expect(data.seo.index).toBe(false);
    expect(data.sections.map((s) => s.id)).toEqual(en.legal.terms.order);
    expect(data.sections.flatMap((s) => s.body).join('\n')).toContain('⟦open: governingState⟧');
  });

  it('goes live indexable with the notice only outside English', async () => {
    expect((await legalPage('requests', 'en', '/requests', { stage: 'live', facts: RESOLVED })).head.notice).toBeNull();
    const ja = await legalPage('requests', 'ja', '/requests', { stage: 'live', facts: RESOLVED });
    expect(ja.seo).toMatchObject({ index: true, canonical: 'https://night-x.com/ja/requests' });
    expect(ja.head.notice).toBe(jaMessages.legal.notice);
  });

  it('fills resolved facts into the body and dates the page in the reader locale', async () => {
    const data = await legalPage('terms', 'ja', '/terms', { stage: 'live', facts: RESOLVED });
    const text = data.sections.flatMap((s) => s.body).join('\n');
    expect(text).toContain('Delaware');
    expect(text).not.toContain('⟦open');
    expect(data.head.updated).toContain(longDate('ja', LEGAL_UPDATED.terms));
  });

  it('names the section index apart from the page title, in English at every locale', async () => {
    for (const locale of ['en', 'es', 'ja'] as const) {
      const data = await legalPage('terms', locale, '/terms', { stage: 'preview' });
      expect(data.head.contents, locale).toBe(en.legal.contents);
      expect(data.head.contents, locale).not.toBe(data.head.title);
    }
  });

  it('keeps every Privacy section the spec lists, in order', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    expect(data.sections.map((s) => s.id)).toEqual(['short', 'website', 'people', 'bots', 'account', 'libraries', 'wireguard', 'recipients', 'advertising', 'rights', 'children', 'retention']);
    expect(en.legal.terms.order).toContain('acceptable-use');
  });

  it('carries the data map copy on Privacy only, labelled in the reader locale', async () => {
    const privacy = await legalPage('privacy', 'ja', '/privacy', { stage: 'preview' });
    expect(privacy.graph).not.toBeNull();
    expect(privacy.graph?.heading).toBe(jaMessages.legal.graph.heading);
    expect(privacy.graph?.collects).toBe(jaMessages.legal.graph.collects);
    expect(Object.keys(privacy.graph?.labels ?? {}).sort()).toEqual(GRAPH_NODES.map((n) => n.id).sort());
    expect(privacy.graph?.labels.wireguard).toBe(jaMessages.legal.graph.nodes.wireguard);
    for (const kind of ['terms', 'requests'] as const) expect((await legalPage(kind, 'en', `/${kind}`, { stage: 'preview' })).graph, kind).toBeNull();
  });
});

describe('legal copy fact tokens', () => {
  const BOOLEAN_FACTS = ['noOtherDestinationLogs', 'mullvadLive'];
  const strings = (node: unknown): string[] => {
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(strings);
    if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
    return [];
  };

  it('names only known string facts inline', () => {
    const keys = strings(en.legal).flatMap((text) => [...text.matchAll(/\{fact:(\w+)\}/g)].map((match) => match[1]));
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(Object.keys(LEGAL_FACTS), key).toContain(key);
      expect(BOOLEAN_FACTS, key).not.toContain(key);
    }
  });
});

describe('readSections', () => {
  it('rejects an order id with no usable section, naming it', () => {
    expect(() => readSections(['a'], () => undefined)).toThrow('missing legal section: a');
    expect(() => readSections(['a'], () => ({ title: 'T', body: [] }))).toThrow('missing legal section: a');
  });

  it('rejects an empty paragraph', () => {
    expect(() => readSections(['a'], () => ({ title: 'T', body: [''] }))).toThrow('missing legal section: a');
  });

  it('keeps the order it is given', () => {
    const raw: Record<string, unknown> = { b: { title: 'B', body: ['two'] }, a: { title: 'A', body: ['one'] } };
    expect(readSections(['a', 'b'], (id) => raw[id])).toEqual([
      { id: 'a', title: 'A', body: ['one'] },
      { id: 'b', title: 'B', body: ['two'] },
    ]);
  });
});

describe('localeOf', () => {
  it('answers 404 for an unknown locale', () => expect(() => localeOf('xx')).toThrowError(expect.objectContaining({ status: 404 })));
});
