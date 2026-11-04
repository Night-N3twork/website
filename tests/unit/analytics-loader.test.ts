import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { analyticsTags } from '@/lib/analytics';
import { loadAnalytics, readPageNonce, stopAnalytics } from '@/lib/analytics-loader';

const TAGS = analyticsTags('G-ABC123')!;

beforeEach(() => {
  const page = document.createElement('script');
  page.setAttribute('nonce', 'n1');
  page.setAttribute('data-page', '');
  document.head.append(page);
});

afterEach(() => {
  for (const s of document.querySelectorAll('script[data-page], script[data-night-analytics]')) s.remove();
  delete (window as never as Record<string, unknown>)['ga-disable-G-ABC123'];
});

describe('readPageNonce', () => {
  it('reads the nonce of the first nonced script', () => {
    expect(readPageNonce()).toBe('n1');
  });

  it('is empty when no script carries a nonce', () => {
    for (const s of document.querySelectorAll('script[data-page]')) s.remove();
    expect(readPageNonce()).toBe('');
  });
});

describe('loadAnalytics', () => {
  it('adds the loader and the setup script with the page nonce, once', () => {
    loadAnalytics(TAGS);
    loadAnalytics(TAGS);
    const added = [...document.querySelectorAll('script[data-night-analytics]')];
    expect(added).toHaveLength(2);
    expect(added[0].getAttribute('src')).toBe('https://www.googletagmanager.com/gtag/js?id=G-ABC123');
    expect((added[0] as HTMLScriptElement).async).toBe(true);
    expect(added[1].textContent).toBe(TAGS.setup);
    for (const s of added) expect((s as HTMLScriptElement).nonce || s.getAttribute('nonce')).toBe('n1');
  });

  it('lifts an earlier stop so measurement resumes', () => {
    stopAnalytics(TAGS);
    loadAnalytics(TAGS);
    expect((window as never as Record<string, unknown>)['ga-disable-G-ABC123']).toBeUndefined();
  });
});

describe('stopAnalytics', () => {
  it('stops measurement', () => {
    stopAnalytics(TAGS);
    expect((window as never)['ga-disable-G-ABC123']).toBe(true);
  });

  it('expires the analytics cookies and keeps the rest', () => {
    document.cookie = '_ga=GA1.1.1; path=/';
    document.cookie = '_ga_ABC123=GS1.1.1; path=/';
    document.cookie = 'keep=1; path=/';
    stopAnalytics(TAGS);
    expect(document.cookie).toBe('keep=1');
    document.cookie = 'keep=; Max-Age=0; path=/';
  });
});
