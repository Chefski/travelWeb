import { defineConfig } from '@playwright/test';

const PORT = 3001;

export default defineConfig({
  testDir: './tests/perf',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: [
      'bun run generate',
      'rm -rf .output/perf-serve',
      'mkdir -p .output/perf-serve/travelWeb',
      'cp -r .output/public/* .output/perf-serve/travelWeb/',
      `npx serve .output/perf-serve -l ${PORT}`,
    ].join(' && '),
    url: `http://localhost:${PORT}/travelWeb/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
