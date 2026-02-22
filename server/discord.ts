import { ApiHandler } from 'seyfert';

if (!process.env.DISCORD_TOKEN) {
	throw new Error('DISCORD_TOKEN environment variable is required');
}

if (!process.env.DISCORD_GUILD_ID) {
	throw new Error('DISCORD_GUILD_ID environment variable is required');
}

const token: string = process.env.DISCORD_TOKEN;
const guildId: string = process.env.DISCORD_GUILD_ID;

const api = new ApiHandler({ token });

export { api, guildId };
