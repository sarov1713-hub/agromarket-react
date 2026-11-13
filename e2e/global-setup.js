import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { backendDir, localEnvironment } from '../scripts/e2e-environment.mjs';

export default function setup() {
  // Сначала строгая проверка хоста и имени БД; seed backend выполняет собственную проверку.
  const env = localEnvironment();
  const result = spawnSync(process.execPath, [resolve(backendDir, 'db/seed.js')], { cwd: backendDir, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error('Не удалось подготовить локальную тестовую БД. Запустите PostgreSQL и проверьте .env.e2e.');
}
