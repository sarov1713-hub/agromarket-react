import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { backendDir, localEnvironment } from '../scripts/e2e-environment.mjs';

export default async function teardown() {
  const env = localEnvironment();
  const require = createRequire(resolve(backendDir, 'package.json'));
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const { rows } = await pool.query('SELECT current_database() AS name');
    if (rows[0].name !== 'agromarket_test') throw new Error('Отказ очистки: это не agromarket_test.');
    // Реальный POST /orders допускает гостевую заявку и не заполняет user_id.
    await pool.query("DELETE FROM orders WHERE email LIKE 'e2e+%@agromarket.test' OR user_id IN (SELECT id FROM users WHERE email LIKE 'e2e+%@agromarket.test')");
    await pool.query("DELETE FROM users WHERE email LIKE 'e2e+%@agromarket.test'");
    await pool.query("DELETE FROM products WHERE name LIKE 'Lab12-%'");
    const remaining = await pool.query(`SELECT
      (SELECT count(*) FROM orders WHERE email LIKE 'e2e+%@agromarket.test')::int AS orders,
      (SELECT count(*) FROM users WHERE email LIKE 'e2e+%@agromarket.test')::int AS users,
      (SELECT count(*) FROM products WHERE name LIKE 'Lab12-%')::int AS products`);
    if (Object.values(remaining.rows[0]).some(count => count !== 0)) throw new Error('После E2E остались тестовые записи.');
  } finally { await pool.end(); }
}
