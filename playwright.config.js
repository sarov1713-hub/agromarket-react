import { defineConfig } from '@playwright/test';
import { apiURL, baseURL, external, localEnvironment } from './scripts/e2e-environment.mjs';

const smokeOnly = process.env.E2E_SMOKE_ONLY === '1' || process.argv.some(arg => arg.includes('@smoke'));
if (external && !smokeOnly) throw new Error('Внешний адрес: разрешена только команда npm run e2e:smoke. Полные E2E на production запрещены.');
// Playwright повторно читает конфигурацию в worker без исходных аргументов CLI.
if (external && smokeOnly) process.env.E2E_SMOKE_ONLY = '1';
if (!external) localEnvironment();

export default defineConfig({
  testDir: './e2e',
  testMatch: external ? 'smoke.spec.js' : '**/*.spec.js',
  globalSetup: external ? undefined : './e2e/global-setup.js',
  globalTeardown: external ? undefined : './e2e/global-teardown.js',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: external ? undefined : [
    { command: 'node scripts/e2e-backend.mjs', url: apiURL + '/health', reuseExistingServer: false, timeout: 45_000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: baseURL, reuseExistingServer: false,
      env: { VITE_API_URL: apiURL }, timeout: 45_000 },
  ],
});
