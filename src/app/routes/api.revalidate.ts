import { timingSafeEqual } from 'node:crypto';
import { serverEnv } from '@/lib/data/env';
import { dataCache } from '@/lib/data/swr';
import { CACHE_TAGS } from '@/lib/data/tags';
import type { Route } from './+types/api.revalidate';

const TAGS = new Set<string>(Object.values(CACHE_TAGS));
const BEARER = /^Bearer\s+(.+)$/i;

function presented(header: string | null): string {
  return BEARER.exec(header ?? '')?.[1] ?? '';
}

function authorized(header: string | null, secret: string): boolean {
  const given = Buffer.from(presented(header));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function loader(): Response {
  return new Response(null, { status: 405, headers: { allow: 'POST' } });
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const secret = serverEnv().revalidateSecret;
  if (!secret) return new Response(null, { status: 404 });
  if (!authorized(request.headers.get('authorization'), secret)) return new Response(null, { status: 401 });
  const tag = new URL(request.url).searchParams.get('tag');
  if (!tag || !TAGS.has(tag)) return Response.json({ error: 'unknown tag' }, { status: 400 });
  dataCache.invalidate(tag);
  return Response.json({ revalidated: tag });
}
