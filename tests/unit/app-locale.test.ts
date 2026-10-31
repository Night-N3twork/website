import { describe, expect, it } from 'vitest';
import { pageLocation } from '@/app/locale';

const at = (url: string) => pageLocation(new Request(url));

describe('pageLocation', () => {
  it('reads locale and path from a document request', () => {
    expect(at('http://x/es/projects')).toEqual({ locale: 'es', path: '/projects' });
    expect(at('http://x/projects?x=1')).toEqual({ locale: 'en', path: '/projects' });
  });

  it('strips the data suffix of client navigations', () => {
    expect(at('http://x/projects.data')).toEqual({ locale: 'en', path: '/projects' });
    expect(at('http://x/es.data?_routes=root')).toEqual({ locale: 'es', path: '/' });
    expect(at('http://x/_root.data')).toEqual({ locale: 'en', path: '/' });
    expect(at('http://x/es/projects/dusk.data')).toEqual({ locale: 'es', path: '/projects/dusk' });
  });
});
