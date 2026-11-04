import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type AnalyticsTags, analyticsTags } from '@/lib/analytics';
import { loadAnalytics, stopAnalytics } from '@/lib/analytics-loader';
import { CONSENT_EVENT, CONSENT_KEY } from '@/lib/consent';
import { ConsentBar } from '@/ui/glass/chrome/ConsentBar';

vi.mock('@/lib/analytics-loader', () => ({ loadAnalytics: vi.fn(), stopAnalytics: vi.fn() }));

const TAGS = analyticsTags('G-ABC123')!;
const LABELS = { text: 'Night Network measures visits.', accept: 'Accept', decline: 'Decline', privacy: 'Privacy', region: 'Privacy choices' };

function bar(tags: AnalyticsTags, path = '/') {
  return (
    <MemoryRouter initialEntries={[path]}>
      <ConsentBar tags={tags} labels={LABELS} />
    </MemoryRouter>
  );
}

function mount(path = '/') {
  return render(bar(TAGS, path));
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('ConsentBar', () => {
  it('asks with two equal buttons when nothing is stored, without loading analytics', async () => {
    mount();
    const region = await screen.findByRole('region', { name: LABELS.region });
    expect(region).toHaveTextContent(LABELS.text);
    expect(region).not.toHaveAccessibleName(LABELS.privacy);
    const accept = screen.getByRole('button', { name: 'Accept' });
    const decline = screen.getByRole('button', { name: 'Decline' });
    expect(accept.className).toBe(decline.className);
    expect(loadAnalytics).not.toHaveBeenCalled();
  });

  it('links to the privacy page', async () => {
    mount();
    expect(await screen.findByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('links to the localized privacy page', async () => {
    mount('/es/projects');
    expect(await screen.findByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/es/privacy');
  });

  it('Accept stores granted, loads analytics and hides the bar', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe('granted');
    expect(loadAnalytics).toHaveBeenCalledWith(TAGS);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Decline stores denied and never loads analytics', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
    expect(loadAnalytics).not.toHaveBeenCalled();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('a stored grant loads analytics on mount and shows no bar', async () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    mount();
    await vi.waitFor(() => expect(loadAnalytics).toHaveBeenCalledWith(TAGS));
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('a stored denial neither loads analytics nor shows the bar', async () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    mount();
    expect(loadAnalytics).not.toHaveBeenCalled();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('asks again over an unknown stored value and loads nothing until Accept', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CONSENT_KEY, 'maybe');
    mount();
    const accept = await screen.findByRole('button', { name: 'Accept' });
    expect(loadAnalytics).not.toHaveBeenCalled();
    await user.click(accept);
    expect(loadAnalytics).toHaveBeenCalledTimes(1);
    expect(loadAnalytics).toHaveBeenCalledWith(TAGS);
  });

  it('keeps measurement off after a Decline that could not be stored, across a loader revalidation', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CONSENT_KEY, 'granted');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { rerender } = mount();
    expect(loadAnalytics).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event(CONSENT_EVENT));
    await user.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(stopAnalytics).toHaveBeenCalledWith(TAGS);
    rerender(bar({ ...TAGS }));
    expect(loadAnalytics).toHaveBeenCalledTimes(1);
  });

  it('a Decline after a grant, reopened from the footer event, stops measurement', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CONSENT_KEY, 'granted');
    mount();
    window.dispatchEvent(new Event(CONSENT_EVENT));
    await user.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(stopAnalytics).toHaveBeenCalledWith(TAGS);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('denied');
  });

  it.each(['Accept', 'Decline'])('returns focus to the control that reopened the bar after %s', async (choice) => {
    const user = userEvent.setup();
    localStorage.setItem(CONSENT_KEY, 'granted');
    render(
      <>
        <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT))}>
          Cookie settings
        </button>
        {bar(TAGS)}
      </>,
    );
    const opener = screen.getByRole('button', { name: 'Cookie settings' });
    await user.click(opener);
    await user.click(await screen.findByRole('button', { name: choice }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('leaves focus alone when the first-visit bar closes', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(document.body).toHaveFocus();
  });

  it('does not steal focus when the opener has left the page', async () => {
    const user = userEvent.setup();
    localStorage.setItem(CONSENT_KEY, 'granted');
    mount();
    const opener = document.body.appendChild(document.createElement('button'));
    opener.focus();
    window.dispatchEvent(new Event(CONSENT_EVENT));
    opener.remove();
    await user.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(document.body).toHaveFocus();
  });

  it('still asks and still loads on Accept when storage throws', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount();
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(loadAnalytics).toHaveBeenCalledWith(TAGS);
    expect(screen.queryByRole('region')).toBeNull();
  });
});
