import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import { BOOSTER_ROLE, membersFixture } from '../helpers/people';
import { CONTRIBUTORS, contributorsIn } from '@/content/contributors';
import { DONATORS } from '@/content/donators';
import { ROLES } from '@/content/roles';
import { withMembers } from '@/lib/data/contributors';
import { UNAVAILABLE, UNCONFIGURED } from '@/lib/data/discord-parse';
import { selectSupporters } from '@/lib/data/supporters';
import { toPerson } from '@/ui/glass/people/person';

describe('CONTRIBUTORS', () => {
  it('lists sixteen people with unique snowflake ids, orbit order, and only known roles', () => {
    expect(CONTRIBUTORS).toHaveLength(16);
    expect(new Set(CONTRIBUTORS.map((c) => c.id)).size).toBe(16);
    const order = ROLES.map((r) => r.id);
    for (const c of CONTRIBUTORS) {
      expect(c.id).toMatch(/^\d{17,20}$/);
      expect(c.name.trim()).toBe(c.name);
      expect(c.name.length).toBeGreaterThan(0);
      expect(order).toContain(c.role);
      if (c.link) expect(c.link).toMatch(/^https:\/\//);
    }
    const ranks = CONTRIBUTORS.map((c) => order.indexOf(c.role));
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    expect(contributorsIn('owner').map((c) => c.name)).toEqual(['Amplify', 'KDust7', 'Crllect', 'soap phia']);
    expect(contributorsIn('developer')).toHaveLength(1);
  });

  it('has seven roles, each with an English name', () => {
    expect(ROLES.map((r) => r.id)).toEqual(['owner', 'co-owner', 'director', 'developer', 'admin', 'mod', 'marketer']);
    for (const r of ROLES) expect((en.roles as Record<string, string>)[r.id]).toBeTruthy();
  });
});

describe('withMembers', () => {
  it('attaches the live avatar and join year, keeping the roster name', () => {
    const cards = withMembers(CONTRIBUTORS, membersFixture());
    const crllect = cards.find((c) => c.id === '713488984596021291');
    expect(crllect).toMatchObject({ name: 'Crllect', role: 'owner', since: 2024 });
    expect(crllect?.avatarUrl).toContain('/avatars/713488984596021291/');
  });

  it('leaves avatar and year empty when the directory is missing or lacks the person', () => {
    expect(withMembers(CONTRIBUTORS, UNCONFIGURED).every((c) => c.avatarUrl === null && c.since === null)).toBe(true);
    const cards = withMembers([{ id: '419430400000000000', name: 'Ghost', role: 'mod', link: null }], membersFixture());
    expect(cards[0]).toMatchObject({ avatarUrl: null, since: null });
    const odd = { ok: true as const, members: [{ id: '419430400000000000', name: 'Ghost', avatarUrl: 'https://cdn.discordapp.com/embed/avatars/4.png', joinedAt: 'unknown', roles: [] }] };
    expect(withMembers([{ id: '419430400000000000', name: 'Ghost', role: 'mod', link: null }], odd)[0].since).toBeNull();
  });
});

describe('toPerson', () => {
  it('points every avatar at the same-origin proxy, whatever address Discord reported', () => {
    const [card] = withMembers([{ id: '713488984596021291', name: 'Crllect', role: 'owner', link: null }], membersFixture());
    expect(card.avatarUrl).toContain('cdn.discordapp.com');
    expect(toPerson(card, '2024', null).avatar).toBe('/api/users/713488984596021291/avatar');
    expect(toPerson({ id: '419430400000000000', name: 'Ghost' }).avatar).toBe('/api/users/419430400000000000/avatar');
  });
});

describe('DONATORS', () => {
  it('names every donator once, with a snowflake id or none', () => {
    for (const d of DONATORS) {
      expect(d.name.trim()).toBe(d.name);
      expect(d.name.length).toBeGreaterThan(0);
      if (d.id !== null) expect(d.id).toMatch(/^\d{17,20}$/);
    }
    expect(new Set(DONATORS.map((d) => d.id ?? d.name)).size).toBe(DONATORS.length);
  });
});

describe('selectSupporters', () => {
  const roster = [{ name: 'Kay', id: '1089613026040225964' }, { name: 'Patron', id: null }, { name: 'Ghost', id: '419430400000000000' }] as const;
  const listed = [
    { id: '1089613026040225964', name: 'Kay', avatarUrl: 'https://cdn.discordapp.com/avatars/1089613026040225964/06e4e5a104eda7074fb40693bf6b149d.webp?size=80' },
    { id: 'Patron', name: 'Patron', avatarUrl: null },
    { id: '419430400000000000', name: 'Ghost', avatarUrl: null },
  ];

  it('lists the booster role holders by join date and the hand-kept donators with avatars when the directory knows them', () => {
    const supporters = selectSupporters(membersFixture(), BOOSTER_ROLE, roster);
    expect(supporters.ok).toBe(true);
    expect(supporters.boosters.map((m) => m.name)).toEqual(['Crllect', 'Gengar', 'Kay', 'Nova']);
    expect(supporters.boosters[0]).toEqual({ id: '713488984596021291', name: 'Crllect', avatarUrl: 'https://cdn.discordapp.com/avatars/713488984596021291/b14f2c4038f5dc86aad1337b0919585d.webp?size=80' });
    expect(supporters.donators).toEqual(listed);
    expect(selectSupporters(membersFixture(), null, roster).boosters).toEqual([]);
  });

  it('keeps the donators without avatars and drops the boosters when Discord is unavailable', () => {
    expect(selectSupporters(UNAVAILABLE, BOOSTER_ROLE, roster)).toEqual({ ok: false, boosters: [], donators: listed.map((d) => ({ ...d, avatarUrl: null })) });
    expect(selectSupporters(membersFixture(), BOOSTER_ROLE).donators.map((d) => d.name)).toEqual(DONATORS.map((d) => d.name));
  });
});
