import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import ja from '../../messages/ja.json';
import { legalPage } from '@/app/legal';
import { GRAPH_NODES } from '@/content/legal-graph';
import { LegalGraph } from '@/ui/glass/legal/LegalGraph';
import { LegalPage } from '@/ui/glass/legal/LegalPage';

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');
const listed = GRAPH_NODES.filter((n) => n.kind !== 'data');

describe('Privacy data map without JavaScript', () => {
  it('server-renders every section and one list item per non-data node, each linking to its clause', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    const doc = parse(renderToString(<LegalPage data={data} />));
    for (const id of en.legal.privacy.order) expect(doc.getElementById(id), id).not.toBeNull();
    const items = [...doc.querySelectorAll('ul.legal-graph-list > li')];
    expect(items).toHaveLength(listed.length);
    listed.forEach((node, index) => expect(items[index].querySelector(`a[href="#${node.clause}"]`), node.id).not.toBeNull());
    const bots = items[listed.findIndex((n) => n.id === 'bots')];
    expect(bots.querySelector('.legal-graph-line')?.textContent).toContain(en.legal.graph.nodes.discord);
    expect(doc.querySelector('svg')).toBeNull();
  });

  it('heads the list and reserves the graph box above the first clause', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    const doc = parse(renderToString(<LegalPage data={data} />));
    const map = doc.querySelector('.legal-map');
    expect(map?.querySelector('.legal-graph-stage')).not.toBeNull();
    expect(map?.textContent).toContain(en.legal.graph.listHeading);
    expect(map?.compareDocumentPosition(doc.getElementById('short') as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('joins names with the reader locale separator', async () => {
    const data = await legalPage('privacy', 'ja', '/ja/privacy', { stage: 'preview' });
    const doc = parse(renderToString(<LegalPage data={data} />));
    const account = doc.querySelectorAll('ul.legal-graph-list > li')[listed.findIndex((n) => n.id === 'account')];
    expect(account.querySelector('dd')?.textContent).toBe([ja.legal.graph.nodes['discord-id'], ja.legal.graph.nodes.email, ja.legal.graph.nodes['synced-data']].join('、'));
  });

  it('renders no data map on Terms or Requests', async () => {
    for (const kind of ['terms', 'requests'] as const) {
      const doc = parse(renderToString(<LegalPage data={await legalPage(kind, 'en', `/${kind}`, { stage: 'preview' })} />));
      expect(doc.querySelector('.legal-map'), kind).toBeNull();
    }
  });
});

describe('LegalGraph', () => {
  it('jumps to the clause when a node is clicked and highlights a focused node', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    if (!data.graph) throw new Error('privacy has a graph');
    const { container } = render(<LegalGraph copy={data.graph} />);
    expect(screen.getByRole('group', { name: data.graph.heading })).toBeInTheDocument();
    const bots = screen.getByRole('link', { name: data.graph.labels.bots });
    expect(bots).toHaveAttribute('href', '#bots');
    fireEvent.click(bots);
    expect(window.location.hash).toBe('#bots');
    fireEvent.focus(bots);
    expect(container.querySelector('.legal-graph')).toHaveAttribute('data-active', 'bots');
    expect(container.querySelectorAll('.legal-graph-edge.is-lit').length).toBeGreaterThan(0);
    fireEvent.blur(bots);
    expect(container.querySelector('.legal-graph')).not.toHaveAttribute('data-active');
  });

  it('scrolls back to the clause when its fragment is already in the address', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    if (!data.graph) throw new Error('privacy has a graph');
    const scroll = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { value: scroll, configurable: true, writable: true });
    try {
      window.location.hash = '#recipients';
      render(
        <>
          <LegalGraph copy={data.graph} />
          <section id="recipients" />
        </>,
      );
      fireEvent.click(screen.getByRole('link', { name: data.graph.labels.cloudflare }));
      expect(window.location.hash).toBe('#recipients');
      expect(scroll).toHaveBeenCalledTimes(1);
      expect(scroll.mock.contexts[0]).toBe(document.getElementById('recipients'));
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  it('gives every node a link named by its label', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    if (!data.graph) throw new Error('privacy has a graph');
    render(<LegalGraph copy={data.graph} />);
    for (const node of GRAPH_NODES) expect(screen.getByRole('link', { name: data.graph.labels[node.id] })).toHaveAttribute('href', `#${node.clause}`);
  });
});
