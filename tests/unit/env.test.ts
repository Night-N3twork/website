import { describe, expect, it } from 'vitest';
import { readEnv } from '@/lib/env';

const GA_ID = 'G-ABC123XYZ';

describe('readEnv', () => {
  it('defaults the site url and leaves analytics off when unset', () => {
    expect(readEnv({})).toEqual({ siteUrl: 'https://night-x.com', gaId: null });
  });

  it('treats empty strings as unset', () => {
    expect(readEnv({ SITE_URL: '', GA_ID: '' })).toEqual({ siteUrl: 'https://night-x.com', gaId: null });
  });

  it('accepts a Google Analytics 4 measurement id and rejects other formats', () => {
    expect(readEnv({ GA_ID }).gaId).toBe(GA_ID);
    expect(() => readEnv({ GA_ID: 'UA-12345-1' })).toThrow(/GA_ID/);
    expect(() => readEnv({ GA_ID: 'G-lowercase' })).toThrow(/GA_ID/);
  });

  it('refuses the old Next names so a stale deploy cannot drop analytics or the site url quietly', () => {
    expect(() => readEnv({ NEXT_PUBLIC_SITE_URL: 'https://night-x.com' })).toThrow(/NEXT_PUBLIC_SITE_URL is now SITE_URL/);
    expect(() => readEnv({ NEXT_PUBLIC_GA_ID: GA_ID })).toThrow(/NEXT_PUBLIC_GA_ID is now GA_ID/);
    expect(readEnv({ NEXT_PUBLIC_GA_ID: '' }).gaId).toBeNull();
  });

  it('rejects a non-https site url and strips a trailing slash', () => {
    expect(() => readEnv({ SITE_URL: 'http://night-x.com' })).toThrow(/https/);
    expect(readEnv({ SITE_URL: 'https://next.night-x.com/' }).siteUrl).toBe('https://next.night-x.com');
  });
});
