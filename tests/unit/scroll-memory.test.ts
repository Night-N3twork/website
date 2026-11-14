import { describe, expect, it } from 'vitest';
import { createScrollMemory } from '@/navigation/scroll-memory';

describe('createScrollMemory', () => {
  it('returns the saved position only when going back or forward', () => {
    const memory = createScrollMemory();
    memory.save('a', 2800);
    expect(memory.restore('a', 'POP')).toBe(2800);
    expect(memory.restore('a', 'PUSH')).toBeNull();
    expect(memory.restore('b', 'POP')).toBeNull();
  });

  it('forgets the oldest entries past its limit', () => {
    const memory = createScrollMemory(2);
    memory.save('a', 1);
    memory.save('b', 2);
    memory.save('c', 3);
    expect(memory.restore('a', 'POP')).toBeNull();
    expect(memory.restore('c', 'POP')).toBe(3);
  });
});
