import { type Donator, DONATORS } from '@/content/donators';
import { getMembers } from './discord';
import { holdersOf, type Member, type MemberDirectory } from './discord-parse';
import { serverEnv } from './env';

export type Supporter = { id: string; name: string; avatarUrl: string | null };
export type Supporters = { ok: boolean; boosters: readonly Supporter[]; donators: readonly Supporter[] };

const fromMember = (member: Member): Supporter => ({ id: member.id, name: member.name, avatarUrl: member.avatarUrl });

function fromRoster(roster: readonly Donator[], directory: MemberDirectory): Supporter[] {
  return roster.map((donator) => {
    const member = donator.id === null ? undefined : directory.members.find((m) => m.id === donator.id);
    return { id: donator.id ?? donator.name, name: donator.name, avatarUrl: member?.avatarUrl ?? null };
  });
}

export function selectSupporters(directory: MemberDirectory, boosterRoleId: string | null, roster: readonly Donator[] = DONATORS): Supporters {
  const donators = fromRoster(roster, directory);
  if (!directory.ok) return { ok: false, boosters: [], donators };
  return { ok: true, boosters: holdersOf(directory, boosterRoleId).map(fromMember), donators };
}

export async function getSupporters(): Promise<Supporters> {
  return selectSupporters(await getMembers(), serverEnv().discord?.boosterRoleId ?? null);
}
