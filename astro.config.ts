// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
    vite: {
  server: {
    allowedHosts: ['laptop'],
    proxy: {
      "/api/": {
        target: "http://localhost:3001/api/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\//, "")
      },

    }
  }
}
});
