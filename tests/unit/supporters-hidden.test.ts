import { describe, expect, it } from 'vitest';
import { BOOSTER_ROLE, membersFixture } from '../helpers/people';
import { HIDDEN_PEOPLE } from '@/content/hidden-people';
import { UNAVAILABLE } from '@/lib/data/discord-parse';
import { selectSupporters } from '@/lib/data/supporters';

describe('hidden supporters', () => {
  const directory = membersFixture();
  const allBoosters = selectSupporters(directory, BOOSTER_ROLE, [], []).boosters.map((b) => b.id);

  it('leaves a hidden booster off the list and keeps the rest', () => {
    const shown = selectSupporters(directory, BOOSTER_ROLE, [], [allBoosters[0]]).boosters.map((b) => b.id);
    expect(allBoosters).toHaveLength(4);
    expect(shown).toEqual(allBoosters.slice(1));
  });

  it('removes only the ids that match and ignores unknown ids', () => {
    const shown = selectSupporters(directory, BOOSTER_ROLE, [], [allBoosters[1], allBoosters[2], '419430400000000000']).boosters.map((b) => b.id);
    expect(shown).toEqual([allBoosters[0], allBoosters[3]]);
  });

  it('does not touch the hand-kept donators', () => {
    const roster = [{ name: 'Sam', id: null }, { name: 'Kay', id: allBoosters[2] }];
    const supporters = selectSupporters(directory, BOOSTER_ROLE, roster, allBoosters);
    expect(supporters.boosters).toEqual([]);
    expect(supporters.donators.map((d) => d.name)).toEqual(['Sam', 'Kay']);
  });

  it('still returns no boosters when the directory is unavailable', () => {
    const supporters = selectSupporters(UNAVAILABLE, BOOSTER_ROLE, [{ name: 'Sam', id: null }], [allBoosters[0]]);
    expect(supporters.ok).toBe(false);
    expect(supporters.boosters).toEqual([]);
    expect(supporters.donators).toHaveLength(1);
  });

  it('applies the shared hidden list when none is passed', () => {
    expect(selectSupporters(directory, BOOSTER_ROLE, [])).toEqual(selectSupporters(directory, BOOSTER_ROLE, [], HIDDEN_PEOPLE));
  });
});
