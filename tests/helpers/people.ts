import { membersPayload } from './data';
import { type MemberDirectory, parseMembers } from '@/lib/data/discord-parse';

export const GUILD = '1158510129075982467';
export const BOOSTER_ROLE = '1198297300477432099';

export function membersFixture(): MemberDirectory {
  return { ok: true, members: parseMembers(membersPayload(), 'https://cdn.discordapp.com', GUILD) };
}

export const membersState: { directory: MemberDirectory } = { directory: membersFixture() };

export const membersModuleMock = { getMembers: async () => membersState.directory };

export function resetMembers() {
  membersState.directory = membersFixture();
}

export const envModuleMock = {
  serverEnv: () => ({
    uptime: { base: 'https://uptime.night-x.com', slug: 'all' },
    discord: { apiBase: 'https://discord.com/api/v10', cdnBase: 'https://cdn.discordapp.com', token: 'test', guildId: GUILD, boosterRoleId: BOOSTER_ROLE },
    cdnBase: 'https://cdn.discordapp.com',
    revalidateSecret: null,
  }),
};
