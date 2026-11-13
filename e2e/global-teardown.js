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
    await pool.query("DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e+%@agromarket.test')");
    await pool.query("DELETE FROM users WHERE email LIKE 'e2e+%@agromarket.test'");
    await pool.query("DELETE FROM products WHERE name LIKE 'Lab12-%'");
  } finally { await pool.end(); }
}
