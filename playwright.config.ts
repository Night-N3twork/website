import { defineConfig, devices } from '@playwright/test';

const SWIFTSHADER = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const executablePath = process.env.PLAYWRIGHT_CHROME || undefined;
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: { args: SWIFTSHADER, executablePath } };
const UPSTREAM = 'http://127.0.0.1:3900';
const PORT = Number(process.env.E2E_PORT ?? 3000);
const GA_PORT = 3002;
const STILL_SUITES = /(still|a11y|fit|visual)\.spec\.ts/;
const PROXY_URL = process.env.GLASS_BASE_URL;
const BASE_URL = PROXY_URL ?? `http://localhost:${PORT}`;
const fixtureEnv = {
  UPTIME_KUMA_BASE: UPSTREAM,
  UPTIME_KUMA_SLUG: 'all',
  DISCORD_API_BASE: `${UPSTREAM}/discord`,
  DISCORD_CDN_BASE: `${UPSTREAM}/cdn`,
  DISCORD_BOT_TOKEN: 'browser-tests',
  DISCORD_GUILD_ID: '1158510129075982467',
  DISCORD_BOOSTER_ROLE_ID: '1198297300477432099',
  REVALIDATE_SECRET: '',
  GA_ID: '',
  LEGAL_PREVIEW: '1',
  PORT: String(PORT),
};

export default defineConfig({
  testDir: 'tests/e2e/glass',
  timeout: 60_000,
  workers: 1,
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-' + (process.env.GLASS_BACKDROP ?? 'range') + '{ext}',
  use: { baseURL: BASE_URL, colorScheme: 'dark', ignoreHTTPSErrors: Boolean(PROXY_URL) },
  webServer: [
    { command: 'node tests/e2e/upstream.mjs', url: `${UPSTREAM}/health`, reuseExistingServer: !process.env.CI, timeout: 30_000 },
    { command: 'bun run build && bun run start', url: `http://localhost:${PORT}`, reuseExistingServer: Boolean(PROXY_URL), timeout: 300_000, env: fixtureEnv },
    {
      command: `node -e 'async function wait(){while(true){try{const r=await fetch("http://localhost:${PORT}/");if(r.status)break;}catch{}await new Promise(r=>setTimeout(r,500));}await import("./build/server.mjs");}wait();'`,
      url: `http://localhost:${GA_PORT}`,
      reuseExistingServer: Boolean(PROXY_URL),
      timeout: 300_000,
      env: { ...fixtureEnv, GA_ID: 'G-TEST123', PORT: String(GA_PORT) },
    },
  ],
  projects: [
    { name: 'chromium', use: desktop, testIgnore: STILL_SUITES },
    { name: 'reduced-motion', use: { ...desktop, reducedMotion: 'reduce' }, testMatch: STILL_SUITES },
  ],
});
