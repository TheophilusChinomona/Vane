import 'server-only';
import { pool } from '@/lib/db';

export async function assignInitialRole(userId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [918273645]);
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user" WHERE role = 'admin'`,
    );
    if (result.rows[0]?.count === '0') {
      await client.query(`UPDATE "user" SET role = 'admin' WHERE id = $1`, [userId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
