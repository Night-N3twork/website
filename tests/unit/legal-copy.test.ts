import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { GRAPH_NODES } from '@/content/legal-graph';

type Kind = 'privacy' | 'terms' | 'requests';
type Page = { order: string[]; sections: Record<string, { body: string[] }> };

const KINDS: Kind[] = ['privacy', 'terms', 'requests'];
const page = (kind: Kind): Page => en.legal[kind];
const bodyOf = (kind: Kind): string => page(kind).order.flatMap((id) => page(kind).sections[id].body).join('\n');

const leaves = (node: unknown): string[] => {
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(leaves);
  if (node && typeof node === 'object') return Object.values(node).flatMap(leaves);
  return [];
};

const released = it.skipIf(!process.env.LEGAL_RELEASE);

describe('legal copy structure', () => {
  it('has a section for every id in each order, and at least one paragraph in each', () => {
    for (const kind of KINDS) {
      expect(page(kind).order.length, kind).toBeGreaterThan(0);
      for (const id of page(kind).order) {
        const body = page(kind).sections[id]?.body ?? [];
        expect(body.length, `${kind}.${id}`).toBeGreaterThan(0);
        for (const paragraph of body) expect(paragraph.trim().length, `${kind}.${id}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the section ids the graph and the Community note rely on', () => {
    expect(en.legal.terms.order).toContain('acceptable-use');
    for (const node of GRAPH_NODES) expect(en.legal.privacy.order).toContain(node.clause);
  });
});

describe('legal copy at release', () => {
  released('leaves no placeholder under legal, consent, footer or community', () => {
    for (const [name, tree] of Object.entries({ legal: en.legal, consent: en.consent, footer: en.footer, community: en.community })) {
      expect(leaves(tree).filter((text) => text.includes('[temp]')), name).toEqual([]);
    }
  });

  released('states the age, the deadline and every third party in the Privacy text', () => {
    const text = bodyOf('privacy');
    for (const word of ['13 and over', '30 days', 'Google Analytics', 'Cloudflare', 'Mullvad', '2Captcha', 'WireGuard']) expect(text, word).toContain(word);
  });

  released('names the governing state in the Terms through its fact token', () => {
    expect(bodyOf('terms')).toContain('{fact:governingState}');
  });

  released('names the ticket channel and the responder in the Requests through their fact tokens', () => {
    const text = bodyOf('requests');
    expect(text).toContain('{fact:ticketChannel}');
    expect(text).toContain('{fact:responder}');
  });
});
