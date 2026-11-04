import { describe, expect, it, vi } from 'vitest';
import { browserStorage, CONSENT_EVENT, CONSENT_KEY, openConsent, readConsent, writeConsent } from '@/lib/consent';

const store = (value: string | null): Pick<Storage, 'getItem'> => ({ getItem: () => value });

describe('readConsent', () => {
  it('reads only the two known values', () => {
    expect(readConsent(store('granted'))).toBe('granted');
    expect(readConsent(store('denied'))).toBe('denied');
    for (const bad of ['maybe', '', '1', null]) expect(readConsent(store(bad))).toBeNull();
  });

  it('treats missing or throwing storage as unset', () => {
    expect(readConsent(null)).toBeNull();
    expect(
      readConsent({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBeNull();
  });
});

describe('writeConsent', () => {
  it('stores the choice under the consent key', () => {
    const setItem = vi.fn();
    expect(writeConsent({ setItem }, 'granted')).toBe(true);
    expect(setItem).toHaveBeenCalledWith(CONSENT_KEY, 'granted');
  });

  it('reports a write that could not be stored', () => {
    expect(
      writeConsent(
        {
          setItem: () => {
            throw new Error('quota');
          },
        },
        'granted',
      ),
    ).toBe(false);
    expect(writeConsent(null, 'denied')).toBe(false);
  });
});

describe('browserStorage', () => {
  it('returns local storage when the browser allows it', () => {
    expect(browserStorage()).toBe(window.localStorage);
  });

  it('returns null when reading local storage throws', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(browserStorage()).toBeNull();
    spy.mockRestore();
  });
});

describe('openConsent', () => {
  it('fires the consent event on the target', () => {
    const target = new EventTarget();
    const heard = vi.fn();
    target.addEventListener(CONSENT_EVENT, heard);
    openConsent(target);
    expect(heard).toHaveBeenCalledTimes(1);
  });
});
