import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import { legalPage } from '@/app/legal';
import { GRAPH_NODES } from '@/content/legal-graph';
import { LegalPage } from '@/ui/glass/legal/LegalPage';

vi.mock('@/ui/glass/legal/LegalGraph', () => {
  throw new Error('chunk failed to load');
});

describe('LegalPage when the graph chunk fails to load', () => {
  it('keeps the policy and the list on screen', async () => {
    const data = await legalPage('privacy', 'en', '/privacy', { stage: 'preview' });
    const { container } = render(<LegalPage data={data} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(data.head.title);
    for (const id of en.legal.privacy.order) expect(container.querySelector(`section#${id}`), id).not.toBeNull();
    expect(container.querySelectorAll('ul.legal-graph-list > li')).toHaveLength(GRAPH_NODES.filter((n) => n.kind !== 'data').length);
    expect(container.querySelector('svg.legal-graph')).toBeNull();
  });
});
