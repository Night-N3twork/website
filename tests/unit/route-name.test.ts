import { describe, expect, it } from 'vitest';
import { routeName } from '@/navigation/route-name';

const match = (id: string, loaderData: unknown = {}) => ({ id, loaderData });

describe('routeName', () => {
  it('names the page from the leaf match', () => {
    expect(routeName([match('root'), match('projects')])).toBe('projects');
    expect(routeName([match('root'), match('home')])).toBe('home');
  });

  it('calls an errored leaf lost', () => {
    expect(routeName([match('root'), { id: 'home', loaderData: undefined }])).toBe('lost');
    expect(routeName([match('root'), { id: 'project', loaderData: undefined }])).toBe('lost');
  });

  it('calls unknown routes lost', () => {
    expect(routeName([match('root'), match('lost')])).toBe('lost');
    expect(routeName([])).toBe('lost');
  });
});
