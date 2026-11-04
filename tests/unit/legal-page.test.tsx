import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LegalPageData } from '@/content/legal-pages';
import { headModel } from '@/lib/seo/head';
import { LegalPage } from '@/ui/glass/legal/LegalPage';

const DATA: LegalPageData = {
  kind: 'privacy',
  stage: 'preview',
  seo: { ...headModel({ locale: 'en', path: '/privacy', title: 'Privacy', description: 'How data moves.' }), index: false },
  head: { kicker: 'Legal', title: 'Privacy policy', lede: 'How data moves.', updated: 'Last updated November 3, 2026', contents: 'On this page', notice: null },
  sections: [
    { id: 'short', title: 'In short', body: ['One.'] },
    { id: 'website', title: 'The website', body: ['Two.', 'Three.'] },
    { id: 'retention', title: 'Retention', body: ['Four.'] },
  ],
  graph: null,
};

describe('LegalPage', () => {
  it('renders one h1 with the updated line under it', () => {
    render(<LegalPage data={DATA} />);
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Privacy policy']);
    expect(screen.getByText('Last updated November 3, 2026')).toBeInTheDocument();
    expect(screen.getByText('How data moves.')).toBeInTheDocument();
  });

  it('indexes every section with an in-page link, in order', () => {
    render(<LegalPage data={DATA} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAccessibleName('On this page');
    expect(nav).not.toHaveAccessibleName(DATA.head.title);
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#short', '#website', '#retention']);
  });

  it('gives each section an h2 that labels it', () => {
    const { container } = render(<LegalPage data={DATA} />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['In short', 'The website', 'Retention']);
    for (const { id, title } of DATA.sections) {
      const section = container.querySelector(`section#${id}`);
      expect(section).not.toBeNull();
      expect(section).toHaveAccessibleName(title);
    }
    expect(container.querySelectorAll('section#website p')).toHaveLength(2);
  });

  it('shows the English-governs notice only when there is one', () => {
    const { unmount } = render(<LegalPage data={DATA} />);
    expect(screen.queryByText('English governs.')).toBeNull();
    unmount();
    render(<LegalPage data={{ ...DATA, head: { ...DATA.head, notice: 'English governs.' } }} />);
    expect(screen.getByText('English governs.')).toBeInTheDocument();
  });
});
