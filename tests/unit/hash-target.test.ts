import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashTarget, hashTop, splitHash } from '@/navigation/hash-target';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function clause(id: string): HTMLElement {
  const section = document.createElement('section');
  section.id = id;
  document.body.append(section);
  return section;
}

describe('splitHash', () => {
  it('separates the path from the fragment', () => {
    expect(splitHash('/terms#acceptable-use')).toEqual({ path: '/terms', hash: '#acceptable-use' });
  });

  it('returns an empty hash when there is no fragment', () => {
    expect(splitHash('/terms')).toEqual({ path: '/terms', hash: '' });
  });

  it('keeps an empty fragment marker as the hash', () => {
    expect(splitHash('/terms#')).toEqual({ path: '/terms', hash: '#' });
  });
});

describe('hashTarget', () => {
  it('finds the element the fragment names', () => {
    const section = clause('acceptable-use');
    expect(hashTarget('#acceptable-use')).toBe(section);
  });

  it('decodes an encoded fragment before looking it up', () => {
    const section = clause('café');
    expect(hashTarget('#caf%C3%A9')).toBe(section);
  });

  it('returns null for an empty, bare or unknown fragment', () => {
    clause('acceptable-use');
    expect(hashTarget('')).toBeNull();
    expect(hashTarget('#')).toBeNull();
    expect(hashTarget('#missing')).toBeNull();
  });

  it('returns null for a malformed escape instead of throwing', () => {
    expect(hashTarget('#%E0%A4%A')).toBeNull();
    expect(() => hashTarget('#%')).not.toThrow();
    expect(hashTarget('#%')).toBeNull();
  });
});

describe('hashTop', () => {
  function placed(top: number, margin: string): HTMLElement {
    const section = clause('acceptable-use');
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect);
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ scrollMarginTop: margin } as CSSStyleDeclaration);
    return section;
  }

  it('adds the scroll offset and subtracts the scroll margin', () => {
    vi.stubGlobal('scrollY', 200);
    expect(hashTop(placed(500, '120px'))).toBe(580);
  });

  it('treats a missing scroll margin as zero', () => {
    vi.stubGlobal('scrollY', 0);
    expect(hashTop(placed(500, ''))).toBe(500);
  });

  it('never goes above the top of the page', () => {
    vi.stubGlobal('scrollY', 0);
    expect(hashTop(placed(40, '120px'))).toBe(0);
  });
});
