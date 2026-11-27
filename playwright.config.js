import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const localOrders = process.env.E2E_ORDERS_LOCAL === '1';
const frontend = 'http://localhost:5173';
const backend = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  testIgnore: localOrders ? [] : '**/orders.spec.js',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: localOrders ? frontend : process.env.E2E_BASE_URL || frontend,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: localOrders ? [
    {
      command: 'node scripts/e2e-server.js',
      cwd: resolve(process.env.E2E_BACKEND_DIR || 'agromarket-server'),
      url: backend + '/api/health',
      env: { PORT: '3000', CORS_ORIGINS: frontend },
    },
    {
      command: 'npm run dev -- --host localhost --port 5173 --strictPort',
      url: frontend,
      env: { VITE_API_URL: backend + '/api' },
    },
  ] : undefined,
});
