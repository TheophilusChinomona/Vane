import { Pool, type PoolClient } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDatabaseUrl } from '../env';

const splitStatements = (content: string) =>
  content
    .split(/--> statement-breakpoint/g)
    .map((statement) => statement.replace(/^\s*--.*$/gm, '').trim())
    .filter(Boolean);

export async function migrate() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [918273646]);
    await client.query(
      'CREATE TABLE IF NOT EXISTS "_vane_migrations" ("name" text PRIMARY KEY, "applied_at" timestamptz NOT NULL DEFAULT now())',
    );

    const folder = path.join(process.cwd(), 'drizzle');
    const files = (await fs.readdir(folder))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const name = file.split('_')[0] || file;
      const applied = await client.query(
        'SELECT 1 FROM "_vane_migrations" WHERE name = $1',
        [name],
      );
      if (applied.rowCount) continue;

      try {
        const content = await fs.readFile(path.join(folder, file), 'utf8');
        for (const statement of splitStatements(content)) {
          await client.query(statement);
        }
        await client.query(
          'INSERT INTO "_vane_migrations" (name) VALUES ($1)',
          [name],
        );
      } catch (error) {
        throw new Error(`Migration ${file} failed`, { cause: error });
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}

if (process.env.NODE_ENV !== 'test') {
  migrate().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Database migration failed',
    );
    process.exitCode = 1;
  });
}
