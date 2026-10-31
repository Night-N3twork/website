import { getMembers } from '@/lib/data/discord';
import { defaultAvatarUrl, SNOWFLAKE } from '@/lib/data/discord-parse';
import { serverEnv } from '@/lib/data/env';
import type { Route } from './+types/api.avatar';

const MAX_AGE_SECONDS = 300;

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  const id = params.id ?? '';
  if (!SNOWFLAKE.test(id)) return new Response(null, { status: 400 });
  const directory = await getMembers();
  const location = directory.members.find((member) => member.id === id)?.avatarUrl ?? defaultAvatarUrl(serverEnv().cdnBase, id);
  return new Response(null, { status: 302, headers: { location, 'cache-control': `public, max-age=${MAX_AGE_SECONDS}` } });
}
