import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { siteChrome } from '@/app/chrome';
import type { LegalStage } from '@/content/legal-facts';
import { languageLinks } from '@/i18n/languages';
import { CONSENT_EVENT } from '@/lib/consent';
import { Footer } from '@/ui/glass/chrome/Footer';

async function mount(options: { stage: LegalStage; analytics: boolean }) {
  const chrome = await siteChrome('en', 2026, options);
  return render(
    <MemoryRouter>
      <Footer chrome={chrome} path="/" languages={languageLinks('en', '/')} />
    </MemoryRouter>,
  );
}

const columnTitles = (): (string | null)[] => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('Footer legal column', () => {
  it('shows four columns with Legal last when the pages are public', async () => {
    await mount({ stage: 'live', analytics: true });
    expect(columnTitles()).toEqual(['Explore', 'Connect', 'Support', 'Legal']);
  });

  it('points the Legal links at the legal routes', async () => {
    await mount({ stage: 'live', analytics: true });
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Requests' })).toHaveAttribute('href', '/requests');
  });

  it('shows three columns and no legal controls while held', async () => {
    await mount({ stage: 'held', analytics: true });
    expect(columnTitles()).toEqual(['Explore', 'Connect', 'Support']);
    expect(screen.queryByRole('link', { name: 'Privacy' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cookie settings' })).toBeNull();
  });

  it('leaves out Cookie settings when there is no analytics', async () => {
    await mount({ stage: 'live', analytics: false });
    expect(columnTitles()).toContain('Legal');
    expect(screen.queryByRole('button', { name: 'Cookie settings' })).toBeNull();
  });

  it('renders Cookie settings as a plain button styled like the links', async () => {
    await mount({ stage: 'live', analytics: true });
    const button = screen.getByRole('button', { name: 'Cookie settings' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('foot-link');
  });

  it('opens the consent bar by dispatching the consent event on window', async () => {
    await mount({ stage: 'live', analytics: true });
    const heard = vi.fn();
    window.addEventListener(CONSENT_EVENT, heard);
    await userEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
    window.removeEventListener(CONSENT_EVENT, heard);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
