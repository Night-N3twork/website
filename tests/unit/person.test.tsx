import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersonCard } from '@/ui/glass/people/PersonCard';
import { toPerson } from '@/ui/glass/people/person';

describe('toPerson', () => {
  it('points Discord members at the avatar endpoint', () => {
    expect(toPerson({ id: '123456789012345678', name: 'Ada' }).avatar).toBe('/api/users/123456789012345678/avatar');
  });

  it('gives people without a Discord id no avatar url', () => {
    expect(toPerson({ id: 'Alex', name: 'Alex' }).avatar).toBeNull();
  });
});

describe('PersonCard', () => {
  it('draws an empty avatar circle instead of a broken image', () => {
    const { container } = render(<PersonCard person={toPerson({ id: 'Alex', name: 'Alex' })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.person-avatar')).not.toBeNull();
  });
});
