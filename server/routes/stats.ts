import type { FastifyInstance } from 'fastify';
import { api, guildId, lunarGuildId } from '../discord.js';

// --- cache ---
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return null;
	}
	return entry.data;
}

function setCache<T>(key: string, data: T): void {
	cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// fetch all members with pagination, cached
async function fetchAllMembers() {
	const cached = getCached<any[]>('all_members');
	if (cached) return cached;

	const allMembers: any[] = [];
	let after = '0';

	while (true) {
		const batch = await api.proxy
			.guilds(guildId)
			.members.get({ query: { limit: 1000, after } });

		if (!batch.length) break;

		allMembers.push(...batch);

		if (batch.length < 1000) break;
		after = batch[batch.length - 1].user?.id ?? '0';
	}

	setCache('all_members', allMembers);
	return allMembers;
}

// fetch a single guild's overview (cached per-guild)
async function fetchGuildOverview(id: string) {
	const cacheKey = `guild_stats_${id}`;
	const cached = getCached<any>(cacheKey);
	if (cached) return cached;

	const guild = await api.proxy
		.guilds(id)
		.get({ query: { with_counts: true } });
	const result = {
		name: guild.name,
		id: guild.id,
		memberCount: guild.approximate_member_count ?? null,
		icon: guild.icon
	};

	setCache(cacheKey, result);
	return result;
}

export default async function statsRoutes(fastify: FastifyInstance) {
	// GET /api/stats — combined overview across all configured guilds.
	// `memberCount` is the sum across guilds; `guilds` contains per-guild detail.
	fastify.get('/stats', async (_request, reply) => {
		try {
			const ids = [guildId, ...(lunarGuildId ? [lunarGuildId] : [])];

			const settled = await Promise.allSettled(
				ids.map(id => fetchGuildOverview(id))
			);

			const guilds: any[] = [];
			let totalMemberCount = 0;
			let anySuccess = false;

			for (let i = 0; i < settled.length; i++) {
				const outcome = settled[i];
				if (outcome.status === 'fulfilled') {
					anySuccess = true;
					guilds.push(outcome.value);
					if (typeof outcome.value.memberCount === 'number') {
						totalMemberCount += outcome.value.memberCount;
					}
				} else {
					fastify.log.error(
						{ err: outcome.reason, guildId: ids[i] },
						'Failed to fetch guild overview'
					);
				}
			}

			if (!anySuccess) {
				return reply
					.status(500)
					.send({ error: 'Failed to fetch guild stats' });
			}

			// Primary guild detail kept at top level for backward compatibility
			// with existing frontend code that reads { name, id, memberCount, icon }.
			const primary = guilds.find(g => g.id === guildId) ?? guilds[0];

			return reply.send({
				name: primary.name,
				id: primary.id,
				memberCount: totalMemberCount,
				icon: primary.icon,
				guilds
			});
		} catch (err) {
			fastify.log.error(err);
			return reply
				.status(500)
				.send({ error: 'Failed to fetch guild stats' });
		}
	});

	// GET /api/stats/roles — list all roles
	fastify.get('/stats/roles', async (_request, reply) => {
		try {
			const cached = getCached<any[]>('guild_roles');
			if (cached) return reply.send(cached);

			const roles = await api.proxy.guilds(guildId).roles.get();

			const result = roles.map(role => ({
				id: role.id,
				name: role.name,
				color: role.color,
				position: role.position,
				memberCount: null
			}));

			setCache('guild_roles', result);
			return reply.send(result);
		} catch (err) {
			fastify.log.error(err);
			return reply.status(500).send({ error: 'Failed to fetch roles' });
		}
	});

	// GET /api/stats/members?role=ROLE_ID — members, optionally filtered by role
	fastify.get<{ Querystring: { role?: string } }>(
		'/stats/members',
		async (request, reply) => {
			try {
				const roleId = request.query.role;
				const cacheKey = roleId
					? `members_role_${roleId}`
					: 'members_all';

				const cached = getCached<any[]>(cacheKey);
				if (cached) return reply.send(cached);

				const allMembers = await fetchAllMembers();

				let filtered = allMembers;
				if (roleId) {
					filtered = allMembers.filter(m => m.roles.includes(roleId));
				}

				const result = filtered.map(m => ({
					id: m.user?.id,
					username: m.user?.username,
					displayName:
						m.nick ?? m.user?.global_name ?? m.user?.username,
					avatar: m.avatar ?? m.user?.avatar,
					roles: m.roles,
					joinedAt: m.joined_at
				}));

				setCache(cacheKey, result);
				return reply.send(result);
			} catch (err) {
				fastify.log.error(err);
				return reply
					.status(500)
					.send({ error: 'Failed to fetch members' });
			}
		}
	);
}
