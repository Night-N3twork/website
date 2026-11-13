import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocsLabels } from '@/lib/docs/page';
import type { NavNode } from '@/lib/docs/sidebar';
import { DocsNav } from '@/ui/glass/docs/DocsNav';
import { DocsPager } from '@/ui/glass/docs/DocsPager';
import { DocsLabelsContext } from '@/ui/glass/docs/labels';
import { MDX_COMPONENTS } from '@/ui/glass/docs/mdx';

vi.mock('@/motion/core', () => ({ glide: vi.fn() }));

const LABELS: DocsLabels = { docs: 'Docs', browse: 'Browse the docs', contents: 'On this page', pager: 'Previous and next page', previous: 'Previous', next: 'Next', copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed', lang: 'en', notice: null };

const NAV: NavNode[] = [
  {
    kind: 'group',
    label: 'Libraries',
    collapsed: false,
    items: [
      { kind: 'group', label: 'Dusk', collapsed: true, items: [{ kind: 'link', label: 'Overview', slug: 'dusk' }, { kind: 'link', label: 'Installation', slug: 'dusk/installation' }] },
      { kind: 'group', label: 'Nova', collapsed: true, items: [{ kind: 'link', label: 'Overview', slug: 'nova' }] },
    ],
  },
];

function mount(node: ReactNode, path = '/docs') {
  const Stub = createRoutesStub([{ path: '*', Component: () => <DocsLabelsContext value={LABELS}>{node}</DocsLabelsContext> }]);
  return render(<Stub initialEntries={[path]} />);
}

const A = MDX_COMPONENTS.a as (props: { href: string; children: ReactNode }) => ReactNode;
const Pre = MDX_COMPONENTS.pre as (props: { children: ReactNode }) => ReactNode;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DocsNav', () => {
  it('marks the current page and opens only the folds that hold it', () => {
    mount(<DocsNav nodes={NAV} current="dusk/installation" label={LABELS.browse} />);
    expect(screen.getByRole('link', { name: 'Installation' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Dusk').closest('details')).toHaveAttribute('open');
    expect(screen.getByText('Nova').closest('details')).not.toHaveAttribute('open');
  });

  it('links pages under /docs in the reader language', () => {
    mount(<DocsNav nodes={NAV} current="" label={LABELS.browse} />, '/ja/docs');
    expect(screen.getByRole('link', { name: 'Installation', hidden: true })).toHaveAttribute('href', '/ja/docs/dusk/installation');
  });

  it('groups sections without adding landmarks and keeps the reader language on its label', () => {
    mount(<DocsNav nodes={NAV} current="" label="ドキュメントを見る" />, '/ja/docs');
    const nav = screen.getByRole('navigation', { name: 'ドキュメントを見る' });
    expect(nav).not.toHaveAttribute('lang');
    expect(screen.getByRole('group', { name: 'Libraries' })).toHaveAttribute('lang', 'en');
    expect(screen.queryAllByRole('region')).toEqual([]);
  });

  it('toggles the phone index', () => {
    mount(<DocsNav nodes={NAV} current="" label={LABELS.browse} />);
    const toggle = screen.getByRole('button', { name: LABELS.browse });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('MDX components', () => {
  it('routes doc links through the site and opens external ones in a new tab', () => {
    mount(
      <p>
        <A href="/docs/dusk">dusk</A> <A href="https://night-x.com">site</A> <A href="#setup">here</A> <A href="mailto:team@night-x.com">mail</A>
      </p>,
      '/fr/docs',
    );
    expect(screen.getByRole('link', { name: 'dusk' })).toHaveAttribute('href', '/fr/docs/dusk');
    expect(screen.getByRole('link', { name: 'site' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'here' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'mail' })).not.toHaveAttribute('target');
  });

  it('labels code by language and copies its text', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    mount(
      <Pre>
        <code className="hljs language-ts">const a = 1;</code>
      </Pre>,
    );
    expect(screen.getByText('ts')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })));
    expect(writeText).toHaveBeenCalledWith('const a = 1;');
    expect(screen.getByRole('button', { name: 'Copied' })).toHaveAttribute('data-state', 'copied');
  });

  it('speaks the copy label in the reader language inside English prose', () => {
    render(
      <DocsLabelsContext value={{ ...LABELS, lang: 'ja' }}>
        <Pre>
          <code>plain</code>
        </Pre>
      </DocsLabelsContext>,
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('lang', 'ja');
  });

  it('says so when the clipboard refuses', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) } });
    mount(
      <Pre>
        <code>plain</code>
      </Pre>,
    );
    expect(screen.getByText('text')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })));
    expect(screen.getByRole('button', { name: 'Copy failed' })).toHaveAttribute('data-state', 'failed');
  });
});

describe('DocsPager', () => {
  it('shows only the sides that exist', () => {
    mount(<DocsPager pager={{ previous: null, next: { slug: 'dusk', title: 'Dusk' } }} labels={LABELS} />);
    expect(screen.getByRole('link', { name: /Next\s*Dusk/ })).toHaveAttribute('href', '/docs/dusk');
    expect(screen.queryByText('Previous')).toBeNull();
  });

  it('renders nothing for an unlisted page', () => {
    const { container } = mount(<DocsPager pager={{ previous: null, next: null }} labels={LABELS} />);
    expect(container.querySelector('.docs-pager')).toBeNull();
  });
});
