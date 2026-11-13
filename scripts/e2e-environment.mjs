import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
const envFile = resolve(root, '.env.e2e');
if (existsSync(envFile)) process.loadEnvFile(envFile);
export const baseURL = process.env.BASE_URL || process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
export function isLoopback(url) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);
}
export const external = !isLoopback(baseURL);
export const apiURL = process.env.E2E_API_URL || 'http://127.0.0.1:3100/api';
export const backendDir = resolve(process.env.E2E_BACKEND_DIR || resolve(root, 'agromarket-server'));

export function localEnvironment() {
  if (external || !isLoopback(apiURL)) throw new Error('Полные E2E разрешены только для локальных frontend и API.');
  const database = process.env.E2E_DATABASE_URL;
  if (!database) throw new Error('Задайте E2E_DATABASE_URL отдельной локальной БД agromarket_test в .env.e2e.');
  const url = new URL(database);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !isLoopback(database) || url.pathname !== '/agromarket_test' || url.search || url.hash) {
    throw new Error('E2E_DATABASE_URL должна указывать только на локальную agromarket_test без query-параметров.');
  }
  for (const key of ['E2E_JWT_SECRET', 'E2E_FARMER_EMAIL', 'E2E_FARMER_PASSWORD']) {
    if (!process.env[key]) throw new Error('Не задана тестовая переменная ' + key);
  }
  return { ...process.env, NODE_ENV: 'test', DATABASE_URL: database, PGDATABASE: 'agromarket_test',
    JWT_SECRET: process.env.E2E_JWT_SECRET, JWT_EXPIRES_IN: '1h',
    ADMIN_EMAIL: process.env.E2E_FARMER_EMAIL, ADMIN_PASSWORD: process.env.E2E_FARMER_PASSWORD,
    CORS_ORIGINS: new URL(baseURL).origin, CORS_ORIGIN: new URL(baseURL).origin,
    PORT: new URL(apiURL).port || '3100' };
}
