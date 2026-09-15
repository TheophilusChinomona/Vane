import { Pool } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDatabaseUrl } from '../env';

const splitStatements = (sql: string) => sql.split(/--> statement-breakpoint/g).map(s => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
export async function migrate() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS "_vane_migrations" ("name" text PRIMARY KEY, "applied_at" timestamptz NOT NULL DEFAULT now())');
    const folder = path.join(process.cwd(), 'drizzle');
    const files = (await fs.readdir(folder)).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const name = file.split('_')[0] || file;
      const applied = await pool.query('SELECT 1 FROM "_vane_migrations" WHERE name = $1', [name]);
      if (applied.rowCount) continue;
      const client = await pool.connect();
      try { await client.query('BEGIN'); for (const statement of splitStatements(await fs.readFile(path.join(folder, file), 'utf8'))) await client.query(statement); await client.query('INSERT INTO "_vane_migrations" (name) VALUES ($1)', [name]); await client.query('COMMIT'); }
      catch (error) { await client.query('ROLLBACK'); throw new Error(`Migration ${file} failed`, { cause: error }); }
      finally { client.release(); }
    }
  } finally { await pool.end(); }
}
if (process.env.NODE_ENV !== 'test') migrate().catch(error => { console.error(error instanceof Error ? error.message : 'Database migration failed'); process.exitCode = 1; });
