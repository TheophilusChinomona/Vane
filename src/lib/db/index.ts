import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';


const globalForDb = globalThis as unknown as { vanePool?: Pool };
const pool = globalForDb.vanePool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
});
if (process.env.NODE_ENV !== 'production') globalForDb.vanePool = pool;

const db = drizzle(pool, { schema });
export { pool };
export default db;
