import { z } from 'zod';

export const SNOWFLAKE = /^\d{17,20}$/;
export const AVATAR_SIZE = 80;
export const NAME_MAX = 32;

const AVATAR_HASH = /^(a_)?[0-9a-f]{32}$/;
const DISCRIMINATOR = /^\d{1,4}$/;
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;
const DEFAULT_AVATARS = BigInt(6);
const LEGACY_DEFAULT_AVATARS = 5;
const ID_SHIFT = BigInt(22);
const NEW_SYSTEM = '0';

const hash = z.string().regex(AVATAR_HASH).nullable().optional().catch(null);
const userSchema = z.object({
  id: z.string().regex(SNOWFLAKE),
  username: z.string(),
  discriminator: z.string().regex(DISCRIMINATOR).optional().catch(undefined),
  global_name: z.string().nullable().optional(),
  avatar: hash,
});
const memberSchema = z.object({
  user: userSchema,
  nick: z.string().nullable().optional(),
  avatar: hash,
  roles: z.array(z.string()),
  joined_at: z.string(),
});
const membersSchema = z.array(memberSchema);

type RawMember = z.infer<typeof memberSchema>;

export type Member = { id: string; name: string; avatarUrl: string; joinedAt: string; roles: readonly string[] };
export type MemberDirectory = { ok: true; members: readonly Member[] } | { ok: false; reason: 'unconfigured' | 'unavailable'; members: readonly Member[] };

export const UNCONFIGURED: MemberDirectory = Object.freeze({ ok: false, reason: 'unconfigured', members: Object.freeze([]) });
export const UNAVAILABLE: MemberDirectory = Object.freeze({ ok: false, reason: 'unavailable', members: Object.freeze([]) });

export function defaultAvatarIndex(id: string, discriminator?: string): number {
  if (discriminator && discriminator !== NEW_SYSTEM) return Number(discriminator) % LEGACY_DEFAULT_AVATARS;
  return Number((BigInt(id) >> ID_SHIFT) % DEFAULT_AVATARS);
}

export function defaultAvatarUrl(cdnBase: string, id: string, discriminator?: string): string {
  return `${cdnBase}/embed/avatars/${defaultAvatarIndex(id, discriminator)}.png`;
}

function avatarUrl(cdnBase: string, guildId: string, member: RawMember): string {
  const { id, avatar, discriminator } = member.user;
  if (member.avatar) return `${cdnBase}/guilds/${guildId}/users/${id}/avatars/${member.avatar}.webp?size=${AVATAR_SIZE}`;
  if (avatar) return `${cdnBase}/avatars/${id}/${avatar}.webp?size=${AVATAR_SIZE}`;
  return defaultAvatarUrl(cdnBase, id, discriminator);
}

function cleanName(value: string | null | undefined): string {
  return (value ?? '').replace(INVISIBLE, '').trim().slice(0, NAME_MAX);
}

function displayName(member: RawMember): string {
  return [member.nick, member.user.global_name, member.user.username].map(cleanName).find((name) => name.length > 0) ?? member.user.id;
}

export function parseMembers(payload: unknown, cdnBase: string, guildId: string): Member[] {
  return membersSchema.parse(payload).map((member) => ({
    id: member.user.id,
    name: displayName(member),
    avatarUrl: avatarUrl(cdnBase, guildId, member),
    joinedAt: member.joined_at,
    roles: member.roles,
  }));
}

export function holdersOf(directory: MemberDirectory, roleId: string | null): Member[] {
  if (roleId === null) return [];
  return directory.members.filter((member) => member.roles.includes(roleId)).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}
