import 'server-only';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from './db';
import { authSchema } from './db/schema';
import { assignInitialRole } from './auth-role';
import { consumeInvitation } from './invitations/service';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  user: { additionalFields: { role: { type: 'string', required: false, defaultValue: 'user', input: false } } },
  emailAndPassword: { enabled: true },
  hooks: { before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== '/sign-up/email') return;
    const body = ctx.body as { email?: string; inviteToken?: string };
    if (!body.email || !body.inviteToken || !(await consumeInvitation(body.email, body.inviteToken))) {
      throw new APIError('FORBIDDEN', { message: 'A valid invitation is required to sign up' });
    }
  }) },
  databaseHooks: { user: { create: { after: async (user) => { await assignInitialRole(user.id); } } } },
  advanced: { useSecureCookies: process.env.NODE_ENV === 'production' },
});
export type AuthSession = typeof auth.$Infer.Session;
