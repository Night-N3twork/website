import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteJsonLd } from '@/app/SiteJsonLd';

afterEach(() => vi.restoreAllMocks());

describe('SiteJsonLd', () => {
  it('renders both blocks without a key warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const html = render(<SiteJsonLd />).container.innerHTML;
    expect(html.match(/application\/ld\+json/g)).toHaveLength(2);
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
    expect(error).not.toHaveBeenCalled();
  });
});
