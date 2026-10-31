import { describe, expect, it } from 'vitest';
import { analyticsTags } from '@/lib/analytics';

describe('analyticsTags', () => {
  it('renders nothing when analytics is not configured', () => {
    expect(analyticsTags(null)).toBeNull();
  });

  it('refuses anything that is not a measurement id, so nothing foreign reaches the inline script', () => {
    for (const id of ["G-1');alert(1)//", 'G-ABC</script><script>alert(1)', 'UA-12345-1', 'g-abc123', 'G-']) expect(analyticsTags(id), id).toBeNull();
  });

  it('loads gtag for the measurement id and configures it', () => {
    const tags = analyticsTags('G-ABC123');
    expect(tags?.loader).toBe('https://www.googletagmanager.com/gtag/js?id=G-ABC123');
    expect(tags?.setup).toBe("window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-ABC123')");
  });
});
