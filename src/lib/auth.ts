import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getAuthConfig } from './env';
import db from './db';
import { authSchema } from './db/schema';
import { assignInitialRole } from './auth-role';

const config = getAuthConfig();
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: config.secret,
  baseURL: config.url,
  emailAndPassword: { enabled: true },
  databaseHooks: { user: { create: { after: async (user) => { await assignInitialRole(user.id); } } } },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' },
});
export type AuthSession = typeof auth.$Infer.Session;
