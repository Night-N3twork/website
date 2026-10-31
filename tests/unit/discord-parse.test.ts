import { describe, expect, it } from 'vitest';
import { membersPayload } from '../helpers/data';
import { defaultAvatarIndex, defaultAvatarUrl, holdersOf, type MemberDirectory, NAME_MAX, parseMembers, UNCONFIGURED } from '@/lib/data/discord-parse';

const CDN = 'https://cdn.discordapp.com';
const GUILD = '1158510129075982467';
const BOOSTERS = '1198297300477432099';

const directory = (): MemberDirectory => ({ ok: true, members: parseMembers(membersPayload(), CDN, GUILD) });
const byId = (id: string) => directory().members.find((m) => m.id === id);

describe('parseMembers', () => {
  it('normalises every member and tolerates extra keys', () => {
    const members = parseMembers(membersPayload(), CDN, GUILD);
    expect(members).toHaveLength(19);
    expect(members.every((m) => Object.keys(m).sort().join() === 'avatarUrl,id,joinedAt,name,roles')).toBe(true);
  });

  it('prefers the server nickname, then the display name, then the username', () => {
    expect(byId('713488984596021291')?.name).toBe('Crllect');
    expect(byId('1199165998998245377')?.name).toBe('Amplify');
    expect(byId('405896057139232778')?.name).toBe('Synaptic');
    expect(byId('1250000000000000002')?.name).toBe('quietfox');
  });

  it('builds guild, user, animated and default avatar urls at the served size', () => {
    expect(byId('1199165998998245377')?.avatarUrl).toBe(`${CDN}/guilds/${GUILD}/users/1199165998998245377/avatars/8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d.webp?size=80`);
    expect(byId('713488984596021291')?.avatarUrl).toBe(`${CDN}/avatars/713488984596021291/b14f2c4038f5dc86aad1337b0919585d.webp?size=80`);
    expect(byId('840728662772023357')?.avatarUrl).toBe(`${CDN}/avatars/840728662772023357/a_1f2e3d4c5b6a79880716253443526170.webp?size=80`);
    expect(byId('405896057139232778')?.avatarUrl).toBe(`${CDN}/embed/avatars/1.png`);
    expect(byId('1250000000000000002')?.avatarUrl).toMatch(/\/embed\/avatars\/[0-5]\.png$/);
  });

  it('records the join date and the roles', () => {
    expect(byId('1199165998998245377')?.joinedAt).toBe('2023-10-02T18:04:11.000000+00:00');
    expect(byId('713488984596021291')?.roles).toEqual([GUILD, BOOSTERS]);
  });

  it('rejects members without a user id', () => {
    expect(() => parseMembers([{ nick: 'x', roles: [], joined_at: 'now' }], CDN, GUILD)).toThrow();
    expect(() => parseMembers({ members: [] }, CDN, GUILD)).toThrow();
  });

  it('degrades odd hashes and discriminators to the default avatar and cleans the display name', () => {
    const raw = { user: { id: '419430400000000000', username: 'zed.dev', discriminator: 'abcd', global_name: ' ​ Zed‮ ', avatar: '../evil' }, nick: '​‍', avatar: 'javascript:', roles: [], joined_at: '2025-01-01T00:00:00.000000+00:00', premium_since: null };
    const [member] = parseMembers([raw], CDN, GUILD);
    expect(member.avatarUrl).toBe(`${CDN}/embed/avatars/4.png`);
    expect(member.name).toBe('Zed');
    const [long] = parseMembers([{ ...raw, user: { ...raw.user, global_name: 'a'.repeat(100) } }], CDN, GUILD);
    expect(long.name).toHaveLength(NAME_MAX);
    const [blank] = parseMembers([{ ...raw, user: { ...raw.user, username: '', global_name: null } }], CDN, GUILD);
    expect(blank.name).toBe('419430400000000000');
  });
});

describe('default avatars', () => {
  it('uses the shifted id for the new username system and the discriminator for legacy accounts', () => {
    expect(defaultAvatarIndex('419430400000000000')).toBe(4);
    expect(defaultAvatarIndex('419430400000000000', '0')).toBe(4);
    expect(defaultAvatarIndex('419430400000000000', '4821')).toBe(1);
    expect(defaultAvatarUrl(CDN, '419430400000000000')).toBe(`${CDN}/embed/avatars/4.png`);
  });
});

describe('holdersOf', () => {
  it('lists the holders of a role by join date, and nobody without a role or a directory', () => {
    expect(holdersOf(directory(), BOOSTERS).map((m) => m.name)).toEqual(['Crllect', 'Gengar', 'Kay', 'Nova']);
    expect(holdersOf(directory(), null)).toEqual([]);
    expect(holdersOf(UNCONFIGURED, BOOSTERS)).toEqual([]);
  });
});
