import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Catalog } from '@/ui/glass/home/Catalog';
import type { CatalogCopy, StageLabels } from '@/ui/glass/home/types';

const STAGES: StageLabels = { live: 'Live', beta: 'Beta', building: 'Building', planned: 'Planned' };
const COPY: CatalogCopy = {
  title: 'Catalog',
  lede: 'Everything we run.',
  tabs: [
    { key: 'apps', label: 'Apps', items: [{ slug: 'a', name: 'A', line: 'First', stage: 'live' }] },
    {
      key: 'browsers',
      label: 'Browsers',
      items: [
        { slug: 'b', name: 'B', line: 'Second', stage: 'beta' },
        { slug: 'c', name: 'C', line: 'Third', stage: 'planned' },
      ],
    },
  ],
};

describe('Catalog', () => {
  it('hands a tab switch the rows themselves so they can stagger in one by one', async () => {
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
    const onSelect = vi.fn();
    const Stub = createRoutesStub([{ path: '/', Component: () => <Catalog copy={COPY} stages={STAGES} onSelect={onSelect} /> }]);
    render(<Stub initialEntries={['/']} />);
    fireEvent.click(await screen.findByRole('tab', { name: /Browsers/ }));
    await vi.waitFor(() => expect(onSelect).toHaveBeenCalled());
    const target = onSelect.mock.calls[0][0] as HTMLElement;
    expect(Array.from(target.children, (child) => child.tagName)).toEqual(['LI', 'LI']);
  });
});
