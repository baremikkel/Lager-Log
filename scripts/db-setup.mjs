// Creates/updates the tables (setup.sql) in the database from .env, without Docker.
// Used on the Raspberry Pi, where PostgreSQL is installed directly. Safe to run repeatedly.
//
//   npm run db:setup     tables, columns and default categories
//   npm run db:seed      the same, plus loose fruit and vegetables (seed_fruit_vegetables.sql)

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlDir = path.join(root, 'src', 'services', 'database');
const files = ['setup.sql'];
if (process.argv.includes('--seed')) files.push('seed_fruit_vegetables.sql');

const client = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

try {
  await client.connect();
  // Keep the output short: setup.sql uses "IF NOT EXISTS", which otherwise prints notices.
  await client.query('SET client_min_messages TO warning');
  for (const file of files) {
    const result = await client.query(readFileSync(path.join(sqlDir, file), 'utf8'));
    const last = Array.isArray(result) ? result.at(-1) : result;
    const added = file.startsWith('seed') ? ` (${last?.rowCount ?? 0} products added)` : '';
    console.log(`✓ ${file}${added}`);
  }
} catch (error) {
  console.error(`Database setup failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
