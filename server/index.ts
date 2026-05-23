import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import statsRoutes from './routes/stats.js';
import usersRoutes from './routes/users.js';

const PORT = Number(process.env.API_PORT) || 3001;
const HOST = process.env.API_HOST || '0.0.0.0';

const app = Fastify({ logger: true });

// register all routes under /api
app.register(statsRoutes, { prefix: '/api' });
app.register(usersRoutes, { prefix: '/api' });

// Astro SSR integration.
//
// In production, `npm run build` emits:
//   dist/server/entry.mjs   (Node request handler)
//   dist/client/_astro/...  (bundled JS/CSS — must be served as static)
//   dist/client/res/...     (public/ assets — must be served as static)
//
// We mount @fastify/static for /res and /_astro, then a catch-all that
// forwards anything else to Astro's SSR handler.
//
// In dev (when there's no build yet), we silently skip these registrations —
// the Astro dev server (port 4321) serves the frontend instead, and Fastify
// only needs to expose /api/* for the dev-server proxy.
const clientDir = fileURLToPath(new URL('../dist/client', import.meta.url));
const serverEntry = fileURLToPath(
	new URL('../dist/server/entry.mjs', import.meta.url)
);
const hasBuild = existsSync(serverEntry);

if (hasBuild) {
	// Serve hashed bundle assets.
	await app.register(fastifyStatic, {
		root: clientDir,
		prefix: '/',
		decorateReply: false,
		// Don't auto-serve index.html — Astro SSR owns the HTML routes.
		index: false,
		// Don't reply 404 here; let the request fall through to Astro's handler.
		wildcard: false
	});

	// Dynamically import Astro's SSR handler (only available after a build).
	const astro = (await import(serverEntry)) as {
		handler: (
			req: import('node:http').IncomingMessage,
			res: import('node:http').ServerResponse,
			next?: (err?: unknown) => void
		) => void;
	};

	// Catch-all for anything not handled by /api/* or the static file plugin.
	app.all('/*', (request, reply) => {
		astro.handler(request.raw, reply.raw, err => {
			if (err) {
				reply.send(err);
			} else {
				// Astro returned without writing a response — treat as 404.
				reply.code(404).send({ error: 'Not Found' });
			}
		});
	});
} else {
	app.log.info(
		'No build found at dist/server/entry.mjs — running API-only mode. ' +
			'Run `npm run build` for SSR, or use `npm run dev` for the dev server.'
	);
}

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
