import { ApiHandler } from 'seyfert';

if (!process.env.DISCORD_TOKEN) {
	throw new Error('DISCORD_TOKEN environment variable is required');
}

if (!process.env.DISCORD_GUILD_ID) {
	throw new Error('DISCORD_GUILD_ID environment variable is required');
}

const token: string = process.env.DISCORD_TOKEN;
const guildId: string = process.env.DISCORD_GUILD_ID;
// Optional secondary guild (e.g. Lunar). When unset, stats endpoints
// silently fall back to the primary guild only.
const lunarGuildId: string | undefined =
	process.env.DISCORD_GUILD_ID_LUNAR &&
	process.env.DISCORD_GUILD_ID_LUNAR.length > 0
		? process.env.DISCORD_GUILD_ID_LUNAR
		: undefined;

const api = new ApiHandler({ token });

export { api, guildId, lunarGuildId };
