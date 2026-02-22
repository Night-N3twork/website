import Fastify from 'fastify';
import fastifyStatic from "@fastify/static";

import statsRoutes from './routes/stats.js';
import usersRoutes from './routes/users.js';

const PORT = Number(process.env.API_PORT) || 3001;
const HOST = process.env.API_HOST || '0.0.0.0';

const app = Fastify({ logger: true });

// register all routes under /api
app.register(statsRoutes, { prefix: '/api' });
app.register(usersRoutes, { prefix: '/api' });
const frontendPath = new URL('../dist', import.meta.url);
await app.register(fastifyStatic, {
    root: frontendPath,
    prefix: "/",
    index: ["index.html"],
    extensions: ["html"]
  });

const start = async () => {
	try {
		await app.listen({ port: PORT, host: HOST });
		app.log.info(`API server listening on ${HOST}:${PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
