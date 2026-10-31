import { type Contributor, CONTRIBUTORS } from '@/content/contributors';
import { getMembers } from './discord';
import type { MemberDirectory } from './discord-parse';

const YEAR_DIGITS = 4;

export type ContributorCard = Contributor & { avatarUrl: string | null; since: number | null };

function joinYear(joinedAt: string | undefined): number | null {
  const year = Number(joinedAt?.slice(0, YEAR_DIGITS));
  return Number.isInteger(year) && year > 0 ? year : null;
}

export function withMembers(roster: readonly Contributor[], directory: MemberDirectory): ContributorCard[] {
  const byId = new Map(directory.members.map((member) => [member.id, member]));
  return roster.map((contributor) => {
    const member = byId.get(contributor.id);
    return { ...contributor, avatarUrl: member?.avatarUrl ?? null, since: joinYear(member?.joinedAt) };
  });
}

export async function getContributors(): Promise<ContributorCard[]> {
  return withMembers(CONTRIBUTORS, await getMembers());
}
