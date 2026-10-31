import { describe, expect, it } from 'vitest';
import { relatedProjects } from '@/lib/projects/related';

describe('relatedProjects', () => {
  it('returns the declared relations first, in order', () => {
    expect(relatedProjects('dusk').map((p) => p.slug)).toEqual(['dpm', 'nova', 'moonbeam']);
  });

  it('tops up from display order without repeating or including itself', () => {
    const slugs = relatedProjects('solar').map((p) => p.slug);
    expect(slugs).toEqual(['link-archive', 'dusk', 'moonbeam']);
  });

  it('honours a custom limit', () => {
    expect(relatedProjects('space', 1).map((p) => p.slug)).toEqual(['ddx']);
  });

  it('returns an empty list for an unknown slug', () => {
    expect(relatedProjects('nope')).toEqual([]);
  });
});
