import type { FastifyInstance } from "fastify";
import { api } from "../discord.js";

const CDN_BASE = "https://cdn.discordapp.com";

function avatarUrl(userId: string, hash: string | null | undefined, discriminator?: string): string {
	if (hash) {
		const ext = hash.startsWith("a_") ? "gif" : "png";
		return `${CDN_BASE}/avatars/${userId}/${hash}.${ext}?size=256`;
	}
	// default avatar fallback
	const index = discriminator && discriminator !== "0"
		? Number(discriminator) % 5
		: (BigInt(userId) >> 22n) % 6n;
	return `${CDN_BASE}/embed/avatars/${index}.png`;
}

export default async function usersRoutes(fastify: FastifyInstance) {
	// GET /api/users/:id — fetch a Discord user's public info
	fastify.get<{ Params: { id: string } }>(
		"/users/:id",
		async (request, reply) => {
			try {
				const user = await api.proxy.users(request.params.id).get();

				return reply.send({
					id: user.id,
					username: user.username,
					displayName: user.global_name ?? user.username,
					avatar: avatarUrl(user.id, user.avatar, user.discriminator),
				});
			} catch (err) {
				fastify.log.error(err);
				return reply.status(500).send({ error: "Failed to fetch user" });
			}
		}
	);

	// GET /api/users/:id/avatar — redirect to the user's Discord avatar URL
	fastify.get<{ Params: { id: string } }>(
		"/users/:id/avatar",
		async (request, reply) => {
			try {
				const user = await api.proxy.users(request.params.id).get();
				const url = avatarUrl(user.id, user.avatar, user.discriminator);

				return reply.redirect(url);
			} catch (err) {
				fastify.log.error(err);
				return reply.status(500).send({ error: "Failed to fetch avatar" });
			}
		}
	);
}
