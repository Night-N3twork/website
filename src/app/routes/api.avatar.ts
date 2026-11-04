import { getMembers } from '@/lib/data/discord';
import { defaultAvatarUrl, SNOWFLAKE } from '@/lib/data/discord-parse';
import { serverEnv } from '@/lib/data/env';
import type { Route } from './+types/api.avatar';

const MAX_AGE_SECONDS = 300;
const STALE_SECONDS = 86_400;
const MAX_AVATAR_BYTES = 262_144;
const UPSTREAM_TIMEOUT_MS = 5_000;
const IMAGE_TYPES: readonly string[] = ['image/webp', 'image/png', 'image/jpeg', 'image/gif'];
const CACHE_CONTROL = `public, max-age=${MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`;

const badGateway = () => new Response(null, { status: 502 });
const mediaType = (header: string | null) => (header ?? '').split(';')[0].trim().toLowerCase();

async function readCapped(body: ReadableStream<Uint8Array> | null): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let part = await reader.read(); !part.done; part = await reader.read()) {
    total += part.value.byteLength;
    if (total > MAX_AVATAR_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  return Buffer.concat(chunks, total);
}

async function fetchAvatar(url: string): Promise<Response> {
  const upstream = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), redirect: 'error' });
  const type = mediaType(upstream.headers.get('content-type'));
  if (!upstream.ok || !IMAGE_TYPES.includes(type)) {
    await upstream.body?.cancel();
    return badGateway();
  }
  const bytes = await readCapped(upstream.body);
  if (!bytes) return badGateway();
  return new Response(bytes, { status: 200, headers: { 'content-type': type, 'cache-control': CACHE_CONTROL } });
}

export async function loader({ params }: Route.LoaderArgs): Promise<Response> {
  const id = params.id ?? '';
  if (!SNOWFLAKE.test(id)) return new Response(null, { status: 400 });
  const directory = await getMembers();
  const url = directory.members.find((member) => member.id === id)?.avatarUrl ?? defaultAvatarUrl(serverEnv().cdnBase, id);
  try {
    return await fetchAvatar(url);
  } catch {
    return badGateway();
  }
}
