// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// https://astro.build/config
export default defineConfig({
	// Server output enables SSR (used for the root-route locale redirect via
	// middleware). Pages with `export const prerender = true` still emit static
	// HTML at build time, so the four "real" pages (and their locale variants)
	// are pre-rendered; only `/` runs at request time.
	output: 'server',
	// Middleware mode: build emits a request handler we mount inside the
	// existing Fastify app — one port, one process, no separate Astro server.
	adapter: node({ mode: 'middleware' }),
	integrations: [tailwind()],
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es', 'fr', 'ja'],
		routing: {
			// English at /, others at /es/, /fr/, /ja/.
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false
		}
	},
	vite: {
		resolve: {
			alias: {
				'@components': r('./src/components'),
				'@layouts': r('./src/layouts'),
				'@pages': r('./src/pages'),
				'@styles': r('./src/styles'),
				'@utils': r('./src/utils'),
				'@data': r('./src/data'),
				'@i18n': r('./src/i18n')
			}
		},
		server: {
			allowedHosts: ['laptop'],
			proxy: {
				'/api/': {
					target: 'http://localhost:3001/api/',
					changeOrigin: true,
					rewrite: path => path.replace(/^\/api\//, '')
				}
			}
		}
	}
});
