import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import ja from '../../messages/ja.json';
import { conductCopy } from '@/app/conduct';
import type { LegalStage } from '@/content/legal-facts';
import type { Locale } from '@/i18n/locales';
import { translator } from '@/i18n/translate';
import { Community, type CommunityCopy } from '@/ui/glass/community/Community';

const COPY: CommunityCopy = {
  kicker: 'Community',
  title: 'Where to find Night',
  lede: 'The Discord is our main community.',
  links: [{ href: 'https://discord.gg/night', label: 'Join the Discord' }],
  contribute: 'Contribute',
  contributeLede: 'Anyone can open an issue.',
  conduct: { title: 'Code of conduct', text: 'Be decent to each other.', href: '/terms#acceptable-use', linkLabel: 'Acceptable use' },
  partnersTitle: 'Partners and suborganizations',
  partnersLede: 'Who we build with.',
  partners: [],
};

const PENDING: CommunityCopy = { ...COPY, conduct: { ...COPY.conduct, text: 'Still being written.', href: null } };

function mount(copy: CommunityCopy, path = '/community') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Community copy={copy} />
    </MemoryRouter>,
  );
}

function note(title: string): HTMLElement {
  const article = screen.getByRole('heading', { name: title }).closest('article');
  if (!article) throw new Error(`no note: ${title}`);
  return article;
}

describe('Community conduct note', () => {
  it('links to the terms clause, labelled by linkLabel, without a caret', () => {
    mount(COPY);
    const conduct = note('Code of conduct');
    expect(within(conduct).getByText('Be decent to each other.')).toBeInTheDocument();
    expect(within(conduct).getByRole('link', { name: 'Acceptable use' })).toHaveAttribute('href', '/terms#acceptable-use');
    expect(conduct.querySelector('.note-caret')).toBeNull();
    expect(conduct).not.toHaveClass('is-pending');
  });

  it('localizes the href once under a localized route, keeping the fragment', () => {
    mount(COPY, '/es/community');
    expect(within(note('Code of conduct')).getByRole('link', { name: 'Acceptable use' })).toHaveAttribute('href', '/es/terms#acceptable-use');
  });

  it('renders the pending note unchanged when there is no href', () => {
    mount(PENDING);
    const conduct = note('Code of conduct');
    expect(within(conduct).getByText('Still being written.')).toBeInTheDocument();
    expect(within(conduct).queryByRole('link')).toBeNull();
    expect(conduct.querySelector('.note-caret')).not.toBeNull();
    expect(conduct).toHaveClass('is-pending');
  });

  it('leaves the contribute note plain in both states', () => {
    for (const copy of [COPY, PENDING]) {
      const { unmount } = mount(copy);
      const contribute = note('Contribute');
      expect(within(contribute).getByText('Anyone can open an issue.')).toBeInTheDocument();
      expect(within(contribute).queryByRole('link')).toBeNull();
      expect(contribute.querySelector('.note-caret')).toBeNull();
      expect(contribute).not.toHaveClass('is-pending');
      unmount();
    }
  });
});

describe('conductCopy', () => {
  const copyFor = async (locale: Locale, stage: LegalStage) => conductCopy(await translator(locale), stage);

  it('keeps the owner pending text with no link while the legal stage is held', async () => {
    expect(await copyFor('en', 'held')).toEqual({ title: en.community.conduct, text: en.community.conductPending, href: null, linkLabel: en.community.conductLink });
  });

  it('links to the acceptable-use clause of the terms in preview and live', async () => {
    for (const stage of ['preview', 'live'] as const) {
      expect(await copyFor('en', stage)).toEqual({ title: en.community.conduct, text: en.community.conductText, href: '/terms#acceptable-use', linkLabel: en.community.conductLink });
    }
  });

  it('keeps the terms path unlocalized, translates the title and link label, and falls back to English for the text', async () => {
    const locales = [
      ['es', es],
      ['fr', fr],
      ['ja', ja],
    ] as const;
    for (const [locale, messages] of locales) {
      expect(await copyFor(locale, 'live')).toEqual({ title: messages.community.conduct, text: en.community.conductText, href: '/terms#acceptable-use', linkLabel: messages.community.conductLink });
    }
  });
});
