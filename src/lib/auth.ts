import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from './db';
import { authSchema } from './db/schema';
import { assignInitialRole } from './auth-role';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  databaseHooks: { user: { create: { after: async (user) => { await assignInitialRole(user.id); } } } },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' },
});
export type AuthSession = typeof auth.$Infer.Session;
